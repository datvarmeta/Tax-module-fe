import { useState, useCallback, useRef, useEffect } from 'react';
import { useSignMessage } from 'wagmi';
import { useAppKitAccount, useAppKit, useDisconnect } from '@reown/appkit/react';
import type { Step, PaymentSubStep, InvoiceGenStatus, CustomerType, PersonalForm, BusinessForm, Product, CartItem } from '../types';
import { TAX_RATE, USDC_VND_RATE } from '../types';
import * as api from '../services/api';
import type { Invoice } from '../services/api';

function buildPaymentMessage(usdcAmount: string, vndAmount: number, itemCount: number): string {
  return [
    'Basal Pay Payment Authorization',
    '--------------------------------',
    `Amount: ${usdcAmount} USDC (~${vndAmount.toLocaleString('en-US')} VND)`,
    'Recipient: Basal Pay Gateway',
    'Network: Hedera Mainnet',
    `Items: ${itemCount} sponsor package${itemCount === 1 ? '' : 's'}`,
    `Timestamp: ${new Date().toISOString()}`,
    '--------------------------------',
    'By signing this message, you authorize Basal Pay',
    'to process this payment and issue a VAT invoice.',
  ].join('\n');
}

export function useSimulation() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [paymentSubStep, setPaymentSubStep] = useState<PaymentSubStep>('connect');
  const [invoiceGenStatus, setInvoiceGenStatus] = useState<InvoiceGenStatus>('idle');
  const [customerType, setCustomerType] = useState<CustomerType>('personal');
  const [cart, setCart] = useState<CartItem[]>([]);
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

  // --- Reown AppKit wallet state ---
  const { address, isConnected, status } = useAppKitAccount();
  const { open: openReownModal } = useAppKit();
  const { disconnect: disconnectWallet } = useDisconnect();
  const { mutateAsync: signMessageAsync } = useSignMessage();

  const isConnecting = status === 'connecting';

  const connectedWallet = isConnected && address ? address : null;

  // Auto-advance to confirm when wallet connects on the payment step
  useEffect(() => {
    if (isConnected && address && currentStep === 'payment' && paymentSubStep === 'connect') {
      setPaymentSubStep('confirm');
    }
  }, [isConnected, address, currentStep, paymentSubStep]);

  // Reset to connect when wallet disconnects mid-flow
  useEffect(() => {
    if (!isConnected && currentStep === 'payment' &&
      (paymentSubStep === 'confirm' || paymentSubStep === 'signing')) {
      setPaymentSubStep('connect');
      setError(null);
    }
  }, [isConnected, currentStep, paymentSubStep]);

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

    if (type === 'business' && !!business.taxCode.trim() && !business.companyAddress.trim()) {
      setError('Company Address is required when Tax Code is provided.');
      return;
    }

    const invalid = cart.find(item => item.selectedUSDC < item.product.minUSDC || item.selectedUSDC > item.product.maxUSDC);
    if (invalid) {
      setError(`Amount for ${invalid.product.name} must be between ${invalid.product.minUSDC.toLocaleString('en-US')} and ${invalid.product.maxUSDC.toLocaleString('en-US')} USDC.`);
      return;
    }

    // If already connected, skip straight to confirm
    setPaymentSubStep(isConnected ? 'confirm' : 'connect');
    setCurrentStep('payment');
  }, [cart, isConnected]);

  // --- Wallet ---
  const handleConnect = useCallback(() => {
    openReownModal();
  }, [openReownModal]);

  const handleDisconnectWallet = useCallback(() => {
    disconnectWallet();
    setPaymentSubStep('connect');
    setError(null);
  }, [disconnectWallet]);

  // --- Payment: initiate (sign) then process ---
  const handleInitiatePayment = useCallback(async () => {
    if (cart.length === 0) return;
    setError(null);
    setPaymentSubStep('signing');

    // Phase 1: sign message in HashPack (fake tx confirmation UX)
    const usdcAmount = (cartTotalWithTax / USDC_VND_RATE).toFixed(2);
    const message = buildPaymentMessage(usdcAmount, cartTotalWithTax, cart.length);

    let signature: string;
    try {
      signature = await signMessageAsync({ message });
    } catch {
      setError('Signature rejected or cancelled. Please try again.');
      setPaymentSubStep('confirm');
      return;
    }

    // Phase 2: Create invoice
    setPaymentSubStep('processing');
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

      const usdcTotal = cartTotalWithTax / USDC_VND_RATE;

      const items = cart.map((cartItem, index) => {
        const netAmount = Math.round(cartItem.selectedUSDC * USDC_VND_RATE);
        const itemTax = Math.round(netAmount * TAX_RATE / 100);
        const unitPriceUSDC = netAmount / USDC_VND_RATE;
        const taxUSDC = itemTax / USDC_VND_RATE;
        const lineTotalUSDC = unitPriceUSDC + taxUSDC;
        return {
          item_name: cartItem.product.name,
          quantity: 1,
          unit_price: netAmount,
          tax_percentage: TAX_RATE,
          tax_amount: itemTax,
          item_total_amount_without_tax: netAmount,
          item_total_amount_with_tax: netAmount + itemTax,
          token_unit_price: unitPriceUSDC,
          token_tax_amount: taxUSDC,
          token_line_total: lineTotalUSDC,
          line_number: index + 1,
          selection: 1,
          item_code: cartItem.product.id.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          unit_code: 'PKG',
          unit_name: 'Package',
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
        token_currency: 'USDC',
        exchange_rate: USDC_VND_RATE,
        token_total_amount: usdcTotal,
        token_tax_amount: cartTaxAmount / USDC_VND_RATE,
        token_net_amount: cartSubtotal / USDC_VND_RATE,
        payment_method: 'USDC',
        notes: `Email: ${email}`,
        issued_at: new Date().toISOString(),
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

    // Phase 3: Animate processing steps
    const steps = [
      'Broadcasting transaction to Hedera Network...',
      'Awaiting blockchain confirmation...',
      'Basal Pay converting USDC → VND...',
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

    // Phase 4: Use real signature as txHash
    setTxHash(signature);

    // Phase 5: Save tx hash + submit for Viettel publishing
    if (createdInvoiceId) {
      try { await api.updatePayment(createdInvoiceId, signature); } catch (err) { console.warn('Failed to save tx hash:', err); }
      try { await api.submitInvoice(createdInvoiceId); } catch (err) { console.warn('Submit failed:', err); }
    }

    setCurrentStep('success');
    setInvoiceGenStatus('generating');

    // Phase 6: Poll invoice status
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
  }, [cart, customerType, invoiceId, cartSubtotal, cartTaxAmount, cartTotalWithTax, signMessageAsync]);

  const handleCancelSigning = useCallback(() => {
    setPaymentSubStep('confirm');
    setError(null);
  }, []);

  const handleViewInvoice = useCallback(() => setCurrentStep('invoice'), []);

  const handleReset = useCallback(() => {
    setCurrentStep('select');
    setPaymentSubStep('connect');
    setInvoiceGenStatus('idle');
    setCart([]);
    setProcessingSteps([]);
    setInvoiceId(null);
    setInvoiceData(null);
    setTxHash('');
    setError(null);
  }, []);

  const handleBackToCheckout = useCallback(() => {
    setCurrentStep('checkout');
    setPaymentSubStep(isConnected ? 'confirm' : 'connect');
  }, [isConnected]);

  const handleBackToSelect = useCallback(() => setCurrentStep('select'), []);

  return {
    currentStep, paymentSubStep, invoiceGenStatus, customerType,
    cart, cartSubtotal, cartTaxAmount, cartTotalWithTax, cartItemCount,
    connectedWallet, isConnecting, processingSteps, invoiceId, invoiceData, txHash, error,
    personalFormRef, businessFormRef,
    upsertCartItem, removeFromCart, updateCartItemAmount,
    handleProceedToCheckout, handleCheckout,
    handleConnect, handleDisconnectWallet,
    handleInitiatePayment, handleCancelSigning,
    handleViewInvoice, handleReset, handleBackToCheckout, handleBackToSelect,
    setCustomerType,
  };
}
