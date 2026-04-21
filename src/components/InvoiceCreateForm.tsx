import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { CreateInvoiceBody, CreateInvoiceItem } from '../services/api';

type FormState = {
  buyerName: string;
  buyerAddress: string;
  buyerPhone: string;
  buyerEmail: string;
  paymentMethod: string;
  currency: string;
  issuedAt: string;
  notes: string;
};

type ItemState = {
  selection: string;
  itemName: string;
  itemCode: string;
  unitName: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discount: string;
  tokenAmount: string;
};

type Props = {
  onSubmit: (body: CreateInvoiceBody) => Promise<void>;
  onCancel: () => void;
};

function parseNum(s: string): number {
  const n = Number(String(s).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function fmtNum(n: number): string {
  return n.toLocaleString('vi-VN');
}

function fmtToken(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 8 });
}

const ONES = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function convertGroup(n: number): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const t = Math.floor(rem / 10);
  const o = rem % 10;
  let r = '';
  if (h) r += ONES[h] + ' trăm';
  if (t > 1) {
    r += (r ? ' ' : '') + ONES[t] + ' mươi';
    if (o === 1) r += ' mốt';
    else if (o) r += ' ' + ONES[o];
  } else if (t === 1) {
    r += (r ? ' ' : '') + 'mười';
    if (o) r += ' ' + ONES[o];
  } else if (o) {
    r += (r && h ? ' lẻ ' : '') + ONES[o];
  }
  return r;
}

function toWordsVN(num: number): string {
  if (!num) return 'Không đồng';
  const n = Math.round(num);
  const parts: string[] = [];
  const b = Math.floor(n / 1e9);
  const m = Math.floor((n % 1e9) / 1e6);
  const th = Math.floor((n % 1e6) / 1e3);
  const r = n % 1e3;
  if (b) parts.push(convertGroup(b) + ' tỷ');
  if (m) parts.push(convertGroup(m) + ' triệu');
  if (th) parts.push(convertGroup(th) + ' nghìn');
  if (r) parts.push(convertGroup(r));
  if (!parts.length) return 'Không đồng';
  const s = parts.join(' ');
  return s.charAt(0).toUpperCase() + s.slice(1) + ' đồng';
}

function getLocalDatetime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyItem = (): ItemState => ({
  selection: '1',
  itemName: '',
  itemCode: '',
  unitName: 'Lần',
  quantity: '1',
  unitPrice: '',
  taxRate: '10',
  discount: '',
  tokenAmount: '',
});

const initForm: FormState = {
  buyerName: '',
  buyerAddress: '',
  buyerPhone: '',
  buyerEmail: '',
  paymentMethod: 'TM/CK',
  currency: 'VND',
  issuedAt: getLocalDatetime(),
  notes: '',
};

const SELECTION_LABELS: Record<string, string> = {
  '1': 'Hàng hóa',
  '2': 'Ghi chú',
  '3': 'Chiết khấu',
  '4': 'Bảng/Phí',
  '5': 'Khuyến mãi',
};

const TAX_OPTIONS = [
  { value: '-2', label: 'KKKNT' },
  { value: '-1', label: 'KCT' },
  { value: '0', label: '0%' },
  { value: '5', label: '5%' },
  { value: '8', label: '8%' },
  { value: '10', label: '10%' },
];


const I = 'w-full app-input text-sm';
const S = 'w-full app-select text-sm';

