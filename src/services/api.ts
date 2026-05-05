const API_BASE = '/api/v1';

// --- Response types matching backend domain models ---

export interface Invoice {
  id: string;
  external_id?: string;
  transaction_uuid?: string;
  status: 'draft' | 'submitted' | 'processing' | 'completed' | 'failed' | 'cancelled';
  provider?: string;

  // Buyer info
  buyer_name: string;
  buyer_legal_name?: string;
  buyer_tax_code?: string;
  buyer_address?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_code?: string;

  // VND amounts
  currency: string;
  total_amount_with_tax: number;
  total_tax_amount: number;
  total_amount_without_tax: number;

  // Token/crypto amounts
  token_currency: string;
  exchange_rate: number;
  exchange_rate_source?: string;
  hbar_amount?: number;
  token_total_amount: number;
  token_tax_amount: number;
  token_net_amount: number;

  // Payment & blockchain
  payment_method?: string;
  transaction_hash?: string;
  erp_order_id?: string;

  notes?: string;
  issued_at?: string;
  submitted_at?: string;
  completed_at?: string;
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;

  // VND amounts
  tax_percentage: number;
  tax_amount: number;
  item_total_amount_without_tax: number;
  item_total_amount_with_tax: number;
  item_total_amount_after_discount?: number;
  item_discount?: number;

  // Token amounts
  token_unit_price: number;
  token_tax_amount: number;
  token_line_total: number;

  line_number: number;
  selection?: number;
  item_type?: number;
  item_code?: string;
  unit_code?: string;
  unit_name?: string;
  discount?: number;
  discount2?: number;
  item_note?: string;
  is_increase_item?: boolean;
  batch_no?: string;
  exp_date?: string;
  adjust_ratio?: string;
  unit_price_with_tax?: number;
  special_info?: Array<{ name: string; value: string }>;
  created_at: string;
}

export interface CreateInvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  unit_price_with_tax?: number;
  tax_percentage: number;
  tax_amount?: number;
  item_type?: number;
  item_discount?: number;
  item_total_amount_after_discount?: number;
  discount?: number;
  discount2?: number;
  item_total_amount_without_tax: number;
  item_total_amount_with_tax?: number;
  token_unit_price?: number;
  token_tax_amount?: number;
  token_line_total?: number;
  line_number?: number;
  selection?: number;
  item_code?: string;
  unit_code?: string;
  unit_name?: string;
  item_note?: string;
  is_increase_item?: boolean;
  batch_no?: string;
  exp_date?: string;
  adjust_ratio?: string;
  special_info?: Array<{ name: string; value: string }>;
}

export interface CreateInvoiceBody {
  buyer_name: string;
  buyer_legal_name?: string;
  buyer_tax_code?: string;
  buyer_address?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_code?: string;
  currency: string;
  total_amount_with_tax: number;
  total_tax_amount: number;
  total_amount_without_tax: number;
  token_currency: string;
  exchange_rate?: number;
  exchange_rate_source?: string;
  token_total_amount?: number;
  token_tax_amount?: number;
  token_net_amount?: number;
  payment_method?: string;
  transaction_hash?: string;
  erp_order_id?: string;
  notes?: string;
  issued_at?: string;
  items: CreateInvoiceItem[];
}

export interface ListInvoicesQuery {
  limit?: number;
  offset?: number;
  status?: string;
  from?: string;
  to?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { total: number; limit: number; offset: number };
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return true;
    if (error.code && /auth|unauth|token|expired/i.test(error.code)) return true;
    if (/auth|unauth|token|expired|permission denied/i.test(error.message)) return true;
  }
  if (error instanceof Error) {
    return /auth|unauth|token|expired|permission denied/i.test(error.message);
  }
  return false;
}

// --- Request helper ---

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';
  const url = `${API_BASE}${path}`;
  const body = options?.body ? JSON.parse(options.body as string) : undefined;

  console.log(`[API] → ${method} ${url}`, body ?? '');

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let json: ApiResponse<T> | null = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || !json?.success) {
    const message = json?.error?.message || `API error (${res.status})`;
    const code = json?.error?.code;
    console.error(`[API] ← ${method} ${url} ERROR`, json?.error || { message, code });
    throw new ApiError(message, res.status, code);
  }

  console.log(`[API] ← ${method} ${url} ${res.status}`, json.data);
  return json.data as T;
}

function buildInvoiceQuery(params: ListInvoicesQuery = {}): string {
  const search = new URLSearchParams();

  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
  if (params.status) search.set('status', params.status);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);

  const query = search.toString();
  return query ? `?${query}` : '';
}

function parseFileName(contentDisposition: string | null): string {
  if (!contentDisposition) return 'invoice.pdf';

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] || 'invoice.pdf';
}

// --- Invoice API ---

export async function createInvoice(body: CreateInvoiceBody): Promise<Invoice> {
  return request<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listInvoices(params: ListInvoicesQuery = {}): Promise<Invoice[]> {
  return request<Invoice[]>(`/invoices${buildInvoiceQuery(params)}`);
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  return request<Invoice>(`/invoices/${invoiceId}`);
}

export async function updatePayment(invoiceId: string, transactionHash: string): Promise<{ transaction_hash: string }> {
  return request<{ transaction_hash: string }>(`/invoices/${invoiceId}/payment`, {
    method: 'PATCH',
    body: JSON.stringify({ transaction_hash: transactionHash }),
  });
}

export async function submitInvoice(invoiceId: string): Promise<{ status: string }> {
  return request<{ status: string }>(`/invoices/${invoiceId}/submit`, {
    method: 'POST',
  });
}

export async function getInvoiceStatus(invoiceId: string): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>(`/invoices/${invoiceId}/status`);
}

export async function getInvoiceHistory(invoiceId: string): Promise<Array<{
  id: string;
  invoice_id: string;
  from_status: string;
  to_status: string;
  reason?: string;
  created_at: string;
}>> {
  return request(`/invoices/${invoiceId}/history`);
}

export async function reportToAuthority(body: {
  transaction_uuid: string;
}): Promise<{ success_count: number; error_count: number }> {
  return request('/invoices/report-to-authority', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function downloadInvoicePDF(invoiceId: string): Promise<void> {
  const url = `${API_BASE}/invoices/${invoiceId}/pdf`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to download invoice PDF (${res.status})`);
  }

  const contentType = res.headers.get('content-type') || '';

  // Backward compatibility: older backend may return signed URL in JSON envelope.
  if (contentType.includes('application/json')) {
    const json: ApiResponse<{ url: string; filename: string }> = await res.json();
    if (!json.success || !json.data?.url) {
      throw new Error(json.error?.message || 'Invalid PDF response payload');
    }

    const a = document.createElement('a');
    a.href = json.data.url;
    a.download = json.data.filename || 'invoice.pdf';
    a.click();
    return;
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = parseFileName(res.headers.get('content-disposition'));
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch('/health');
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkReadiness(): Promise<boolean> {
  try {
    const res = await fetch('/ready');
    return res.ok;
  } catch {
    return false;
  }
}

export interface LoginBody {
  provider: 'viettel' | 'misa';
  username: string;
  password: string;
  app_id?: string;
  tax_code?: string;
}

export interface LoginResponse {
  provider: string;
  expires_at: string;
}

export async function login(body: LoginBody): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
