import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Plus, Minus, ArrowRight, Shield, Zap, FileText, Headphones } from 'lucide-react';
import type { Product, CartItem } from '../types';
import { PRODUCTS, CATEGORIES } from '../types';

interface Props {
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onProceedToCheckout: () => void;
  cartSubtotal: number;
  cartItemCount: number;
}

export function SelectStep({ cart, onAddToCart, onUpdateQuantity, onProceedToCheckout, cartSubtotal, cartItemCount }: Props) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = PRODUCTS.filter(p => {
    if (category !== 'All' && p.category !== category) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCartQuantity = (productId: string) => {
    const item = cart.find(i => i.product.id === productId);
    return item?.quantity || 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-24"
    >
      {/* Title */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-teal-600 mb-1">STEP 1 OF 3</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Choose Services</h1>
        <p className="text-sm text-gray-500">Add products to your cart, pay with HBAR via Basal Pay.</p>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none w-52"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                category === cat
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {filtered.map((product, i) => {
          const qty = getCartQuantity(product.id);
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-xl overflow-hidden transition-all group ${
                qty > 0
                  ? 'border-2 border-teal-400 shadow-md shadow-teal-50'
                  : 'border border-gray-200 hover:shadow-lg'
              }`}
            >
              {/* Card header */}
              <div className={`h-32 bg-gradient-to-br ${product.gradient} relative p-4`}>
                {product.badge && (
                  <span className={`absolute top-3 left-3 ${product.badgeColor} text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
                    {product.badge}
                  </span>
                )}
                <span className="absolute top-3 right-3 text-[10px] font-medium text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">
                  {product.category}
                </span>
                {qty > 0 && (
                  <span className="absolute bottom-3 right-3 bg-teal-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                    {qty}
                  </span>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {product.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Price + Cart controls */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">
                    {product.priceVND.toLocaleString('vi-VN')} đ
                  </span>
                  {qty === 0 ? (
                    <button
                      onClick={() => onAddToCart(product)}
                      className="flex items-center gap-1.5 bg-teal-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-teal-600 transition cursor-pointer"
                    >
                      <Plus size={14} /> Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQuantity(product.id, qty - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-100 transition cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">{qty}</span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, qty + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Features */}
      <div className="border-t border-gray-200 pt-6 flex flex-wrap justify-center gap-8 text-xs text-gray-500">
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

      {/* Floating Cart Bar */}
      <AnimatePresence>
        {cartItemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50"
          >
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
                  </p>
                  <p className="text-xs text-gray-500">
                    Subtotal: {cartSubtotal.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
              <button
                onClick={onProceedToCheckout}
                className="flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-teal-600 transition cursor-pointer text-sm"
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
