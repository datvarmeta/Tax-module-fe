import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  List,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  createInvoice,
  downloadInvoicePDF,
  getInvoice,
  getInvoiceHistory,
  getInvoiceStatus,
  isAuthError,
  listInvoices,
  login,
  reportToAuthority,
  submitInvoice,
  type CreateInvoiceBody,
  type Invoice,
} from './services/api';
import { InvoiceCreateForm } from './components/InvoiceCreateForm';

type Provider = 'viettel' | 'misa';
type Screen = 'dashboard' | 'create' | 'list' | 'detail';

type SessionInfo = {
  provider: Provider;
  expiresAt: string;
};

type LoginForm = {
  provider: Provider;
  username: string;
  password: string;
  appId: string;
  taxCode: string;
};


const SESSION_KEY = 'tax_module_session';
const CREDENTIALS_KEY = 'tax_module_credentials';

function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatVnd(value: number): string {
  return `${value.toLocaleString('vi-VN')} VND`;
}


function mapStatusLabel(status: string): { text: string; cls: string } {
  if (status === 'completed') return { text: 'Hoàn thành', cls: 'text-emerald-700 bg-emerald-100' };
  if (status === 'processing' || status === 'submitted') return { text: 'Đang xử lý', cls: 'text-amber-700 bg-amber-100' };
  if (status === 'failed') return { text: 'Lỗi', cls: 'text-rose-700 bg-rose-100' };
  if (status === 'draft') return { text: 'Nháp', cls: 'text-slate-700 bg-slate-100' };
  return { text: status, cls: 'text-slate-700 bg-slate-100' };
}

