import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, Building2, ArrowRight, ArrowLeft, Lock, Upload, CheckCircle2, Trash2 } from 'lucide-react';
import type { CartItem, CustomerType, PersonalForm, BusinessForm } from '../types';
import { NETWORK_FEE, USDC_VND_RATE } from '../types';

interface Props {
  cart: CartItem[];
  cartSubtotal: number;
  cartTaxAmount: number;
  cartTotalWithTax: number;
  onRemoveFromCart: (productId: string) => void;
  initialPersonal: PersonalForm;
  initialBusiness: BusinessForm;
  initialType: CustomerType;
  onCheckout: (personal: PersonalForm, business: BusinessForm, type: CustomerType) => void;
  onBackToSelect: () => void;
  error: string | null;
}

export function CheckoutStep({
  cart, cartSubtotal, cartTaxAmount, cartTotalWithTax,
  onRemoveFromCart,
  initialPersonal, initialBusiness, initialType,
  onCheckout, onBackToSelect, error,
}: Props) {
  const [custType, setCustType] = useState<CustomerType>(initialType);
  const [personal, setPersonal] = useState<PersonalForm>(initialPersonal);
  const [business, setBusiness] = useState<BusinessForm>(initialBusiness);
  const bizLicenseRef = useRef<HTMLInputElement>(null);
  const authDocRef = useRef<HTMLInputElement>(null);

  const totalWithFee = cartTotalWithTax + NETWORK_FEE;
  const cartSubtotalUSDC = cart.reduce((sum, item) => sum + item.selectedUSDC, 0);
  const cartTaxAmountUSDC = cartTaxAmount / USDC_VND_RATE;
  const networkFeeUSDC = NETWORK_FEE / USDC_VND_RATE;
  const totalWithFeeUSDC = cartSubtotalUSDC + cartTaxAmountUSDC + networkFeeUSDC;
  const itemCount = cart.length;
  const isCompanyAddressRequired = business.taxCode.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheckout(personal, business, custType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="inline-flex items-center text-[11px] tracking-wide uppercase font-bold text-cyan-700 bg-cyan-100/70 px-3 py-1 rounded-full mb-2">Step 2 of 3</p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Checkout</h1>
        </div>
        <button
          onClick={onBackToSelect}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <ArrowLeft size={14} /> Continue Shopping
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Your Sponsor Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </div>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 p-3 bg-white/80 border border-slate-100 rounded-2xl">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.product.gradient} flex items-center justify-center shrink-0`}>
                    <div className="w-6 h-6 bg-white/50 rounded" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-gray-500">
                      Selected: {item.selectedUSDC.toLocaleString('en-US')} USDC · {(item.selectedUSDC * USDC_VND_RATE).toLocaleString('en-US')} VND
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm w-56 text-right">
                    {(item.selectedUSDC * USDC_VND_RATE).toLocaleString('en-US')} VND
                    <span className="block text-xs font-medium text-gray-500">
                      {item.selectedUSDC.toLocaleString('en-US')} USDC
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.product.id)}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Buyer Information</span>
            </div>

            {/* Tabs */}
            <div className="flex mb-5 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setCustType('personal')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition cursor-pointer ${
                  custType === 'personal'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Users size={14} /> Personal
              </button>
              <button
                type="button"
                onClick={() => setCustType('business')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition cursor-pointer ${
                  custType === 'business'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Building2 size={14} /> Business
              </button>
            </div>

            {custType === 'personal' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={e => setPersonal(p => ({ ...p, fullName: e.target.value }))}
                    placeholder="John Doe"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    value={personal.dob}
                    onChange={e => setPersonal(p => ({ ...p, dob: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0901 234 567"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tax Code (Optional)</label>
                    <input
                      type="text"
                      value={business.taxCode}
                      onChange={e => setBusiness(b => ({ ...b, taxCode: e.target.value }))}
                      placeholder="0312345678"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={business.companyName}
                      onChange={e => setBusiness(b => ({ ...b, companyName: e.target.value }))}
                      placeholder="ABC Company Ltd."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company Email (Optional)</label>
                    <input
                      type="email"
                      value={business.companyEmail}
                      onChange={e => setBusiness(b => ({ ...b, companyEmail: e.target.value }))}
                      placeholder="info@company.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Representative ID (Optional)</label>
                    <input
                      type="text"
                      value={business.representativeId}
                      onChange={e => setBusiness(b => ({ ...b, representativeId: e.target.value }))}
                      placeholder="012345678901"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Company Address {isCompanyAddressRequired ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    value={business.companyAddress}
                    onChange={e => setBusiness(b => ({ ...b, companyAddress: e.target.value }))}
                    placeholder="Street, District, City"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required={isCompanyAddressRequired}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business License (Optional)</label>
                    <input type="file" ref={bizLicenseRef} accept=".pdf,.jpg,.png" className="hidden"
                      onChange={e => setBusiness(b => ({ ...b, businessLicense: e.target.files?.[0] || null }))} />
                    <button
                      type="button"
                      onClick={() => bizLicenseRef.current?.click()}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm cursor-pointer transition ${
                        business.businessLicense
                          ? 'border-teal-300 bg-teal-50 text-teal-700'
                          : 'border-gray-300 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {business.businessLicense ? (
                        <>
                          <CheckCircle2 size={14} className="text-teal-500" />
                          <span className="truncate">{business.businessLicense.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Choose file (PDF, JPG, PNG)
                        </>
                      )}
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Authorization Document (Optional)</label>
                    <input type="file" ref={authDocRef} accept=".pdf,.jpg,.png" className="hidden"
                      onChange={e => setBusiness(b => ({ ...b, authorizationDoc: e.target.files?.[0] || null }))} />
                    <button
                      type="button"
                      onClick={() => authDocRef.current?.click()}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 border rounded-lg text-sm cursor-pointer transition ${
                        business.authorizationDoc
                          ? 'border-teal-300 bg-teal-50 text-teal-700'
                          : 'border-amber-300 bg-amber-50 text-amber-600 hover:border-amber-400'
                      }`}
                    >
                      {business.authorizationDoc ? (
                        <>
                          <CheckCircle2 size={14} className="text-teal-500" />
                          <span className="truncate">{business.authorizationDoc.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload size={14} />
                          Choose file (PDF, JPG, PNG)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Payment Method</span>
            </div>
            <div className="flex items-center gap-3 p-4 border-2 border-teal-400 bg-teal-50/50 rounded-xl">
              <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v12M6 12h12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">Crypto via Basal Pay</p>
                <p className="text-xs text-gray-500">Hashpack Wallet · Hedera Network · HBAR</p>
              </div>
              <CheckCircle2 size={20} className="text-teal-500" />
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Order Summary</span>
            </div>

            {/* Item breakdown */}
            <div className="space-y-2 text-sm mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2">
                    {item.product.name}
                  </span>
                  <div className="text-right shrink-0">
                    <span className="text-gray-900 block">
                      {(item.selectedUSDC * USDC_VND_RATE).toLocaleString('en-US')} VND
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      {item.selectedUSDC.toLocaleString('en-US')} USDC
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <div className="text-right">
                  <span className="text-gray-900 block">{cartSubtotal.toLocaleString('en-US')} VND</span>
                  <span className="text-[11px] text-gray-500 block">{cartSubtotalUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VAT (10%)</span>
                <div className="text-right">
                  <span className="text-gray-900 block">{cartTaxAmount.toLocaleString('en-US')} VND</span>
                  <span className="text-[11px] text-gray-500 block">{cartTaxAmountUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network Fee</span>
                <div className="text-right">
                  <span className="text-gray-900 block">{NETWORK_FEE.toLocaleString('en-US')} VND</span>
                  <span className="text-[11px] text-gray-500 block">{networkFeeUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <div className="text-right">
                  <span className="block">{totalWithFee.toLocaleString('en-US')} VND</span>
                  <span className="block text-xs text-gray-500">{totalWithFeeUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
            </div>

            {/* Crypto Conversion */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-cyan-200 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">U</span>
                </div>
                <span className="text-xs font-semibold text-teal-700">Crypto Conversion</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-mono">{totalWithFeeUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-lg">USDC</span></p>
              <p className="text-xs text-gray-500 mt-1">
                Rate: 1 USDC ~= {USDC_VND_RATE.toLocaleString('en-US')} VND
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:brightness-105 transition flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-cyan-200/60"
            >
              <ArrowRight size={16} />
              Proceed to Payment
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              <Lock size={10} className="inline mr-1" />
              Secured by Basal Pay · Hedera Blockchain
            </p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
