import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, FileText, Copy, ShoppingCart } from 'lucide-react';
import type { CartItem, InvoiceGenStatus } from '../types';
import { USDC_VND_RATE } from '../types';
import type { Invoice } from '../services/api';

interface Props {
  cart: CartItem[];
  cartTotalWithTax: number;
  txHash: string;
  invoiceGenStatus: InvoiceGenStatus;
  invoiceData: Invoice | null;
  buyerName: string;
  onViewInvoice: () => void;
  onReset: () => void;
}

export function SuccessStep({ cart, cartTotalWithTax, txHash, invoiceGenStatus, invoiceData, buyerName, onViewInvoice, onReset }: Props) {
  const totalVND = invoiceData ? invoiceData.total_amount_with_tax : cartTotalWithTax;
  const totalUSDC = invoiceData
    ? invoiceData.token_total_amount
    : totalVND / USDC_VND_RATE;
  const displayBuyer = invoiceData ? invoiceData.buyer_name : buyerName;
  const status = invoiceData?.status || 'completed';

  const itemCount = cart.length;
  const serviceName = invoiceData?.items && invoiceData.items.length > 0
    ? (invoiceData.items.length === 1
      ? invoiceData.items[0].item_name
      : `${invoiceData.items[0].item_name} +${invoiceData.items.length - 1} more`)
    : (cart.length === 1
      ? cart[0].product.name
      : `${cart[0]?.product.name || 'Order'} +${cart.length - 1} more`);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      {/* Success Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-8 text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <CheckCircle2 size={56} className="text-teal-500 mx-auto mb-3" />
        </motion.div>
        <h2 className="text-2xl font-bold text-teal-700 mb-1">Payment Successful</h2>
        <p className="text-sm text-teal-600">Your transaction has been confirmed on the Hedera blockchain.</p>
      </div>

      {/* Transaction Receipt */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-5 h-5 bg-teal-100 rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.5"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
          </div>
          <span className="text-sm font-semibold text-gray-700">Transaction Receipt</span>
        </div>

        {/* Tx Hash */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Transaction Hash</p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-gray-900">{txHash}</span>
            <button
              onClick={() => navigator.clipboard.writeText(txHash)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailCell label="Items" value={`${itemCount} ${itemCount === 1 ? 'item' : 'items'} — ${serviceName}`} />
          <DetailCell label="Buyer" value={displayBuyer} />
          <DetailCell label="Amount Paid" value={`${totalUSDC.toLocaleString('en-US', { maximumFractionDigits: 2 })} USDC`} />
          <DetailCell label="VND Settled" value={`${totalVND.toLocaleString('en-US')} VND`} />
          <DetailCell label="Exchange Rate" value={`1 USDC = ${USDC_VND_RATE.toLocaleString('en-US')} VND`} />
          <DetailCell label="Time" value={invoiceData?.submitted_at ? new Date(invoiceData.submitted_at).toLocaleString('en-GB') : timeStr} />
          <DetailCell label="Network" value="Hedera Hashgraph" />
          <DetailCell
            label="Status"
            value={status === 'completed' ? 'Confirmed' : status === 'failed' ? 'Failed' : 'Processing...'}
            valueClass={status === 'completed' ? 'text-teal-600' : status === 'failed' ? 'text-red-600' : 'text-amber-600'}
          />
        </div>
      </div>

      {/* VAT E-Invoice */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-teal-600" />
            <span className="text-sm font-semibold text-gray-700">VAT E-Invoice</span>
          </div>
          {invoiceGenStatus === 'completed' && (
            <span className="text-[10px] font-bold text-teal-600 bg-teal-100 px-2.5 py-0.5 rounded-full">Issued</span>
          )}
        </div>

        {invoiceGenStatus === 'generating' ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Loader2 size={20} className="text-amber-500 animate-spin shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Generating VAT Invoice...</p>
              <p className="text-xs text-amber-600">Sending data to Viettel e-Invoice API</p>
            </div>
          </div>
        ) : invoiceGenStatus === 'completed' ? (
          <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
            <CheckCircle2 size={20} className="text-teal-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-teal-800">Invoice Generated</p>
              <p className="text-xs text-teal-600">
                {invoiceData?.transaction_uuid
                  ? `Viettel UUID: ${invoiceData.transaction_uuid}`
                  : 'Invoice ready to view and download'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {invoiceGenStatus === 'completed' ? (
          <button
            onClick={onViewInvoice}
            className="flex items-center justify-center gap-2 bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 transition cursor-pointer text-sm"
          >
            <FileText size={16} />
            View Invoice
          </button>
        ) : (
          <button
            disabled
            className="flex items-center justify-center gap-2 bg-amber-400 text-white py-3.5 rounded-xl font-semibold text-sm opacity-80 cursor-not-allowed"
          >
            <Loader2 size={16} className="animate-spin" />
            Generating Invoice...
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition cursor-pointer text-sm"
        >
          <ShoppingCart size={16} />
          Continue Shopping
        </button>
      </div>
    </motion.div>
  );
}

function DetailCell({ label, value, valueClass = 'text-gray-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}
