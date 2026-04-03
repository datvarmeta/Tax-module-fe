import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Loader2, Shield, ChevronRight, X } from 'lucide-react';
import type { CartItem, PaymentSubStep, WalletAccount } from '../types';
import { EXCHANGE_RATE, NETWORK_FEE, USDC_VND_RATE, WALLET_ACCOUNTS } from '../types';

interface Props {
  cart: CartItem[];
  cartTotalWithTax: number;
  subStep: PaymentSubStep;
  connectedWallet: string | null;
  showAccountsModal: boolean;
  processingSteps: { text: string; done: boolean }[];
  onOpenAccounts: () => void;
  onCloseAccounts: () => void;
  onSelectAccount: (address: string) => void;
  onDisconnect: () => void;
  onConfirm: () => void;
  onBackToCheckout: () => void;
  error: string | null;
}

export function PaymentStep({
  cart, cartTotalWithTax, subStep, connectedWallet, showAccountsModal, processingSteps,
  onOpenAccounts, onCloseAccounts, onSelectAccount, onDisconnect, onConfirm, onBackToCheckout,
  error,
}: Props) {
  const totalWithFee = cartTotalWithTax + NETWORK_FEE;
  const totalHBAR = (totalWithFee / EXCHANGE_RATE).toFixed(4);
  const cartSubtotalVND = cart.reduce((sum, item) => sum + item.selectedUSDC * USDC_VND_RATE, 0);
  const cartSubtotalUSDC = cart.reduce((sum, item) => sum + item.selectedUSDC, 0);
  const cartTaxAmountVND = cartTotalWithTax - cartSubtotalVND;
  const cartTotalWithTaxUSDC = cartSubtotalUSDC + cartTaxAmountVND / USDC_VND_RATE;
  const totalWithFeeUSDC = cartTotalWithTaxUSDC + NETWORK_FEE / USDC_VND_RATE;
  const itemCount = cart.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="mb-6">
        <p className="inline-flex items-center text-[11px] tracking-wide uppercase font-bold text-cyan-700 bg-cyan-100/70 px-3 py-1 rounded-full mb-2">Step 3 of 3</p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Payment Summary */}
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-teal-100 rounded flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
              </div>
              <span className="text-sm font-semibold text-gray-700">Payment Summary</span>
            </div>

            {/* Cart items compact list */}
            <div className="space-y-2 mb-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.product.gradient} flex items-center justify-center shrink-0`}>
                    <div className="w-4 h-4 bg-white/50 rounded" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900 block">
                      {(item.selectedUSDC * USDC_VND_RATE).toLocaleString('en-US')} VND
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      {item.selectedUSDC.toLocaleString('en-US')} USDC
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'} + VAT</span>
                <div className="text-right">
                  <span className="text-gray-900 block">{cartTotalWithTax.toLocaleString('en-US')} VND</span>
                  <span className="text-[11px] text-gray-500 block">{cartTotalWithTaxUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Network Fee</span>
                <div className="text-right">
                  <span className="text-gray-900 block">{NETWORK_FEE.toLocaleString('en-US')} VND</span>
                  <span className="text-[11px] text-gray-500 block">{(NETWORK_FEE / USDC_VND_RATE).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <div className="text-right">
                  <span className="block">{totalWithFee.toLocaleString('en-US')} VND</span>
                  <span className="block text-xs text-gray-500">{totalWithFeeUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* You Pay (Crypto) */}
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-cyan-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-teal-600 mb-1">You Pay (USDC)</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">{totalWithFeeUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} <span className="text-base">USDC</span></p>
            <p className="text-sm font-semibold text-gray-700">{totalWithFee.toLocaleString('en-US')} VND</p>
            <p className="text-xs text-gray-500 mt-1">Rate: 1 USDC ~= {USDC_VND_RATE.toLocaleString('en-US')} VND</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200 space-y-2">
              <p>{error}</p>
              <button
                onClick={onBackToCheckout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 cursor-pointer"
              >
                <ArrowLeft size={12} /> Back to Checkout to edit details
              </button>
            </div>
          )}
        </div>

        {/* Right — Wallet Flow */}
        <div className="glass-card rounded-2xl p-6">
          <AnimatePresence mode="wait">
            {subStep === 'connect' && (
              <ConnectView onOpenAccounts={onOpenAccounts} />
            )}
            {subStep === 'confirm' && connectedWallet && (
              <ConfirmView
                wallet={connectedWallet}
                totalHBAR={totalHBAR}
                totalVND={totalWithFee}
                totalUSDC={totalWithFeeUSDC}
                onConfirm={onConfirm}
                onDisconnect={onDisconnect}
                onBack={onBackToCheckout}
              />
            )}
            {subStep === 'processing' && (
              <ProcessingView steps={processingSteps} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {(subStep !== 'processing' || !!error) && (
        <button
          onClick={onBackToCheckout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mt-6 cursor-pointer bg-white/70 border border-white px-3 py-1.5 rounded-full"
        >
          <ArrowLeft size={14} /> Back to Checkout
        </button>
      )}

      {/* Accounts Modal */}
      <AccountsModal
        show={showAccountsModal}
        onClose={onCloseAccounts}
        onSelect={onSelectAccount}
      />
    </motion.div>
  );
}

/* --- Sub-views --- */

function ConnectView({ onOpenAccounts }: { onOpenAccounts: () => void }) {
  return (
    <motion.div
      key="connect"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-4"
    >
      <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Connect Your Wallet</h3>
      <p className="text-sm text-gray-500 mb-8">Connect your Hashpack wallet to authorize this payment on the Hedera Network.</p>

      {/* Hashpack */}
      <button
        onClick={onOpenAccounts}
        className="w-full flex items-center gap-4 p-4 border-2 border-cyan-300 bg-cyan-50/50 rounded-2xl hover:bg-cyan-50 transition cursor-pointer mb-3 text-left"
      >
        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">H</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Hashpack Wallet</p>
          <p className="text-xs text-gray-500">Hedera's native non-custodial wallet</p>
        </div>
        <span className="text-xs font-semibold text-teal-600 border border-teal-300 rounded-full px-2.5 py-0.5">Recommended</span>
      </button>

      {/* MetaMask */}
      <div className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl opacity-50 mb-6">
        <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-gray-500 font-bold text-lg">M</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-500 text-sm">MetaMask</p>
          <p className="text-xs text-gray-400">Coming soon</p>
        </div>
        <span className="text-xs text-gray-400">Soon</span>
      </div>

      <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
        <Shield size={12} /> Your credentials are never stored. Connection is encrypted via Hedera DID and Basal Pay protocol.
      </p>
    </motion.div>
  );
}

function ConfirmView({ wallet, totalHBAR, totalVND, totalUSDC, onConfirm, onDisconnect, onBack }: {
  wallet: string; totalHBAR: string; totalVND: number; totalUSDC: number;
  onConfirm: () => void; onDisconnect: () => void; onBack: () => void;
}) {
  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-2"
    >
      <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Wallet Connected</h3>
      <p className="text-sm text-gray-500 mb-5">Review and confirm your payment below.</p>

      {/* Connected Wallet */}
      <div className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-xl mb-5">
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-teal-600">Connected Wallet</p>
          <p className="font-mono font-bold text-gray-900 text-sm">{wallet}</p>
          <p className="text-xs text-gray-500">Hedera Hashgraph · HBAR</p>
        </div>
        <CheckCircle2 size={22} className="text-teal-500" />
      </div>

      {/* Transaction Details */}
      <div className="text-left mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Transaction Details</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Paying to</span><span className="font-medium text-gray-900">Basal Pay Gateway</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount (Crypto)</span><span className="font-medium text-gray-900">{totalHBAR} HBAR</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount (VND)</span><span className="font-medium text-gray-900">{totalVND.toLocaleString('en-US')} VND</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Amount (USDC)</span><span className="font-medium text-gray-900">{totalUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Exchange Rate</span><span className="font-medium text-gray-900">1 HBAR = {EXCHANGE_RATE.toLocaleString('en-US')} VND · 1 USDC ~= {USDC_VND_RATE.toLocaleString('en-US')} VND</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Network</span><span className="font-medium text-gray-900">Hedera Hashgraph</span></div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3.5 rounded-xl font-semibold hover:brightness-105 transition flex items-center justify-center gap-2 cursor-pointer text-sm mb-4 shadow-lg shadow-cyan-200/70"
      >
        <CheckCircle2 size={18} />
        Confirm Payment — {totalHBAR} HBAR
      </button>

      <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
        <button onClick={onDisconnect} className="hover:text-gray-600 cursor-pointer">Disconnect Wallet</button>
        <span>|</span>
        <button onClick={onBack} className="hover:text-gray-600 cursor-pointer">Back to Checkout</button>
      </div>
    </motion.div>
  );
}

function ProcessingView({ steps }: { steps: { text: string; done: boolean }[] }) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center py-6"
    >
      <div className="w-16 h-16 mx-auto mb-5 relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={64} className="text-teal-500" />
        </motion.div>
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Processing Transaction</h3>
      <p className="text-sm text-gray-500 mb-8">Please do not close this window.</p>

      <div className="space-y-3 text-left">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
              step.done
                ? 'bg-teal-50 border border-teal-200'
                : 'bg-amber-50 border border-amber-200'
            }`}
          >
            {step.done ? (
              <CheckCircle2 size={18} className="text-teal-500 shrink-0" />
            ) : (
              <Loader2 size={18} className="text-amber-500 animate-spin shrink-0" />
            )}
            <span className={step.done ? 'text-teal-700' : 'text-amber-700'}>{step.text}</span>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1">
        <Shield size={12} /> Secured by Hedera Blockchain
      </p>
    </motion.div>
  );
}

function AccountsModal({ show, onClose, onSelect }: {
  show: boolean; onClose: () => void; onSelect: (addr: string) => void;
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">Connect Hashpack</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><X size={18} className="text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5">Select your wallet account to connect</p>

        <div className="space-y-3">
          {WALLET_ACCOUNTS.map((acc: WalletAccount) => (
            <button
              key={acc.id}
              onClick={() => onSelect(acc.address)}
              className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50/30 transition cursor-pointer text-left"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
              </div>
              <div className="flex-1">
                <p className="font-mono font-bold text-gray-900 text-sm">{acc.address}</p>
                <p className="text-xs text-gray-500">{acc.network}</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-5 flex items-center justify-center gap-1">
          <Shield size={12} /> Read-only access · No custody of funds
        </p>
      </motion.div>
    </motion.div>
  );
}
