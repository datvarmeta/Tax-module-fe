import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, ArrowRight, Shield, Zap, FileText, Headphones } from 'lucide-react';
import type { Product, CartItem } from '../types';
import { PRODUCTS, CATEGORIES, USDC_VND_RATE } from '../types';

interface Props {
  cart: CartItem[];
  onUpsertCartItem: (product: Product, selectedUSDC: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
  cartSubtotal: number;
  cartItemCount: number;
}

export function SelectStep({ cart, onUpsertCartItem, onRemoveFromCart, onProceedToCheckout, cartSubtotal, cartItemCount }: Props) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draftAmounts, setDraftAmounts] = useState<Record<string, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});

  const cartSubtotalUSDC = cart.reduce((sum, item) => sum + item.selectedUSDC, 0);

  const filtered = PRODUCTS.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCartItem = (productId: string) => cart.find(i => i.product.id === productId);

  const openAmountInput = (product: Product) => {
    const currentAmount = getCartItem(product.id)?.selectedUSDC ?? product.minUSDC;
    setDraftAmounts(prev => ({ ...prev, [product.id]: String(currentAmount) }));
    setExpandedId(product.id);
  };

  const applyAmount = (product: Product) => {
    const raw = draftAmounts[product.id] ?? String(product.minUSDC);
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < product.minUSDC || parsed > product.maxUSDC) {
      setInputErrors(prev => ({
        ...prev,
        [product.id]: `Please enter an amount between ${product.minUSDC.toLocaleString('en-US')} and ${product.maxUSDC.toLocaleString('en-US')} USDC.`,
      }));
      return;
    }

    setInputErrors(prev => ({ ...prev, [product.id]: '' }));
    onUpsertCartItem(product, parsed);
    setExpandedId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-24"
    >
      <div className="mb-7">
        <p className="inline-flex items-center text-[11px] tracking-wide uppercase font-bold text-cyan-700 bg-cyan-100/70 px-3 py-1 rounded-full mb-2">Step 1 of 3</p>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Choose Sponsor Packages</h1>
        <p className="text-sm text-slate-600 max-w-2xl">Pick the sponsor package that matches your goals, view pricing in both VND and USDC, and enter your preferred contribution amount.</p>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sponsor package..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 bg-white/80 rounded-xl text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                category === cat
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow'
                  : 'bg-white text-gray-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {filtered.map((product, i) => {
          const cartItem = getCartItem(product.id);
          const isSelected = !!cartItem;
          const minVND = product.minUSDC * USDC_VND_RATE;
          const maxVND = product.maxUSDC * USDC_VND_RATE;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl overflow-hidden transition-all group ${
                isSelected
                  ? 'ring-2 ring-teal-400/80 shadow-xl shadow-cyan-100/60'
                  : 'hover:shadow-xl hover:shadow-slate-200/80'
              }`}
            >
              <div
                className={`h-34 relative p-4 overflow-hidden ${product.image ? 'bg-slate-900' : `bg-gradient-to-br ${product.gradient}`}`}
                style={
                  product.image
                    ? {
                        backgroundImage: `url(${product.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {product.image && <div className="absolute inset-0 bg-slate-900/30" />}
                {product.badge && (
                  <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10`}>
                    {product.badge}
                  </span>
                )}
                <span className="absolute top-3 right-3 text-[10px] font-medium text-gray-600 bg-white/85 px-2 py-0.5 rounded-full z-10">
                  {product.category}
                </span>
                {isSelected && (
                  <span className="absolute bottom-3 right-3 bg-teal-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg z-10">
                    {cartItem.selectedUSDC.toLocaleString('en-US')} USDC
                  </span>
                )}
              </div>

              <div className="p-4 sm:p-5">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mb-3 rounded-xl bg-slate-50/90 border border-slate-100 p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {product.minUSDC.toLocaleString('en-US')} - {product.maxUSDC.toLocaleString('en-US')} USDC
                  </p>
                  <p className="text-xs text-gray-500">
                    ~ {minVND.toLocaleString('en-US')} VND - {maxVND.toLocaleString('en-US')} VND
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openAmountInput(product)}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:brightness-105 transition cursor-pointer shadow-sm"
                  >
                    {isSelected ? 'Update Amount' : 'Choose Amount'}
                  </button>
                  {isSelected && (
                    <button
                      onClick={() => onRemoveFromCart(product.id)}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-gray-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {expandedId === product.id && (
                  <div className="mt-3 p-3 rounded-xl border border-cyan-200 bg-cyan-50/60">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Input amount (USDC)</label>
                    <input
                      type="number"
                      min={product.minUSDC}
                      max={product.maxUSDC}
                      step="1"
                      value={draftAmounts[product.id] ?? ''}
                      onChange={e => setDraftAmounts(prev => ({ ...prev, [product.id]: e.target.value }))}
                      className="no-spinner w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none bg-white"
                    />
                    {inputErrors[product.id] && (
                      <p className="text-[11px] text-red-600 mt-1">{inputErrors[product.id]}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => applyAmount(product)}
                        className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold py-2 rounded-xl hover:brightness-105 transition cursor-pointer"
                      >
                        Save Amount
                      </button>
                      <button
                        onClick={() => setExpandedId(null)}
                        className="px-3 py-2 border border-slate-200 text-xs font-medium rounded-xl text-gray-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-2 glass-card rounded-2xl border border-white/70 px-5 py-4 flex flex-wrap justify-center gap-7 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <Shield size={14} className="text-teal-500" />
          Secured by Hedera Network
        </div>
        <div className="flex items-center gap-1.5">
          <Zap size={14} className="text-teal-500" />
          Instant VND Conversion
        </div>
        <div className="flex items-center gap-1.5">
          <FileText size={14} className="text-teal-500" />
          Auto VAT E-Invoice
        </div>
        <div className="flex items-center gap-1.5">
          <Headphones size={14} className="text-teal-500" />
          24/7 Support
        </div>
      </div>

      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white/88 backdrop-blur-xl border-t border-white shadow-[0_-12px_30px_rgba(15,23,42,0.1)] z-50"
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {cartItemCount} {cartItemCount === 1 ? 'package' : 'packages'} selected
                  </p>
                  <p className="text-xs text-gray-500">
                    Subtotal: {cartSubtotal.toLocaleString('en-US')} VND · {cartSubtotalUSDC.toLocaleString('en-US')} USDC
                  </p>
                </div>
              </div>
              <button
                onClick={onProceedToCheckout}
                className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:brightness-105 transition cursor-pointer text-sm shadow-lg shadow-cyan-200/60"
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