export function InvoiceCreateForm({ onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<FormState>(initForm);
  const [items, setItems] = useState<ItemState[]>([emptyItem()]);
  const [open, setOpen] = useState({ cust: true, inv: true, detail: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setF = useCallback((k: keyof FormState, v: string | boolean) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const setItem = useCallback((i: number, k: keyof ItemState, v: string) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  }, []);

  const toggle = (k: keyof typeof open) => setOpen(prev => ({ ...prev, [k]: !prev[k] }));

  const itemCalcs = useMemo(() =>
    items.map(it => {
      const qty = parseNum(it.quantity);
      const price = parseNum(it.unitPrice);
      const disc = parseNum(it.discount);
      const taxPct = parseNum(it.taxRate);
      const base = qty * price;
      const discAmt = Math.round(base * disc / 100);
      const withoutTax = base - discAmt;
      const tax = taxPct >= 0 ? Math.round(withoutTax * taxPct / 100) : 0;
      return { base, discAmt, withoutTax, tax, withTax: withoutTax + tax };
    }),
    [items]
  );

  const totals = useMemo(() => {
    const beforeTax = itemCalcs.reduce((s, c) => s + c.withoutTax, 0);
    const taxAmt = itemCalcs.reduce((s, c) => s + c.tax, 0);
    return { beforeTax, taxAmt, afterTax: beforeTax + taxAmt };
  }, [itemCalcs]);

  const totalTokenAmount = useMemo(() =>
    items.reduce((s, item) => s + parseNum(item.tokenAmount), 0),
    [items]
  );

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!form.buyerName.trim()) {
      setError('Tên người mua là bắt buộc.');
      return;
    }
    if (items.some(i => !i.itemName.trim() || parseNum(i.quantity) <= 0 || parseNum(i.unitPrice) <= 0)) {
      setError('Mỗi dòng hàng cần có tên hàng, số lượng và đơn giá > 0.');
      return;
    }

    const apiItems: CreateInvoiceItem[] = items.map((it, idx) => {
      const c = itemCalcs[idx];
      const taxPct = parseNum(it.taxRate);
      const disc = parseNum(it.discount);
      const tokenAmt = parseNum(it.tokenAmount);
      return {
        item_name: it.itemName,
        quantity: parseNum(it.quantity),
        unit_price: parseNum(it.unitPrice),
        unit_price_with_tax: Math.round(parseNum(it.unitPrice) * (1 + (taxPct >= 0 ? taxPct : 0) / 100)),
        tax_percentage: taxPct,
        tax_amount: c.tax,
        item_total_amount_without_tax: c.withoutTax,
        item_total_amount_with_tax: c.withTax,
        discount: disc > 0 ? disc : undefined,
        line_number: idx + 1,
        item_type: 1,
        selection: parseInt(it.selection) || 1,
        item_code: it.itemCode || undefined,
        unit_code: 'LAN',
        unit_name: it.unitName || 'Lần',
        token_line_total: tokenAmt > 0 ? tokenAmt : undefined,
      };
    });

    const body: CreateInvoiceBody = {
      buyer_name: form.buyerName,
      buyer_address: form.buyerAddress || undefined,
      buyer_email: form.buyerEmail || undefined,
      buyer_phone: form.buyerPhone || undefined,
      currency: form.currency || 'VND',
      total_amount_without_tax: totals.beforeTax,
      total_tax_amount: totals.taxAmt,
      total_amount_with_tax: totals.afterTax,
      token_currency: 'USDC',
      token_total_amount: totalTokenAmount > 0 ? totalTokenAmount : undefined,
      payment_method: form.paymentMethod || undefined,
      notes: form.notes || undefined,
      issued_at: form.issuedAt ? new Date(form.issuedAt).toISOString() : new Date().toISOString(),
      items: apiItems,
    };

    setSubmitting(true);
    try {
      await onSubmit(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }, [form, items, itemCalcs, totals, totalTokenAmount, onSubmit]);

  const SH = ({ title, k, badge }: { title: string; k: keyof typeof open; badge?: string }) => (
    <button
      type="button"
      className="w-full section-head flex items-center justify-between border-b soft-divider px-4 py-2.5 text-left"
      onClick={() => toggle(k)}
    >
      <div className="flex items-center gap-2">
        <span className="w-1 h-4 bg-teal-600 block rounded-sm shrink-0" />
        <span className="text-teal-800 font-semibold text-xs uppercase tracking-wide">{title}</span>
        {badge && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded">{badge}</span>}
      </div>
      {open[k] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
    </button>
  );

  const LBL = 'text-xs text-gray-600 text-right shrink-0';

  return (
    <div className="space-y-0 text-sm invoice-form glass-card panel">
      {/* KHÁCH HÀNG + HÓA ĐƠN side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border soft-divider bg-white/80">

        {/* THÔNG TIN KHÁCH HÀNG (B2C) */}
        <div className="lg:border-r soft-divider">
          <SH title="Thông tin khách hàng" k="cust" />
          {open.cust && (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1">
                <span className={`${LBL} w-28`}>Tên người mua<span className="text-red-500">*</span></span>
                <input className={I} value={form.buyerName} onChange={e => setF('buyerName', e.target.value)} />
              </div>

              <div className="flex items-center gap-1">
                <span className={`${LBL} w-28`}>Địa chỉ</span>
                <input className={I} value={form.buyerAddress} onChange={e => setF('buyerAddress', e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className={`${LBL} w-28`}>Số điện thoại</span>
                  <input className={I} value={form.buyerPhone} onChange={e => setF('buyerPhone', e.target.value)} />
                </div>
                <div className="flex items-center gap-1">
                  <span className={`${LBL} w-28`}>Email</span>
                  <input className={I} value={form.buyerEmail} onChange={e => setF('buyerEmail', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* THÔNG TIN HÓA ĐƠN */}
        <div>
          <SH title="Thông tin hóa đơn" k="inv" />
          {open.inv && (
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-1">
                <span className={`${LBL} w-32`}>Hình thức TT</span>
                <select className={S} value={form.paymentMethod} onChange={e => setF('paymentMethod', e.target.value)}>
                  <option>TM/CK</option>
                  <option>Tiền mặt</option>
                  <option>Chuyển khoản</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1">
                  <span className={`${LBL} w-32`}>Loại tiền<span className="text-red-500">*</span></span>
                  <select className={S} value={form.currency} onChange={e => setF('currency', e.target.value)}>
                    <option>VND</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className={`${LBL} w-32`}>Ngày lập</span>
                <input
                  type="datetime-local"
                  className={I}
                  value={form.issuedAt}
                  onChange={e => setF('issuedAt', e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1">
                <span className={`${LBL} w-32`}>Ghi chú HĐ</span>
                <input className={I} value={form.notes} onChange={e => setF('notes', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHI TIẾT HÓA ĐƠN */}
      <div className="border border-t-0 soft-divider bg-white/80">
        <SH title="Chi tiết hóa đơn" k="detail" />
        {open.detail && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/70 border-b soft-divider text-xs font-medium text-gray-600">
                    <th className="py-2 px-2 text-center w-8">STT</th>
                    <th className="py-2 px-2 text-left w-28">Tính chất</th>
                    <th className="py-2 px-2 text-left min-w-48">
                      Tên hàng hóa <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-2 text-left w-20">ĐVT</th>
                    <th className="py-2 px-2 text-right w-16">
                      SL <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-2 text-right w-28">
                      Đơn giá <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-2 text-right w-24">Thuế %</th>
                    <th className="py-2 px-2 text-right w-20">CK %</th>
                    <th className="py-2 px-2 text-right w-28">Số USDC</th>
                    <th className="py-2 px-2 text-right w-28">
                      Thành tiền <span className="text-red-500">*</span>
                    </th>
                    <th className="py-2 px-2 text-center w-12">Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const c = itemCalcs[idx];
                    return (
                      <tr key={idx} className="border-b border-gray-100">
                        <td className="py-1.5 px-2 text-center text-gray-400 text-xs">{idx + 1}</td>

                        <td className="py-1.5 px-2">
                          <select
                            className={S}
                            value={item.selection}
                            onChange={e => setItem(idx, 'selection', e.target.value)}
                          >
                            {Object.entries(SELECTION_LABELS).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-1.5 px-2">
                          <div className="space-y-1.5">
                            <input
                              className="app-input text-sm font-medium"
                              placeholder="Tên hàng hóa"
                              value={item.itemName}
                              onChange={e => setItem(idx, 'itemName', e.target.value)}
                            />
                            <div className="relative">
                              <input
                                className="w-full rounded-lg border border-dashed border-slate-300 bg-slate-50/80 px-2 py-1.5 text-xs text-slate-600 placeholder:text-slate-400 focus:outline-none focus:border-teal-500"
                                placeholder="Mã hàng hóa (tùy chọn)"
                                value={item.itemCode}
                                onChange={e => setItem(idx, 'itemCode', e.target.value)}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-1.5 px-2">
                          <input className={I} value={item.unitName} onChange={e => setItem(idx, 'unitName', e.target.value)} />
                        </td>

                        <td className="py-1.5 px-2">
                          <input className={`${I} text-right`} value={item.quantity} onChange={e => setItem(idx, 'quantity', e.target.value)} />
                        </td>

                        <td className="py-1.5 px-2">
                          <input className={`${I} text-right`} value={item.unitPrice} onChange={e => setItem(idx, 'unitPrice', e.target.value)} />
                        </td>

                        <td className="py-1.5 px-2">
                          <select
                            className={`${S} text-right`}
                            value={item.taxRate}
                            onChange={e => setItem(idx, 'taxRate', e.target.value)}
                          >
                            {TAX_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-1.5 px-2">
                          <input
                            className={`${I} text-right`}
                            placeholder="0"
                            value={item.discount}
                            onChange={e => setItem(idx, 'discount', e.target.value)}
                          />
                        </td>

                        <td className="py-1.5 px-2">
                          <input
                            className={`${I} text-right`}
                            placeholder="0"
                            value={item.tokenAmount}
                            onChange={e => setItem(idx, 'tokenAmount', e.target.value)}
                          />
                        </td>

                        <td className="py-1.5 px-2 text-right font-medium text-gray-700">
                          <div>{fmtNum(c.withoutTax)}</div>
                          {c.tax > 0 && (
                            <div className="text-xs text-gray-400">+{fmtNum(c.tax)} thuế</div>
                          )}
                        </td>

                        <td className="py-1.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setItems(p => p.length > 1 ? p.filter((_, i) => i !== idx) : p)}
                            className="text-rose-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end p-3 border-b soft-divider">
              <button
                type="button"
                onClick={() => setItems(p => [...p, emptyItem()])}
                className="flex items-center gap-1 btn btn-primary px-3 py-1.5 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Thêm hàng hóa
              </button>
            </div>

            {/* Totals */}
            <div className="flex justify-end p-4">
              <div className="w-96 text-sm rounded-xl border soft-divider p-3 bg-white/90">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Tổng tiền trước thuế</span>
                  <span className="font-semibold w-32 text-right">{fmtNum(totals.beforeTax)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Tổng tiền thuế</span>
                  <span className="font-semibold w-32 text-right">{fmtNum(totals.taxAmt)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Tổng tiền sau thuế</span>
                  <span className="font-bold w-32 text-right text-gray-900">{fmtNum(totals.afterTax)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-600">Tổng tiền thanh toán</span>
                  <span className="font-bold w-32 text-right text-gray-900">{fmtNum(totals.afterTax)}</span>
                </div>
                {totalTokenAmount > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-600">Tổng token (USDC)</span>
                    <span className="font-semibold w-32 text-right text-teal-700">{fmtToken(totalTokenAmount)}</span>
                  </div>
                )}
                <div className="flex items-start justify-between pt-2">
                  <span className="text-gray-600 shrink-0">Số tiền bằng chữ</span>
                  <span className="text-right max-w-60 text-gray-700 italic text-xs leading-relaxed">
                    {toWordsVN(totals.afterTax)}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</div>
      )}

      <div className="flex justify-end gap-2 px-3 py-4 border-t soft-divider bg-white/80">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 btn btn-neutral text-sm"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 btn btn-primary text-sm font-semibold"
        >
          {submitting ? 'Đang phát hành...' : 'Phát hành hóa đơn'}
        </button>
      </div>
    </div>
  );
}
