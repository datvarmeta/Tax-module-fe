import { useState, useCallback, useRef, useEffect } from 'react';
import type { Step, PaymentSubStep, InvoiceGenStatus, CustomerType, PersonalForm, BusinessForm, Product, CartItem } from '../types';
import { EXCHANGE_RATE, TAX_RATE, USDC_VND_RATE } from '../types';
import * as api from '../services/api';
import type { Invoice } from '../services/api';

export function useSimulation() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [paymentSubStep, setPaymentSubStep] = useState<PaymentSubStep>('connect');
  const [invoiceGenStatus, setInvoiceGenStatus] = useState<InvoiceGenStatus>('idle');
  const [customerType, setCustomerType] = useState<CustomerType>('personal');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<{ text: string; done: boolean }[]>([]);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<Invoice | null>(null);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  const personalFormRef = useRef<PersonalForm>({ fullName: '', dob: '', phone: '', email: '' });
  const businessFormRef = useRef<BusinessForm>({
    taxCode: '', companyName: '', companyEmail: '', representativeId: '',
    companyAddress: '', businessLicense: null, authorizationDoc: null,
  });

  // Redirect to select if cart becomes empty during checkout/payment
  useEffect(() => {
    if (cart.length === 0 && (currentStep === 'checkout' || currentStep === 'payment')) {
      setCurrentStep('select');
    }
  }, [cart, currentStep]);

  // --- Cart ---
  const upsertCartItem = useCallback((product: Product, selectedUSDC: number) => {
    if (!Number.isFinite(selectedUSDC) || selectedUSDC < product.minUSDC || selectedUSDC > product.maxUSDC) {
      setError(`Amount for ${product.name} must be between ${product.minUSDC.toLocaleString('en-US')} and ${product.maxUSDC.toLocaleString('en-US')} USDC.`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, selectedUSDC }
            : item
        );
      }
      return [...prev, { product, selectedUSDC }];
    });
    setError(null);
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateCartItemAmount = useCallback((productId: string, selectedUSDC: number) => {
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, selectedUSDC } : item
    ));
  }, []);

  // --- Cart totals ---
  const cartSubtotal = cart.reduce((sum, item) => sum + Math.round(item.selectedUSDC * USDC_VND_RATE), 0);
  const cartTaxAmount = Math.round(cartSubtotal * TAX_RATE / 100);
  const cartTotalWithTax = cartSubtotal + cartTaxAmount;
  const cartItemCount = cart.length;

  // --- Navigation ---
  const handleProceedToCheckout = useCallback(() => {
    if (cart.length === 0) return;
    setCurrentStep('checkout');
  }, [cart]);

  const handleCheckout = useCallback(async (personal: PersonalForm, business: BusinessForm, type: CustomerType) => {
    personalFormRef.current = personal;
    businessFormRef.current = business;
    setCustomerType(type);
    setError(null);
    if (cart.length === 0) return;

    const invalid = cart.find(item => item.selectedUSDC < item.product.minUSDC || item.selectedUSDC > item.product.maxUSDC);
    if (invalid) {
      setError(`Amount for ${invalid.product.name} must be between ${invalid.product.minUSDC.toLocaleString('en-US')} and ${invalid.product.maxUSDC.toLocaleString('en-US')} USDC.`);
      return;
    }

    setPaymentSubStep('connect');
    setConnectedWallet(null);
    setCurrentStep('payment');
  }, [cart]);

  // --- Wallet ---
  const handleOpenAccountsModal = useCallback(() => setShowAccountsModal(true), []);
  const handleCloseAccountsModal = useCallback(() => setShowAccountsModal(false), []);

  const handleSelectAccount = useCallback((address: string) => {
    setConnectedWallet(address);
    setShowAccountsModal(false);
    setPaymentSubStep('confirm');
  }, []);

  const handleDisconnectWallet = useCallback(() => {
    setConnectedWallet(null);
    setPaymentSubStep('connect');
  }, []);

  // --- Payment ---
  const handleConfirmPayment = useCallback(async () => {
    setPaymentSubStep('processing');
    setError(null);
    if (cart.length === 0) return;

    // Step 1: Create invoice
    let createdInvoiceId = invoiceId;
    try {
      const personal = personalFormRef.current;
      const business = businessFormRef.current;
      const type = customerType;

      const name = type === 'business' ? business.companyName : personal.fullName;
      const legalName = type === 'business' ? business.companyName : '';
      const taxCode = type === 'business' ? business.taxCode : '';
      const addr = type === 'business' ? business.companyAddress : '';
      const email = type === 'business' ? business.companyEmail : personal.email;
      const phone = type === 'personal' ? personal.phone : '';

      const hbarTotal = cartTotalWithTax / EXCHANGE_RATE;

      const items = cart.map(cartItem => {
        const netAmount = Math.round(cartItem.selectedUSDC * USDC_VND_RATE);
        const itemTax = Math.round(netAmount * TAX_RATE / 100);
        return {
          item_name: cartItem.product.name,
          quantity: 1,
          unit_price: netAmount,
          tax_percentage: TAX_RATE,
          tax_amount: itemTax,
          item_total_amount_without_tax: netAmount,
          item_total_amount_with_tax: netAmount + itemTax,
          unit_name: 'License',
        };
      });

      const invoice = await api.createInvoice({
        buyer_name: name,
        buyer_legal_name: legalName,
        buyer_tax_code: taxCode,
        buyer_address: addr,
        buyer_email: email,
        buyer_phone: phone,
        currency: 'VND',
        total_amount_with_tax: cartTotalWithTax,
        total_tax_amount: cartTaxAmount,
        total_amount_without_tax: cartSubtotal,
        token_currency: 'HBAR',
        exchange_rate: EXCHANGE_RATE,
        hbar_amount: hbarTotal,
        token_total_amount: hbarTotal,
        token_tax_amount: cartTaxAmount / EXCHANGE_RATE,
        token_net_amount: cartSubtotal / EXCHANGE_RATE,
        notes: `Email: ${email}`,
        items,
      });
      createdInvoiceId = invoice.id;
      setInvoiceId(invoice.id);
      setInvoiceData(invoice);
    } catch (err) {
      setError(`Backend error: ${err instanceof Error ? err.message : 'Unknown'}`);
      setPaymentSubStep('confirm');
      return;
    }

    // Step 2: Simulate blockchain processing
    const steps = [
      'Broadcasting transaction to Hedera Network...',
      'Awaiting blockchain confirmation...',
      'Basal Pay converting HBAR → VND...',
      'Transferring VND to merchant...',
    ];
    const processed = steps.map(t => ({ text: t, done: false }));
    setProcessingSteps([...processed]);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
      processed[i].done = true;
      setProcessingSteps([...processed]);
    }
    await new Promise(r => setTimeout(r, 500));

    const chars = '0123456789abcdef';
    const hash = '0x' + Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') + '...' +
      Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setTxHash(hash);

    // Step 3: Save tx hash + submit for Viettel publishing
    if (createdInvoiceId) {
      try { await api.updatePayment(createdInvoiceId, hash); } catch (err) { console.warn('Failed to save tx hash:', err); }
      try { await api.submitInvoice(createdInvoiceId); } catch (err) { console.warn('Submit failed:', err); }
    }

    setCurrentStep('success');
    setInvoiceGenStatus('generating');

    // Step 4: Poll invoice status
    if (createdInvoiceId) {
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const s = await api.getInvoiceStatus(createdInvoiceId!);
          if (s.status === 'completed' || s.status === 'failed' || attempts >= 20) {
            try {
              const full = await api.getInvoice(createdInvoiceId!);
              setInvoiceData(full);
            } catch { /* keep existing data */ }
            setInvoiceGenStatus('completed');
            return;
          }
        } catch {
          if (attempts >= 20) { setInvoiceGenStatus('completed'); return; }
        }
        setTimeout(poll, 2000);
      };
      setTimeout(poll, 2000);
    }
  }, [cart, customerType, invoiceId, cartSubtotal, cartTaxAmount, cartTotalWithTax]);

  const handleViewInvoice = useCallback(() => setCurrentStep('invoice'), []);

  const handleReset = useCallback(() => {
    setCurrentStep('select');
    setPaymentSubStep('connect');
    setInvoiceGenStatus('idle');
    setCart([]);
    setConnectedWallet(null);
    setShowAccountsModal(false);
    setProcessingSteps([]);
    setInvoiceId(null);
    setInvoiceData(null);
    setTxHash('');
    setError(null);
  }, []);

  const handleBackToCheckout = useCallback(() => {
    setCurrentStep('checkout');
    setPaymentSubStep('connect');
    setConnectedWallet(null);
  }, []);
  const handleBackToSelect = useCallback(() => setCurrentStep('select'), []);

  return {
    currentStep, paymentSubStep, invoiceGenStatus, customerType,
    cart, cartSubtotal, cartTaxAmount, cartTotalWithTax, cartItemCount,
    connectedWallet, showAccountsModal, processingSteps, invoiceId, invoiceData, txHash, error,
    personalFormRef, businessFormRef,
    upsertCartItem, removeFromCart, updateCartItemAmount,
    handleProceedToCheckout, handleCheckout,
    handleOpenAccountsModal, handleCloseAccountsModal, handleSelectAccount,
    handleDisconnectWallet, handleConfirmPayment,
    handleViewInvoice, handleReset, handleBackToCheckout, handleBackToSelect,
    setCustomerType,
  };
}
