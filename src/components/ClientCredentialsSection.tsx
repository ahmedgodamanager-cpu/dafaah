import React, { useState } from 'react';
import { 
  Key, 
  Mail, 
  Share2, 
  Target, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ExternalLink, 
  Edit3, 
  Plus, 
  ShieldCheck,
  FileText,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Client, SallaAccessDepartment } from '../types';
import { ClientCredentialsModal } from './ClientCredentialsModal';

interface ClientCredentialsSectionProps {
  client: Client;
  onUpdateClient?: (client: Partial<Client> & { id: string }) => Promise<boolean>;
  isReadingMode?: boolean;
}

const getDepartmentBadgeStyle = (dept: SallaAccessDepartment | string) => {
  switch (dept) {
    case 'أكونت مانجمنت':
      return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    case 'سيو':
      return 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'ميديا باينج':
      return 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    default:
      return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

export const ClientCredentialsSection: React.FC<ClientCredentialsSectionProps> = ({
  client,
  onUpdateClient,
  isReadingMode = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'social' | 'ads' | 'salla' | 'gmail' | 'notes'>('salla');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const creds = client.credentials || {};
  const sallaStores = creds.sallaAccounts || [];
  const socialAccounts = creds.socialAccounts || [];
  const adAccessAccounts = creds.adAccessAccounts || [];
  const gmailEmail = creds.gmailEmail || client.gmailEmail || '';
  const gmailPassword = creds.gmailPassword || '';
  const gmailRecovery = creds.gmailRecovery || '';
  const notes = creds.notes || '';

  const totalSallaAccess = sallaStores.reduce((acc, s) => acc + (s.accessEmails?.length || 0), 0);
  const totalAccounts = sallaStores.length + socialAccounts.length + adAccessAccounts.length + (gmailEmail ? 1 : 0);

  const togglePassword = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      toast.success(`تم نسخ ${label} بنجاح`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('تعذر النسخ إلى الحافظة');
    }
  };

  const handleOpenModal = (tab: 'social' | 'ads' | 'salla' | 'gmail' | 'notes' = 'salla') => {
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleSave = async (updated: Partial<Client> & { id: string }) => {
    if (onUpdateClient) {
      return onUpdateClient(updated);
    }
    return true;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Section Top Header */}
      <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-[#593BFE] dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>بيانات الحسابات والوصول (Credentials & Access)</span>
              {totalAccounts > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-[#593BFE] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono font-bold">
                  {totalAccounts} مسجل
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              متاجر سلة، إيميلات الأكسيس، حسابات السوشيال ميديا، إيميل الجيميل، وحملات الإعلانات.
            </p>
          </div>
        </div>

        {!isReadingMode && (
          <button
            type="button"
            onClick={() => handleOpenModal('salla')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#593BFE] hover:bg-[#492de0] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>إدارة وتعديل الحسابات</span>
          </button>
        )}
      </div>

      {/* Grid of Credentials Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTION 1: SALLA STORE ACCOUNTS (FULL WIDTH HIGHLIGHT) */}
        <div className="lg:col-span-3 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>حسابات متجر سلة (Salla Store) وإيميلات الأكسيس</span>
                  {sallaStores.length > 0 && (
                    <span className="text-xs font-normal text-slate-400">
                      ({sallaStores.length} {sallaStores.length === 1 ? 'متجر' : 'متاجر'} · {totalSallaAccess} إيميلات أكسيس)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  بيانات حساب سلة الرئيسي وإيميلات الوصول الممنوحة لأقسام الأكونت، السيو، والميديا باينج.
                </p>
              </div>
            </div>

            {!isReadingMode && (
              <button
                type="button"
                onClick={() => handleOpenModal('salla')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة / تعديل متجر سلة</span>
              </button>
            )}
          </div>

          {sallaStores.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sallaStores.map((store, sIdx) => {
                const storePassKey = `salla-view-pass-${store.id}`;
                const isStorePassVisible = !!visiblePasswords[storePassKey];
                const storeLoginKey = `salla-view-login-${store.id}`;

                return (
                  <div
                    key={store.id || sIdx}
                    className="p-4 bg-slate-50/90 dark:bg-[#1E1E22] border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-3.5 shadow-2xs"
                  >
                    {/* Store Title Bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 dark:border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {sIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                          {store.storeName || 'متجر سلة'}
                        </h4>
                      </div>

                      {store.storeUrl && (
                        <a
                          href={store.storeUrl.startsWith('http') ? store.storeUrl : `https://${store.storeUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                        >
                          <span>رابط المتجر</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Main Store Login & Password */}
                    {(store.mainEmailOrPhone || store.mainPassword) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {store.mainEmailOrPhone && (
                          <div className="p-2.5 bg-white dark:bg-[#141416] rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">حساب سلة الرئيسي:</span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                                {store.mainEmailOrPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(store.mainEmailOrPhone || '', 'الحساب الرئيسي', storeLoginKey)}
                                className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                                title="نسخ"
                              >
                                {copiedKey === storeLoginKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {store.mainPassword && (
                          <div className="p-2.5 bg-white dark:bg-[#141416] rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">كلمة المرور الرئيسية:</span>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate tracking-wider" dir="ltr">
                                {isStorePassVisible ? store.mainPassword : '••••••••••••'}
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => togglePassword(storePassKey)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                  title={isStorePassVisible ? 'إخفاء' : 'إظهار'}
                                >
                                  {isStorePassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(store.mainPassword || '', 'كلمة المرور', storePassKey)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  title="نسخ"
                                >
                                  {copiedKey === storePassKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Access Emails List */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-emerald-600" />
                          <span>إيميلات الأكسيس الممنوحة على المتجر:</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {store.accessEmails?.length || 0} أكسيس
                        </span>
                      </div>

                      {(!store.accessEmails || store.accessEmails.length === 0) ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                          لم يتم تسجيل إيميلات أكسيس لفريق العمل بعد.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {store.accessEmails.map((acc, aIdx) => {
                            const accPassKey = `salla-acc-view-${acc.id}`;
                            const isAccPassVisible = !!visiblePasswords[accPassKey];
                            const accEmailKey = `salla-acc-em-view-${acc.id}`;

                            return (
                              <div
                                key={acc.id || aIdx}
                                className="p-3 bg-white dark:bg-[#141416] border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDepartmentBadgeStyle(acc.department)}`}>
                                      {acc.department || 'ميديا باينج'}
                                    </span>
                                    {acc.assignedPerson && (
                                      <span className="text-[11px] text-slate-500 truncate">
                                        ({acc.assignedPerson})
                                      </span>
                                    )}
                                  </div>

                                  {acc.notes && (
                                    <span className="text-[10px] text-slate-400 max-w-[150px] truncate" title={acc.notes}>
                                      {acc.notes}
                                    </span>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                  {/* Access Email */}
                                  <div className="flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-[#1C1C20] px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                                      {acc.email || 'بدون إيميل'}
                                    </span>
                                    {acc.email && (
                                      <button
                                        type="button"
                                        onClick={() => copyToClipboard(acc.email, 'إيميل الأكسيس', accEmailKey)}
                                        className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                                        title="نسخ"
                                      >
                                        {copiedKey === accEmailKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    )}
                                  </div>

                                  {/* Access Password */}
                                  <div className="flex items-center justify-between gap-1.5 bg-slate-50 dark:bg-[#1C1C20] px-2.5 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 font-mono">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate tracking-wider" dir="ltr">
                                      {isAccPassVisible ? (acc.password || 'لا توجد كلمة مرور') : '••••••••••••'}
                                    </span>
                                    {acc.password && (
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => togglePassword(accPassKey)}
                                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                          title={isAccPassVisible ? 'إخفاء' : 'إظهار'}
                                        >
                                          {isAccPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => copyToClipboard(acc.password || '', 'كلمة المرور', accPassKey)}
                                          className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                          title="نسخ"
                                        >
                                          {copiedKey === accPassKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
              <p>لم يتم تسجيل أي حسابات أو متاجر سلة لهذا العميل بعد.</p>
              {!isReadingMode && (
                <button
                  type="button"
                  onClick={() => handleOpenModal('salla')}
                  className="px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                >
                  + إضافة حساب متجر سلة الآن
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 2: GMAIL ACCOUNT */}
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  إيميل الجيميل (Gmail)
                </h3>
              </div>
              {gmailEmail && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  مفعّل
                </span>
              )}
            </div>

            {gmailEmail ? (
              <div className="space-y-2.5">
                {/* Email Address */}
                <div className="p-3 bg-slate-50 dark:bg-[#1E1E22] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">العنوان:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                      {gmailEmail}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gmailEmail, 'إيميل الجيميل', 'gmail-email')}
                      className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer shrink-0"
                      title="نسخ الإيميل"
                    >
                      {copiedKey === 'gmail-email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                {gmailPassword && (
                  <div className="p-3 bg-slate-50 dark:bg-[#1E1E22] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">كلمة المرور:</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate tracking-wider" dir="ltr">
                        {visiblePasswords['gmail'] ? gmailPassword : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePassword('gmail')}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          title={visiblePasswords['gmail'] ? 'إخفاء' : 'إظهار'}
                        >
                          {visiblePasswords['gmail'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(gmailPassword, 'كلمة المرور', 'gmail-pass')}
                          className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                          title="نسخ كلمة المرور"
                        >
                          {copiedKey === 'gmail-pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recovery */}
                {gmailRecovery && (
                  <div className="p-3 bg-slate-50 dark:bg-[#1E1E22] rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">الاسترداد (Recovery):</span>
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 block truncate" dir="ltr">
                      {gmailRecovery}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <p>لم يتم تسجيل إيميل جيميل لهذا العميل بعد.</p>
                {!isReadingMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenModal('gmail')}
                    className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                  >
                    + إضافة إيميل الجيميل
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: SOCIAL MEDIA ACCOUNTS */}
        <div className="lg:col-span-2 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[#593BFE] dark:text-indigo-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  حسابات منصات التواصل الاجتماعي (Social Accounts)
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-[#593BFE] dark:text-indigo-400">
                {socialAccounts.length} حسابات
              </span>
            </div>

            {socialAccounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {socialAccounts.map((acc, idx) => {
                  const passKey = `social-pass-${acc.id}`;
                  const isPassVisible = !!visiblePasswords[passKey];
                  const userKey = `social-user-${acc.id}`;

                  return (
                    <div
                      key={acc.id || idx}
                      className="p-3.5 bg-slate-50 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-indigo-700 dark:text-indigo-300">
                          {acc.platform}
                        </span>
                        {acc.url && (
                          <a
                            href={acc.url.startsWith('http') ? acc.url : `https://${acc.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors"
                            title="فتح الرابط"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Username */}
                      <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs font-mono">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                          {acc.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.username, 'اسم المستخدم', userKey)}
                          className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer shrink-0"
                          title="نسخ"
                        >
                          {copiedKey === userKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Password */}
                      {acc.password && (
                        <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate tracking-wider" dir="ltr">
                            {isPassVisible ? acc.password : '••••••••••••'}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => togglePassword(passKey)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title={isPassVisible ? 'إخفاء' : 'إظهار'}
                            >
                              {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(acc.password || '', 'كلمة المرور', passKey)}
                              className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                              title="نسخ"
                            >
                              {copiedKey === passKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {acc.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-indigo-50/30 dark:bg-indigo-950/20 px-2 py-1 rounded-md">
                          {acc.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <p>لم يتم تسجيل أي حسابات سوشيال ميديا لهذا العميل بعد.</p>
                {!isReadingMode && (
                  <button
                    type="button"
                    onClick={() => handleOpenModal('social')}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-[#593BFE] dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
                  >
                    + إضافة حساب سوشيال ميديا
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: AD ACCESS EMAILS */}
        <div className="lg:col-span-3 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                إيميلات وصلاحيات الوصول للحسابات الإعلانية (Ad Access Emails)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              {adAccessAccounts.length} حسابات
            </span>
          </div>

          {adAccessAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {adAccessAccounts.map((ad, idx) => {
                const adEmailKey = `ad-email-${ad.id}`;
                const adIdKey = `ad-accid-${ad.id}`;

                return (
                  <div
                    key={ad.id || idx}
                    className="p-4 bg-slate-50/90 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-purple-700 dark:text-purple-300">
                        {ad.platform}
                      </span>
                      {ad.roleOrAccessLevel && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                          {ad.roleOrAccessLevel}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs font-mono">
                      <span className="text-[11px] text-slate-400 font-sans">الإيميل:</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate" dir="ltr">
                          {ad.email || 'غير محدد'}
                        </span>
                        {ad.email && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ad.email, 'إيميل الأكسيس', adEmailKey)}
                            className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                            title="نسخ"
                          >
                            {copiedKey === adEmailKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Account ID */}
                    {ad.accountId && (
                      <div className="flex items-center justify-between gap-2 bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 text-xs font-mono">
                        <span className="text-[11px] text-slate-400 font-sans">المعرف:</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-slate-700 dark:text-slate-300 truncate" dir="ltr">
                            {ad.accountId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(ad.accountId || '', 'معرف الحساب', adIdKey)}
                            className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                            title="نسخ"
                          >
                            {copiedKey === adIdKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {ad.notes && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-purple-50/40 dark:bg-purple-950/20 px-2 py-1 rounded-md">
                        {ad.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
              <p>لم يتم تسجيل أي إيميلات أكسيس إعلانية لهذا العميل بعد.</p>
              {!isReadingMode && (
                <button
                  type="button"
                  onClick={() => handleOpenModal('ads')}
                  className="px-3.5 py-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                >
                  + إضافة إيميل أكسيس إعلاني
                </button>
              )}
            </div>
          )}
        </div>

        {/* SECTION 5: GENERAL ACCESS NOTES */}
        {notes && (
          <div className="lg:col-span-3 bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-xs">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>تعليمات الدخول والـ 2FA:</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-amber-50/30 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
              {notes}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ClientCredentialsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          client={client}
          onSave={handleSave}
          initialTab={modalInitialTab}
        />
      )}
    </div>
  );
};

export default ClientCredentialsSection;