function App() {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    provider: 'viettel',
    username: '',
    password: '',
    appId: '',
    taxCode: '',
  });
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({ total: 0, completed: 0, processing: 0, failed: 0 });
  const [dashboardError, setDashboardError] = useState('');


  const [listStatus, setListStatus] = useState('all');
  const today = useMemo(() => toLocalIsoDate(new Date()), []);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [searchText, setSearchText] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [invoiceList, setInvoiceList] = useState<Invoice[]>([]);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<Invoice | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; from_status: string; to_status: string; reason?: string; created_at: string }>>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [actionLoading, setActionLoading] = useState<'submit' | 'pdf' | 'cqt' | ''>('');

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [sessionReason, setSessionReason] = useState('Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
  const [reloginForm, setReloginForm] = useState({ username: '', password: '', appId: '', taxCode: '' });
  const [reloginError, setReloginError] = useState('');
  const [reloginLoading, setReloginLoading] = useState(false);

  const sessionRemainingMs = useMemo(() => {
    if (!session) return 0;
    return Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
  }, [session]);

  const sessionMinutes = Math.floor(sessionRemainingMs / 60000);

  const isSessionExpired = !!session && sessionRemainingMs <= 0;

  useEffect(() => {
    const rawSession = localStorage.getItem(SESSION_KEY);
    const rawCredentials = localStorage.getItem(CREDENTIALS_KEY);

    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession) as SessionInfo;
        if (parsed?.provider && parsed?.expiresAt) {
          setSession(parsed);
          setLoginForm(prev => ({ ...prev, provider: parsed.provider }));
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }

    if (rawCredentials) {
      try {
        const parsed = JSON.parse(rawCredentials) as LoginForm;
        setLoginForm({
          provider: parsed.provider || 'viettel',
          username: parsed.username || '',
          password: parsed.password || '',
          appId: parsed.appId || '',
          taxCode: parsed.taxCode || '',
        });
        setReloginForm({
          username: parsed.username || '',
          password: parsed.password || '',
          appId: parsed.appId || '',
          taxCode: parsed.taxCode || '',
        });
      } catch {
        localStorage.removeItem(CREDENTIALS_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (isSessionExpired) {
      setSessionModalOpen(true);
      setSessionReason('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.');
    }
  }, [isSessionExpired]);

  useEffect(() => {
    const t = setInterval(() => {
      if (session && new Date(session.expiresAt).getTime() <= Date.now()) {
        setSessionModalOpen(true);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [session]);

  const persistSession = useCallback((provider: Provider, expiresAt: string) => {
    const next: SessionInfo = { provider, expiresAt };
    setSession(next);
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  }, []);

  const persistCredentials = useCallback((form: LoginForm) => {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(form));
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const handleAuthError = useCallback((error: unknown) => {
    if (isAuthError(error)) {
      setSessionModalOpen(true);
      setSessionReason('API trả về lỗi xác thực. Vui lòng đăng nhập lại.');
      return true;
    }
    return false;
  }, []);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError('');
    try {
      const from = new Date();
      from.setHours(0, 0, 0, 0);
      const to = new Date();
      to.setHours(23, 59, 59, 999);

      const data = await listInvoices({
        limit: 200,
        offset: 0,
        from: from.toISOString(),
        to: to.toISOString(),
      });

      setDashboardStats({
        total: data.length,
        completed: data.filter(i => i.status === 'completed').length,
        processing: data.filter(i => i.status === 'processing' || i.status === 'submitted').length,
        failed: data.filter(i => i.status === 'failed').length,
      });
    } catch (error) {
      if (!handleAuthError(error)) {
        setDashboardError(error instanceof Error ? error.message : 'Không tải được dashboard');
      }
    } finally {
      setDashboardLoading(false);
    }
  }, [handleAuthError]);

  const loadInvoices = useCallback(async () => {
    setListLoading(true);
    setListError('');
    try {
      const from = fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined;
      const to = toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined;
      const data = await listInvoices({
        limit: 300,
        offset: 0,
        status: listStatus !== 'all' ? listStatus : undefined,
        from,
        to,
      });
      setInvoiceList(data);
    } catch (error) {
      if (!handleAuthError(error)) {
        setListError(error instanceof Error ? error.message : 'Không tải được danh sách hóa đơn');
      }
    } finally {
      setListLoading(false);
    }
  }, [fromDate, toDate, listStatus, handleAuthError]);

  const loadDetail = useCallback(async (invoiceId: string) => {
    setDetailLoading(true);
    setDetailError('');
    try {
      const [inv, his] = await Promise.all([getInvoice(invoiceId), getInvoiceHistory(invoiceId)]);
      setInvoiceDetail(inv);
      setHistory(his);
    } catch (error) {
      if (!handleAuthError(error)) {
        setDetailError(error instanceof Error ? error.message : 'Không tải được chi tiết hóa đơn');
      }
    } finally {
      setDetailLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (!session) return;
    loadDashboard();
  }, [session, loadDashboard]);

  useEffect(() => {
    if (screen === 'list' && session) {
      loadInvoices();
    }
  }, [screen, session, loadInvoices]);

  useEffect(() => {
    if (screen === 'detail' && selectedInvoiceId && session) {
      loadDetail(selectedInvoiceId);
    }
  }, [screen, selectedInvoiceId, session, loadDetail]);

  useEffect(() => {
    if (screen !== 'detail' || !invoiceDetail || !selectedInvoiceId) return;
    if (invoiceDetail.status !== 'processing' && invoiceDetail.status !== 'submitted') return;

    const timer = setInterval(async () => {
      try {
        const statusData = await getInvoiceStatus(selectedInvoiceId);
        setInvoiceDetail(prev => prev ? { ...prev, status: statusData.status as Invoice['status'] } : prev);
        if (statusData.status === 'completed' || statusData.status === 'failed') {
          await loadDetail(selectedInvoiceId);
        }
      } catch (error) {
        handleAuthError(error);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [screen, invoiceDetail, selectedInvoiceId, loadDetail, handleAuthError]);

  const handleLogin = useCallback(async () => {
    setLoadingLogin(true);
    setLoginError('');
    try {
      if (!loginForm.username.trim() || !loginForm.password.trim()) {
        setLoginError('Username và Password là bắt buộc.');
        return;
      }
      if (loginForm.provider === 'misa' && (!loginForm.appId.trim() || !loginForm.taxCode.trim())) {
        setLoginError('Với MISA, App ID và Mã số thuế là bắt buộc.');
        return;
      }

      const body = {
        provider: loginForm.provider,
        username: loginForm.username.trim(),
        password: loginForm.password,
        app_id: loginForm.provider === 'misa' ? loginForm.appId.trim() : undefined,
        tax_code: loginForm.provider === 'misa' ? loginForm.taxCode.trim() : undefined,
      };

      const data = await login(body);
      persistSession(loginForm.provider, data.expires_at);
      persistCredentials(loginForm);
      setSessionModalOpen(false);
      setScreen('dashboard');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Đăng nhập thất bại');
    } finally {
      setLoadingLogin(false);
    }
  }, [loginForm, persistSession, persistCredentials]);

  const handleRelogin = useCallback(async () => {
    if (!session) return;
    setReloginLoading(true);
    setReloginError('');
    try {
      if (!reloginForm.username.trim() || !reloginForm.password.trim()) {
        setReloginError('Username và Password là bắt buộc.');
        return;
      }
      if (session.provider === 'misa' && (!reloginForm.appId.trim() || !reloginForm.taxCode.trim())) {
        setReloginError('Với MISA, App ID và Mã số thuế là bắt buộc.');
        return;
      }

      const body = {
        provider: session.provider,
        username: reloginForm.username.trim(),
        password: reloginForm.password,
        app_id: session.provider === 'misa' ? reloginForm.appId.trim() : undefined,
        tax_code: session.provider === 'misa' ? reloginForm.taxCode.trim() : undefined,
      };

      const data = await login(body);
      persistSession(session.provider, data.expires_at);
      persistCredentials({
        provider: session.provider,
        username: reloginForm.username.trim(),
        password: reloginForm.password,
        appId: reloginForm.appId,
        taxCode: reloginForm.taxCode,
      });
      setSessionModalOpen(false);
    } catch (error) {
      setReloginError(error instanceof Error ? error.message : 'Đăng nhập lại thất bại');
    } finally {
      setReloginLoading(false);
    }
  }, [session, reloginForm, persistSession, persistCredentials]);

  const doRenew = useCallback(async () => {
    if (!session) return;
    const rawCredentials = localStorage.getItem(CREDENTIALS_KEY);
    if (!rawCredentials) {
      setSessionModalOpen(true);
      setSessionReason('Không tìm thấy credentials lưu tạm. Vui lòng nhập lại.');
      return;
    }

    try {
      const cred = JSON.parse(rawCredentials) as LoginForm;
      const data = await login({
        provider: cred.provider,
        username: cred.username,
        password: cred.password,
        app_id: cred.provider === 'misa' ? cred.appId : undefined,
        tax_code: cred.provider === 'misa' ? cred.taxCode : undefined,
      });
      persistSession(cred.provider, data.expires_at);
    } catch (error) {
      if (handleAuthError(error)) return;
      setSessionModalOpen(true);
      setSessionReason('Gia hạn thất bại. Vui lòng đăng nhập lại.');
    }
  }, [session, persistSession, handleAuthError]);

  const filteredInvoices = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return invoiceList;
    return invoiceList.filter(inv => {
      return [inv.id, inv.external_id, inv.buyer_name]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q));
    });
  }, [invoiceList, searchText]);

  const onCreateSubmit = useCallback(async (body: CreateInvoiceBody) => {
    try {
      const created = await createInvoice(body);
      await submitInvoice(created.id);
      setSelectedInvoiceId(created.id);
      setScreen('detail');
    } catch (error) {
      if (handleAuthError(error)) return;
      throw error;
    }
  }, [handleAuthError]);

  const onRetrySubmit = useCallback(async () => {
    if (!selectedInvoiceId) return;
    setActionLoading('submit');
    try {
      await submitInvoice(selectedInvoiceId);
      await loadDetail(selectedInvoiceId);
    } catch (error) {
      if (!handleAuthError(error)) {
        setDetailError(error instanceof Error ? error.message : 'Retry submit thất bại');
      }
    } finally {
      setActionLoading('');
    }
  }, [selectedInvoiceId, loadDetail, handleAuthError]);

  const onDownloadPdf = useCallback(async () => {
    if (!selectedInvoiceId) return;
    setActionLoading('pdf');
    try {
      await downloadInvoicePDF(selectedInvoiceId);
    } catch (error) {
      if (!handleAuthError(error)) {
        setDetailError(error instanceof Error ? error.message : 'Tải PDF thất bại');
      }
    } finally {
      setActionLoading('');
    }
  }, [selectedInvoiceId, handleAuthError]);

  const onSendCqt = useCallback(async () => {
    if (!invoiceDetail?.transaction_uuid) {
      setDetailError('Invoice chưa có transaction_uuid để gửi CQT.');
      return;
    }

    setActionLoading('cqt');
    try {
      await reportToAuthority({
        transaction_uuid: invoiceDetail.transaction_uuid,
      });
    } catch (error) {
      if (!handleAuthError(error)) {
        setDetailError(error instanceof Error ? error.message : 'Gửi CQT thất bại');
      }
    } finally {
      setActionLoading('');
    }
  }, [invoiceDetail, handleAuthError]);

  const goDetail = useCallback((invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setScreen('detail');
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen app-shell">
        <div className="max-w-md mx-auto px-6 py-16 relative z-10 login-shell">
          <div className="glass-card panel rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-5 screen-title">Đăng nhập hệ thống</h1>

            <div className="space-y-4">
              <label className="block text-sm">
                <span className="text-slate-600">Provider</span>
                <select
                  className="mt-1 app-select"
                  value={loginForm.provider}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, provider: e.target.value as Provider }))}
                >
                  <option value="viettel">Viettel</option>
                  <option value="misa">MISA</option>
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-slate-600">Username</span>
                <input
                  className="mt-1 app-input"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-600">Password</span>
                <input
                  type="password"
                  className="mt-1 app-input"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </label>

              {loginForm.provider === 'misa' && (
                <>
                  <label className="block text-sm">
                    <span className="text-slate-600">App ID</span>
                    <input
                      className="mt-1 app-input"
                      value={loginForm.appId}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, appId: e.target.value }))}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="text-slate-600">Mã số thuế</span>
                    <input
                      className="mt-1 app-input"
                      value={loginForm.taxCode}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, taxCode: e.target.value }))}
                    />
                  </label>
                </>
              )}

              {loginError && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-2">{loginError}</p>
              )}

              <button
                onClick={handleLogin}
                disabled={loadingLogin}
                className="w-full btn btn-primary py-2.5"
              >
                {loadingLogin ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusTag = invoiceDetail ? mapStatusLabel(invoiceDetail.status) : null;

  return (
    <div className="min-h-screen app-shell">
      <header className="relative z-10 app-header">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-slate-900 screen-title">Tax Module Console</h1>
            <p className="text-xs text-slate-500">Provider: {session.provider.toUpperCase()}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('dashboard')}
              className={`px-3 py-2 text-sm nav-chip ${screen === 'dashboard' ? 'active' : ''}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setScreen('create')}
              className={`px-3 py-2 text-sm nav-chip ${screen === 'create' ? 'active' : ''}`}
            >
              Tạo hóa đơn
            </button>
            <button
              onClick={() => setScreen('list')}
              className={`px-3 py-2 text-sm nav-chip ${screen === 'list' ? 'active' : ''}`}
            >
              Danh sách
            </button>
            <button
              onClick={() => {
                clearSession();
                setScreen('dashboard');
              }}
              className="px-3 py-2 text-sm nav-chip"
            >
              <LogOut className="inline w-4 h-4 mr-1" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {screen === 'dashboard' && (
          <div className="space-y-5">
            <div className="glass-card panel rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock3 className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-sm text-slate-500">Phiên còn</p>
                  <p className="font-bold text-slate-900">{sessionMinutes} phút ({new Date(session.expiresAt).toLocaleString('vi-VN')})</p>
                </div>
              </div>
              <button onClick={doRenew} className="px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: 'linear-gradient(160deg, #b45309 0%, #d97706 100%)' }}>
                <RefreshCw className="inline w-4 h-4 mr-1" /> Gia hạn
              </button>
            </div>

            <div className="glass-card panel rounded-2xl p-5">
              {dashboardLoading ? (
                <p className="text-slate-500">Đang tải thống kê...</p>
              ) : dashboardError ? (
                <p className="text-rose-600">{dashboardError}</p>
              ) : (
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="rounded-xl bg-white p-4 border border-slate-200"><p className="text-sm text-slate-500">Hôm nay</p><p className="text-2xl font-bold">{dashboardStats.total}</p></div>
                  <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200"><p className="text-sm text-emerald-700">Hoàn thành</p><p className="text-2xl font-bold text-emerald-800">{dashboardStats.completed}</p></div>
                  <div className="rounded-xl bg-amber-50 p-4 border border-amber-200"><p className="text-sm text-amber-700">Đang xử lý</p><p className="text-2xl font-bold text-amber-800">{dashboardStats.processing}</p></div>
                  <div className="rounded-xl bg-rose-50 p-4 border border-rose-200"><p className="text-sm text-rose-700">Lỗi</p><p className="text-2xl font-bold text-rose-800">{dashboardStats.failed}</p></div>
                </div>
              )}
            </div>

            <button
              onClick={() => setScreen('create')}
              className="w-full md:w-auto px-5 py-3 btn btn-primary"
            >
              <Plus className="inline w-4 h-4 mr-1" /> Tạo hóa đơn mới
            </button>
          </div>
        )}

        {screen === 'create' && (
          <InvoiceCreateForm
            onSubmit={onCreateSubmit}
            onCancel={() => setScreen('dashboard')}
          />
        )}

        {screen === 'list' && (
          <div className="glass-card panel rounded-2xl p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <select value={listStatus} onChange={(e) => setListStatus(e.target.value)} className="app-select text-sm">
                <option value="all">Tất cả</option>
                <option value="draft">Nháp</option>
                <option value="submitted">Submitted</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="failed">Lỗi</option>
              </select>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="app-input text-sm" />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="app-input text-sm" />
              <input placeholder="Tìm theo ID / khách hàng" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="app-input text-sm min-w-56" />
              <button onClick={loadInvoices} className="btn btn-primary px-3 py-2 text-sm">Tìm</button>
            </div>

            {listLoading ? <p className="text-slate-500">Đang tải...</p> : null}
            {listError ? <p className="text-rose-600">{listError}</p> : null}

            <div className="overflow-x-auto">
              <table className="w-full text-sm data-table">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2">Mã HĐ</th>
                    <th className="py-2">Khách hàng</th>
                    <th className="py-2">Tổng tiền</th>
                    <th className="py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => {
                    const status = mapStatusLabel(inv.status);
                    return (
                      <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => goDetail(inv.id)}>
                        <td className="py-2 font-mono text-xs">{inv.external_id || inv.id.slice(0, 12)}</td>
                        <td className="py-2">{inv.buyer_name}</td>
                        <td className="py-2">{formatVnd(inv.total_amount_with_tax)}</td>
                        <td className="py-2">
                          <span className={`status-badge ${status.cls}`}>{status.text}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {screen === 'detail' && (
          <div className="glass-card panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <h2 className="text-lg font-bold">{invoiceDetail?.external_id || selectedInvoiceId || 'Chi tiết hóa đơn'}</h2>
                <p className="text-slate-600">{invoiceDetail?.buyer_name || '-'}</p>
              </div>
              {statusTag && <span className={`status-badge ${statusTag.cls}`}>{statusTag.text}</span>}
            </div>

            {detailLoading ? <p className="text-slate-500">Đang tải chi tiết...</p> : null}
            {detailError ? <p className="text-rose-600">{detailError}</p> : null}

            {invoiceDetail && (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Mã hóa đơn</p>
                  <p className="font-semibold">{invoiceDetail.external_id || '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-slate-500">Transaction UUID</p>
                  <p className="font-mono text-xs">{invoiceDetail.transaction_uuid || '-'}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Lịch sử trạng thái</h3>
              <div className="space-y-1 text-sm">
                {history.map(h => (
                  <div key={h.id} className="flex gap-3 border-b border-slate-100 py-1">
                    <span className="text-slate-500 w-24">{new Date(h.created_at).toLocaleTimeString('vi-VN')}</span>
                    <span>{h.from_status} → {h.to_status}</span>
                    {h.reason ? <span className="text-rose-600">({h.reason})</span> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={onDownloadPdf} disabled={actionLoading !== ''} className="btn btn-primary px-3 py-2 text-sm">
                {actionLoading === 'pdf' ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : <FileText className="inline w-4 h-4 mr-1" />}Tải PDF
              </button>
              <button onClick={onSendCqt} disabled={actionLoading !== ''} className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'linear-gradient(160deg, #1d4ed8 0%, #2563eb 100%)' }}>
                {actionLoading === 'cqt' ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : <Send className="inline w-4 h-4 mr-1" />}Gửi CQT
              </button>
              {invoiceDetail?.status === 'failed' && (
                <button onClick={onRetrySubmit} disabled={actionLoading !== ''} className="px-3 py-2 rounded-lg text-white text-sm" style={{ background: 'linear-gradient(160deg, #be123c 0%, #e11d48 100%)' }}>
                  {actionLoading === 'submit' ? <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="inline w-4 h-4 mr-1" />}Thử lại
                </button>
              )}
              <button onClick={() => setScreen('list')} className="btn btn-neutral px-3 py-2 text-sm">
                <List className="inline w-4 h-4 mr-1" />Về danh sách
              </button>
            </div>
          </div>
        )}
      </main>

      {sessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 panel">
            <h3 className="text-lg font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" /> Phiên đăng nhập hết hạn</h3>
            <p className="text-sm text-slate-600 mt-2">{sessionReason}</p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="text-slate-600">Username</span>
                <input
                  className="mt-1 app-input"
                  value={reloginForm.username}
                  onChange={(e) => setReloginForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </label>

              <label className="block text-sm">
                <span className="text-slate-600">Password</span>
                <input
                  type="password"
                  className="mt-1 app-input"
                  value={reloginForm.password}
                  onChange={(e) => setReloginForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </label>

              {session.provider === 'misa' && (
                <>
                  <label className="block text-sm">
                    <span className="text-slate-600">App ID</span>
                    <input
                      className="mt-1 app-input"
                      value={reloginForm.appId}
                      onChange={(e) => setReloginForm(prev => ({ ...prev, appId: e.target.value }))}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-slate-600">Mã số thuế</span>
                    <input
                      className="mt-1 app-input"
                      value={reloginForm.taxCode}
                      onChange={(e) => setReloginForm(prev => ({ ...prev, taxCode: e.target.value }))}
                    />
                  </label>
                </>
              )}

              {reloginError && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg p-2">{reloginError}</p>}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSessionModalOpen(false)}
                className="btn btn-neutral px-3 py-2 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleRelogin}
                disabled={reloginLoading}
                className="btn btn-primary px-3 py-2 text-sm"
              >
                {reloginLoading ? 'Đang đăng nhập lại...' : 'Đăng nhập lại'}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'detail' && invoiceDetail?.status === 'processing' && (
        <div className="fixed right-4 bottom-4 z-40 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg px-3 py-2 text-sm floating-note">
          <Loader2 className="inline w-4 h-4 mr-1 animate-spin" /> Auto polling trạng thái mỗi 5 giây
        </div>
      )}

      {screen === 'detail' && invoiceDetail?.status === 'completed' && (
        <div className="fixed right-4 bottom-4 z-40 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg px-3 py-2 text-sm floating-note">
          <CheckCircle2 className="inline w-4 h-4 mr-1" /> Hóa đơn đã hoàn thành
        </div>
      )}

      {(screen === 'dashboard' || screen === 'create' || screen === 'list' || screen === 'detail') && (
        <button
          onClick={loadDashboard}
          className="fixed left-4 bottom-4 z-40 btn btn-neutral px-3 py-2 text-sm"
        >
          <RefreshCw className="inline w-4 h-4 mr-1" /> Refresh dashboard
        </button>
      )}
    </div>
  );
}

export default App;
