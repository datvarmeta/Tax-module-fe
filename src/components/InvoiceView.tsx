import { motion } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle2, Download, ShoppingCart, FileText, Loader2 } from 'lucide-react';
import type { CartItem, CustomerType, PersonalForm, BusinessForm } from '../types';
import { TAX_RATE } from '../types';
import type { Invoice } from '../services/api';
import { downloadInvoicePDF } from '../services/api';

const SELLER_INFO = {
  legalName: 'Công ty Cổ phần Công nghệ Varmeta',
  taxCode: '0100109106-507',
  address: 'Tầng 5, Tòa nhà Indochina Riverside, 74 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng',
  phone: '0236 3800 999',
  email: 'invoice@varmeta.io',
  bankName: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)',
  bankAccount: '0071004123456',
};

interface Props {
  cart: CartItem[];
  cartSubtotal: number;
  cartTaxAmount: number;
  cartTotalWithTax: number;
  customerType: CustomerType;
  personal: PersonalForm;
  business: BusinessForm;
  invoiceId: string | null;
  invoiceData: Invoice | null;
  onReset: () => void;
}

export function InvoiceView({ cart, cartSubtotal, cartTaxAmount, cartTotalWithTax, customerType, personal, business, invoiceId, invoiceData, onReset }: Props) {
  const [downloading, setDownloading] = useState(false);
  const hasApiData = !!invoiceData;

  const buyerName = hasApiData ? invoiceData.buyer_name : (customerType === 'business' ? business.companyName : personal.fullName);
  const buyerTax = hasApiData ? (invoiceData.buyer_tax_code || '') : (customerType === 'business' ? business.taxCode : '');
  const buyerEmail = hasApiData ? (invoiceData.buyer_email || '') : (customerType === 'business' ? business.companyEmail : personal.email);
  const buyerAddress = hasApiData ? (invoiceData.buyer_address || '') : (customerType === 'business' ? business.companyAddress : '');

  const items = invoiceData?.items || [];
  const netAmount = hasApiData ? invoiceData.total_amount_without_tax : cartSubtotal;
  const taxAmount = hasApiData ? invoiceData.total_tax_amount : cartTaxAmount;
  const totalAmount = hasApiData ? invoiceData.total_amount_with_tax : cartTotalWithTax;
  const vatRate = items.length > 0 ? items[0].tax_percentage : TAX_RATE;

  const now = new Date();
  const dateStr = invoiceData?.completed_at
    ? new Date(invoiceData.completed_at).toLocaleDateString('vi-VN')
    : `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['Cart', 'Checkout', 'Payment', 'Invoice'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-teal-300" />}
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${i < 3 ? 'bg-teal-500' : 'bg-teal-100'
                }`}>
                {i < 3 ? (
                  <CheckCircle2 size={14} className="text-white" />
                ) : (
                  <FileText size={12} className="text-teal-600" />
                )}
              </div>
              <span className={`text-[10px] ${i === 3 ? 'text-teal-600 font-semibold' : 'text-gray-500'}`}>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Badge */}
      <div className="flex justify-center mb-4">
        <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">
          <CheckCircle2 size={12} /> Invoice Issued Successfully
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">VAT E-Invoice</h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Issued via Viettel e-Invoice API · Legally valid under Vietnamese law
      </p>

      {/* Invoice Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        {/* Seller Header */}
        <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mt-0.5">
              <span className="text-white font-bold text-xs">VM</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{SELLER_INFO.legalName}</h3>
              <p className="text-xs text-gray-500">Tax Code: {SELLER_INFO.taxCode}</p>
              <p className="text-xs text-gray-500">{SELLER_INFO.address}</p>
              <p className="text-xs text-gray-500">Phone: {SELLER_INFO.phone} · Email: {SELLER_INFO.email}</p>
              <p className="text-xs text-gray-500">{SELLER_INFO.bankName} · {SELLER_INFO.bankAccount}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block border border-teal-500 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded mb-1">GTGT / VAT INVOICE</span>
            <p className="text-xs text-gray-500">Serial: <span className="font-semibold text-gray-900">C26TXS</span></p>
            <p className="text-xs text-gray-500">No: <span className="font-semibold text-gray-900">00002417</span></p>
            <p className="text-xs text-gray-500">Date: <span className="font-semibold text-gray-900">{dateStr}</span></p>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="mb-6 pb-5 border-b border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Buyer Information</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Buyer Name: </span>
              <span className="text-gray-900">{buyerName || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Tax Code: </span>
              <span className="text-gray-900">{buyerTax || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Email: </span>
              <span className="text-gray-900">{buyerEmail || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Address: </span>
              <span className="text-gray-900">{buyerAddress || '—'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs font-semibold text-gray-500">Description</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Unit</th>
                <th className="text-center py-2 text-xs font-semibold text-gray-500">Qty</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Unit Price</th>
                <th className="text-right py-2 text-xs font-semibold text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item, i) => (
                  <tr key={item.id || i} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{item.item_name}</td>
                    <td className="py-3 text-center text-gray-500">{item.unit_name || 'License'}</td>
                    <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">{item.unit_price.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 text-right font-semibold text-teal-600">{item.item_total_amount_with_tax.toLocaleString('vi-VN')} đ</td>
                  </tr>
                ))
              ) : (
                cart.map(cartItem => (
                  <tr key={cartItem.product.id} className="border-b border-gray-100">
                    <td className="py-3 text-gray-900">{cartItem.product.name}</td>
                    <td className="py-3 text-center text-gray-500">License</td>
                    <td className="py-3 text-center text-gray-500">{cartItem.quantity}</td>
                    <td className="py-3 text-right text-gray-500">{cartItem.product.priceVND.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 text-right font-semibold text-teal-600">
                      {(cartItem.product.priceVND * cartItem.quantity).toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{netAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">VAT ({vatRate}%)</span>
              <span className="text-teal-600">{taxAmount.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-base">
              <span className="text-gray-700">Total Amount</span>
              <span className="text-gray-900">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Footer: Viettel Code + Blockchain ref */}
        {/* <div className="flex items-end justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Viettel Invoice Code</p>
            <span className="inline-block font-mono font-bold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1 rounded text-sm">
              {invoiceCode}
            </span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-1">Blockchain Reference</p>
            <p className="font-mono text-xs text-gray-500">{txHash}</p>
          </div>
        </div> */}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={async () => {
            if (!invoiceId) return;
            setDownloading(true);
            try {
              await downloadInvoicePDF(invoiceId);
            } catch (e) {
              console.error('Failed to download PDF', e);
            } finally {
              setDownloading(false);
            }
          }}
          disabled={!invoiceId || downloading}
          className="flex items-center justify-center gap-2 bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 transition cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {downloading ? 'Downloading...' : 'Download PDF'}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition cursor-pointer text-sm"
        >
          <ShoppingCart size={16} />
          New Order
        </button>
      </div>

      {/* Legal footer */}
      <p className="text-[10px] text-gray-400 text-center">
        This invoice is legally valid per Vietnam's Decree 123/2020/ND-CP on e-invoices. Verify at einvoice.viettel.vn
      </p>
    </motion.div>
  );
}
