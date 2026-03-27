import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Users, Building2, ArrowRight, ArrowLeft, Lock, Upload, CheckCircle2, Plus, Minus, Trash2 } from 'lucide-react';
import type { CartItem, CustomerType, PersonalForm, BusinessForm } from '../types';
import { EXCHANGE_RATE, NETWORK_FEE } from '../types';

interface Props {
  cart: CartItem[];
  cartSubtotal: number;
  cartTaxAmount: number;
  cartTotalWithTax: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
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
  onUpdateQuantity, onRemoveFromCart,
  initialPersonal, initialBusiness, initialType,
  onCheckout, onBackToSelect, error,
}: Props) {
  const [custType, setCustType] = useState<CustomerType>(initialType);
  const [personal, setPersonal] = useState<PersonalForm>(initialPersonal);
  const [business, setBusiness] = useState<BusinessForm>(initialBusiness);
  const bizLicenseRef = useRef<HTMLInputElement>(null);
  const authDocRef = useRef<HTMLInputElement>(null);

  const totalWithFee = cartTotalWithTax + NETWORK_FEE;
  const totalHBAR = (totalWithFee / EXCHANGE_RATE).toFixed(4);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
          <p className="text-sm font-semibold text-teal-600 mb-1">STEP 2 OF 3</p>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Your Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
            </div>
            <div className="space-y-3">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.product.gradient} flex items-center justify-center shrink-0`}>
                    <div className="w-6 h-6 bg-white/50 rounded" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{item.product.name}</h4>
                    <p className="text-xs text-gray-500">{item.product.priceVND.toLocaleString('vi-VN')} đ / unit</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-7 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-teal-500 text-white hover:bg-teal-600 transition cursor-pointer"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm w-28 text-right">
                    {(item.product.priceVND * item.quantity).toLocaleString('vi-VN')} đ
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
          <div className="bg-white rounded-xl border border-gray-200 p-5">
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
                    placeholder="Nguyen Van An"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    value={personal.dob}
                    onChange={e => setPersonal(p => ({ ...p, dob: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0901 234 567"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={personal.email}
                    onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tax Code *</label>
                    <input
                      type="text"
                      value={business.taxCode}
                      onChange={e => setBusiness(b => ({ ...b, taxCode: e.target.value }))}
                      placeholder="0312345678"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      required
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company Email *</label>
                    <input
                      type="email"
                      value={business.companyEmail}
                      onChange={e => setBusiness(b => ({ ...b, companyEmail: e.target.value }))}
                      placeholder="info@company.com"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Representative ID *</label>
                    <input
                      type="text"
                      value={business.representativeId}
                      onChange={e => setBusiness(b => ({ ...b, representativeId: e.target.value }))}
                      placeholder="012345678901"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Address *</label>
                  <input
                    type="text"
                    value={business.companyAddress}
                    onChange={e => setBusiness(b => ({ ...b, companyAddress: e.target.value }))}
                    placeholder="Street, District, City"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Business License *</label>
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Authorization Document *</label>
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
                    {!business.authorizationDoc && (
                      <p className="text-[10px] text-amber-500 mt-1">Please upload authorization document</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
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
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart size={16} className="text-teal-600" />
              <span className="text-sm font-semibold text-gray-700">Order Summary</span>
            </div>

            {/* Item breakdown */}
            <div className="space-y-2 text-sm mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex justify-between">
                  <span className="text-gray-500 truncate mr-2">
                    {item.product.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                  </span>
                  <span className="text-gray-900 shrink-0">
                    {(item.product.priceVND * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{cartSubtotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">VAT (10%)</span>
                <span className="text-gray-900">{cartTaxAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network Fee</span>
                <span className="text-gray-900">{NETWORK_FEE.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{totalWithFee.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Crypto Conversion */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">H</span>
                </div>
                <span className="text-xs font-semibold text-teal-700">Crypto Conversion</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-mono">{totalHBAR} <span className="text-lg">HBAR</span></p>
              <p className="text-xs text-gray-500 mt-1">Rate: 1 HBAR = {EXCHANGE_RATE.toLocaleString('vi-VN')} VND</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mb-4">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-teal-500 text-white py-3 rounded-xl font-medium hover:bg-teal-600 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
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
