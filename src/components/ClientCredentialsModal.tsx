import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Mail, 
  Share2, 
  Target, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Save,
  FileText,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  Client, 
  ClientCredentials, 
  SocialAccountCredential, 
  AdAccessAccount,
  SallaStoreAccount,
  SallaAccessEmail,
  SallaAccessDepartment
} from '../types';

interface ClientCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onSave: (updatedClient: Partial<Client> & { id: string }) => Promise<boolean>;
  initialTab?: 'social' | 'ads' | 'salla' | 'gmail' | 'notes';
}

const SOCIAL_PLATFORMS = [
  'إنستجرام (Instagram)',
  'سناب شات (Snapchat)',
  'تيك توك (TikTok)',
  'فيسبوك (Facebook)',
  'تويتر / X (Twitter)',
  'لينكدإن (LinkedIn)',
  'يوتيوب (YouTube)',
  'أخرى'
];

const AD_PLATFORMS = [
  'Meta Ads (فيسبوك وإنستجرام)',
  'Snapchat Ads Manager',
  'TikTok Ads Manager',
  'Google Ads',
  'Twitter / X Ads',
  'LinkedIn Campaign Manager',
  'أخرى'
];

const ACCESS_ROLES = [
  'مسؤول كامل (Admin)',
  'معلن (Advertiser)',
  'محلل وتقارير (Analyst / Viewer)',
  'أخرى'
];

const SALLA_DEPARTMENTS: { label: string; value: SallaAccessDepartment; color: string }[] = [
  { label: 'أكونت مانجمنت (Account Management)', value: 'أكونت مانجمنت', color: 'amber' },
  { label: 'سيو (SEO)', value: 'سيو', color: 'emerald' },
  { label: 'ميديا باينج (Media Buying)', value: 'ميديا باينج', color: 'indigo' },
  { label: 'عام / أخرى', value: 'عام', color: 'slate' },
];

export const ClientCredentialsModal: React.FC<ClientCredentialsModalProps> = ({
  isOpen,
  onClose,
  client,
  onSave,
  initialTab = 'social',
}) => {
  const [activeTab, setActiveTab] = useState<'social' | 'ads' | 'salla' | 'gmail' | 'notes'>(initialTab);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Local state initialized from client.credentials or fallback fields
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailPassword, setGmailPassword] = useState('');
  const [gmailRecovery, setGmailRecovery] = useState('');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccountCredential[]>([]);
  const [adAccessAccounts, setAdAccessAccounts] = useState<AdAccessAccount[]>([]);
  const [sallaAccounts, setSallaAccounts] = useState<SallaStoreAccount[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      const creds = client.credentials || {};
      setGmailEmail(creds.gmailEmail || client.gmailEmail || '');
      setGmailPassword(creds.gmailPassword || '');
      setGmailRecovery(creds.gmailRecovery || '');
      setSocialAccounts(creds.socialAccounts ? JSON.parse(JSON.stringify(creds.socialAccounts)) : []);
      setAdAccessAccounts(creds.adAccessAccounts ? JSON.parse(JSON.stringify(creds.adAccessAccounts)) : []);
      setSallaAccounts(creds.sallaAccounts ? JSON.parse(JSON.stringify(creds.sallaAccounts)) : []);
      setNotes(creds.notes || '');
      setVisiblePasswords({});
      setCopiedKey(null);
      if (initialTab) {
        setActiveTab(initialTab);
      }
    }
  }, [isOpen, client, initialTab]);

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string, label: string, key: string) => {
    if (!text) {
      toast.error('لا يوجد نص لنسخه');
      return;
    }
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

  // Social account helpers
  const handleAddSocialAccount = () => {
    const newAccount: SocialAccountCredential = {
      id: `soc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platform: 'إنستجرام (Instagram)',
      username: '',
      password: '',
      url: '',
      notes: ''
    };
    setSocialAccounts(prev => [newAccount, ...prev]);
  };

  const handleUpdateSocialAccount = (id: string, updates: Partial<SocialAccountCredential>) => {
    setSocialAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const handleRemoveSocialAccount = (id: string) => {
    setSocialAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  // Ad access account helpers
  const handleAddAdAccessAccount = () => {
    const newAd: AdAccessAccount = {
      id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platform: 'Meta Ads (فيسبوك وإنستجرام)',
      email: '',
      roleOrAccessLevel: 'مسؤول كامل (Admin)',
      accountId: '',
      notes: ''
    };
    setAdAccessAccounts(prev => [newAd, ...prev]);
  };

  const handleUpdateAdAccessAccount = (id: string, updates: Partial<AdAccessAccount>) => {
    setAdAccessAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const handleRemoveAdAccessAccount = (id: string) => {
    setAdAccessAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  // Salla store account helpers
  const handleAddSallaStore = () => {
    const newStore: SallaStoreAccount = {
      id: `salla-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      storeName: '',
      storeUrl: '',
      mainEmailOrPhone: '',
      mainPassword: '',
      accessEmails: [
        {
          id: `acc-${Date.now()}-1`,
          email: '',
          password: '',
          department: 'ميديا باينج',
          assignedPerson: '',
          notes: ''
        }
      ],
      notes: ''
    };
    setSallaAccounts(prev => [newStore, ...prev]);
  };

  const handleUpdateSallaStore = (storeId: string, updates: Partial<SallaStoreAccount>) => {
    setSallaAccounts(prev => prev.map(s => s.id === storeId ? { ...s, ...updates } : s));
  };

  const handleRemoveSallaStore = (storeId: string) => {
    setSallaAccounts(prev => prev.filter(s => s.id !== storeId));
  };

  const handleAddSallaAccessEmail = (storeId: string) => {
    const newEmail: SallaAccessEmail = {
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: '',
      password: '',
      department: 'ميديا باينج',
      assignedPerson: '',
      notes: ''
    };
    setSallaAccounts(prev => prev.map(s => {
      if (s.id !== storeId) return s;
      return {
        ...s,
        accessEmails: [...(s.accessEmails || []), newEmail]
      };
    }));
  };

  const handleUpdateSallaAccessEmail = (storeId: string, emailId: string, updates: Partial<SallaAccessEmail>) => {
    setSallaAccounts(prev => prev.map(s => {
      if (s.id !== storeId) return s;
      return {
        ...s,
        accessEmails: (s.accessEmails || []).map(e => e.id === emailId ? { ...e, ...updates } : e)
      };
    }));
  };

  const handleRemoveSallaAccessEmail = (storeId: string, emailId: string) => {
    setSallaAccounts(prev => prev.map(s => {
      if (s.id !== storeId) return s;
      return {
        ...s,
        accessEmails: (s.accessEmails || []).filter(e => e.id !== emailId)
      };
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedCredentials: ClientCredentials = {
        gmailEmail: gmailEmail.trim(),
        gmailPassword: gmailPassword.trim(),
        gmailRecovery: gmailRecovery.trim(),
        socialAccounts: socialAccounts.filter(a => a.username.trim() || a.password?.trim() || a.notes?.trim()),
        adAccessAccounts: adAccessAccounts.filter(a => a.email.trim() || a.accountId?.trim() || a.notes?.trim()),
        sallaAccounts: sallaAccounts.filter(s => 
          s.storeName.trim() || 
          s.mainEmailOrPhone?.trim() || 
          s.mainPassword?.trim() || 
          (s.accessEmails && s.accessEmails.some(a => a.email.trim() || a.password?.trim()))
        ),
        notes: notes.trim(),
      };

      const ok = await onSave({
        id: client.id,
        credentials: updatedCredentials,
        gmailEmail: gmailEmail.trim(),
      });

      if (ok) {
        toast.success('تم حفظ بيانات الحسابات والوصول بنجاح');
        onClose();
      } else {
        toast.error('حدث خطأ أثناء حفظ البيانات');
      }
    } catch (err) {
      console.error('Error saving credentials:', err);
      toast.error('حدث خطأ أثناء حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-[#202024]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-[#593BFE] dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>بيانات الحسابات والوصول (Credentials)</span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {client.code}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                العميل: <span className="font-semibold text-slate-800 dark:text-slate-200">{client.clientName}</span> ({client.companyName || 'رمّاح - Ramah'})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 overflow-x-auto scrollbar-none bg-white dark:bg-[#18181B]">
          <button
            type="button"
            onClick={() => setActiveTab('salla')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'salla'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>متجر سلة (Salla)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              {sallaAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'social'
                ? 'border-[#593BFE] text-[#593BFE] dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>حسابات السوشيال ميديا</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950 text-[#593BFE] dark:text-indigo-400 font-bold">
              {socialAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ads'
                ? 'border-[#593BFE] text-[#593BFE] dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>إيميلات أكسيس الإعلانات</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-bold">
              {adAccessAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gmail'
                ? 'border-[#593BFE] text-[#593BFE] dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>إيميل الجيميل (Gmail)</span>
            {gmailEmail && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'border-[#593BFE] text-[#593BFE] dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تعليمات الدخول والـ 2FA</span>
            {notes && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 0: SALLA STORE ACCOUNTS */}
          {activeTab === 'salla' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>حسابات متجر سلة (Salla Store) وإيميلات الأكسيس</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    سجل بيانات المتجر الرئيسي وإيميلات الأكسيس الممنوحة لأقسام الأكونت، السيو، والميديا باينج.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSallaStore}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة متجر سلة</span>
                </button>
              </div>

              {sallaAccounts.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-[#1A1A1E]">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      لم يتم تسجيل متجر سلة بعد
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      أضف بيانات متجر سلة للعميل، كلمة المرور، وإيميلات الأكسيس لفريق الميديا باينج والسيو والأكونت.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSallaStore}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة متجر سلة الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sallaAccounts.map((store, storeIdx) => {
                    const storePassKey = `salla-main-pass-${store.id}`;
                    const isStorePassVisible = !!visiblePasswords[storePassKey];

                    return (
                      <div
                        key={store.id || storeIdx}
                        className="p-5 bg-slate-50/90 dark:bg-[#1E1E22] border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl space-y-4 relative shadow-2xs"
                      >
                        {/* Store Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                              {storeIdx + 1}
                            </span>
                            <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">
                              {store.storeName || `متجر سلة #${storeIdx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {store.storeUrl && (
                              <a
                                href={store.storeUrl.startsWith('http') ? store.storeUrl : `https://${store.storeUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                title="فتح رابط المتجر"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveSallaStore(store.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="حذف هذا المتجر"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Store Basic Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Store Name */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              اسم المتجر
                            </label>
                            <input
                              type="text"
                              value={store.storeName || ''}
                              onChange={e => handleUpdateSallaStore(store.id, { storeName: e.target.value })}
                              placeholder="مثال: متجر سومي لاند"
                              className="w-full px-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Store URL */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              رابط المتجر أو لوحة تحكم سلة
                            </label>
                            <input
                              type="url"
                              dir="ltr"
                              value={store.storeUrl || ''}
                              onChange={e => handleUpdateSallaStore(store.id, { storeUrl: e.target.value })}
                              placeholder="https://salla.sa/store أو https://s.salla.sa"
                              className="w-full px-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left font-mono"
                            />
                          </div>

                          {/* Main Login Email or Phone */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              إيميل أو رقم حساب سلة الرئيسي
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                dir="ltr"
                                value={store.mainEmailOrPhone || ''}
                                onChange={e => handleUpdateSallaStore(store.id, { mainEmailOrPhone: e.target.value })}
                                placeholder="owner@store.com أو 05xxxxxxxx"
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(store.mainEmailOrPhone || '', 'حساب سلة الرئيسي', `salla-login-${store.id}`)}
                                className="absolute left-1.5 p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                title="نسخ الحساب"
                              >
                                {copiedKey === `salla-login-${store.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Main Password */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              كلمة مرور حساب سلة الرئيسي
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type={isStorePassVisible ? 'text' : 'password'}
                                dir="ltr"
                                value={store.mainPassword || ''}
                                onChange={e => handleUpdateSallaStore(store.id, { mainPassword: e.target.value })}
                                placeholder="••••••••••••"
                                className="w-full pl-16 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left tracking-wider"
                              />
                              <div className="absolute left-1 flex items-center">
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(storePassKey)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                  title={isStorePassVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                  {isStorePassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(store.mainPassword || '', 'كلمة مرور سلة', `salla-pass-${store.id}`)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                  title="نسخ كلمة المرور"
                                >
                                  {copiedKey === `salla-pass-${store.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SALLA ACCESS EMAILS SUBSECTION */}
                        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                إيميلات الأكسيس الممنوحة على المتجر (سيو / ميديا باينج / أكونت مانجمنت)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddSallaAccessEmail(store.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>إضافة إيميل أكسيس</span>
                            </button>
                          </div>

                          {(!store.accessEmails || store.accessEmails.length === 0) ? (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                              لا توجد إيميلات أكسيس مسجلة لهذا المتجر بعد. انقر على "+ إضافة إيميل أكسيس" لتحديد من يملك الصلاحية.
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {store.accessEmails.map((accEmail, emailIdx) => {
                                const accPassKey = `salla-acc-pass-${accEmail.id}`;
                                const isAccPassVisible = !!visiblePasswords[accPassKey];

                                return (
                                  <div
                                    key={accEmail.id || emailIdx}
                                    className="p-3 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">#{emailIdx + 1}</span>
                                        <select
                                          value={accEmail.department || 'ميديا باينج'}
                                          onChange={e => handleUpdateSallaAccessEmail(store.id, accEmail.id, { department: e.target.value as SallaAccessDepartment })}
                                          className="text-[11px] font-bold px-2 py-1 bg-slate-50 dark:bg-[#1C1C20] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                          {SALLA_DEPARTMENTS.map(dept => (
                                            <option key={dept.value} value={dept.value}>
                                              {dept.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSallaAccessEmail(store.id, accEmail.id)}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded-md cursor-pointer"
                                        title="حذف بريد الأكسيس"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                      {/* Access Email */}
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                          إيميل الأكسيس (Login Email)
                                        </label>
                                        <div className="relative flex items-center">
                                          <input
                                            type="email"
                                            dir="ltr"
                                            value={accEmail.email || ''}
                                            onChange={e => handleUpdateSallaAccessEmail(store.id, accEmail.id, { email: e.target.value })}
                                            placeholder="salla.media@domain.com"
                                            className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono text-left focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => copyToClipboard(accEmail.email || '', 'إيميل الأكسيس', `salla-acc-em-${accEmail.id}`)}
                                            className="absolute left-1 p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                            title="نسخ الإيميل"
                                          >
                                            {copiedKey === `salla-acc-em-${accEmail.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      </div>

                                      {/* Access Password */}
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                                          كلمة المرور الخاصة بإيميل الأكسيس
                                        </label>
                                        <div className="relative flex items-center">
                                          <input
                                            type={isAccPassVisible ? 'text' : 'password'}
                                            dir="ltr"
                                            value={accEmail.password || ''}
                                            onChange={e => handleUpdateSallaAccessEmail(store.id, accEmail.id, { password: e.target.value })}
                                            placeholder="••••••••••••"
                                            className="w-full pl-14 pr-2.5 py-1.5 bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 font-mono text-left tracking-wider focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                          <div className="absolute left-1 flex items-center">
                                            <button
                                              type="button"
                                              onClick={() => togglePasswordVisibility(accPassKey)}
                                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                              title={isAccPassVisible ? 'إخفاء' : 'إظهار'}
                                            >
                                              {isAccPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => copyToClipboard(accEmail.password || '', 'كلمة مرور الأكسيس', `salla-acc-pass-${accEmail.id}`)}
                                              className="p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                                              title="نسخ كلمة المرور"
                                            >
                                              {copiedKey === `salla-acc-pass-${accEmail.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Assigned Person / Notes */}
                                      <div className="sm:col-span-2">
                                        <input
                                          type="text"
                                          value={accEmail.notes || ''}
                                          onChange={e => handleUpdateSallaAccessEmail(store.id, accEmail.id, { notes: e.target.value })}
                                          placeholder="ملاحظات أو اسم الموظف المسؤول عن هذا الأكسيس..."
                                          className="w-full px-2.5 py-1 bg-slate-50 dark:bg-[#1A1A1E] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
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
              )}
            </div>
          )}

          {/* TAB 1: SOCIAL MEDIA ACCOUNTS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    حسابات منصات التواصل الاجتماعي
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    سجل حسابات الإنستجرام، سناب شات، تيك توك، تويتر/X وغيرها من المنصات.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddSocialAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#593BFE] hover:bg-[#492de0] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة حساب</span>
                </button>
              </div>

              {socialAccounts.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-[#1A1A1E]">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-[#593BFE] dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                    <Share2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      لم يتم تسجيل أي حسابات سوشيال ميديا
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      أضف بيانات الحسابات، أسماء المستخدمين، وكلمات المرور لتسهيل وصول الفريق وإدارتها.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSocialAccount}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#593BFE] hover:bg-[#492de0] text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة حساب الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {socialAccounts.map((acc, idx) => {
                    const passKey = `social-pass-${acc.id}`;
                    const isPassVisible = !!visiblePasswords[passKey];

                    return (
                      <div
                        key={acc.id || idx}
                        className="p-4 bg-slate-50/80 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2 flex-1 max-w-xs">
                            <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                            <select
                              value={acc.platform}
                              onChange={e => handleUpdateSocialAccount(acc.id, { platform: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE]"
                            >
                              {SOCIAL_PLATFORMS.map(p => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveSocialAccount(acc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Username / Handle */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              اسم المستخدم (Username / Handle)
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                dir="ltr"
                                value={acc.username}
                                onChange={e => handleUpdateSocialAccount(acc.id, { username: e.target.value })}
                                placeholder="@handle أو user.name"
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left"
                              />
                              <button
                                type="button"
                                onClick={() => copyToClipboard(acc.username, 'اسم المستخدم', `soc-user-${acc.id}`)}
                                className="absolute left-1.5 p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                                title="نسخ اسم المستخدم"
                              >
                                {copiedKey === `soc-user-${acc.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              كلمة المرور (Password)
                            </label>
                            <div className="relative flex items-center">
                              <input
                                type={isPassVisible ? 'text' : 'password'}
                                dir="ltr"
                                value={acc.password || ''}
                                onChange={e => handleUpdateSocialAccount(acc.id, { password: e.target.value })}
                                placeholder="••••••••••••"
                                className="w-full pl-16 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left tracking-wider"
                              />
                              <div className="absolute left-1.5 flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(passKey)}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                  title={isPassVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                                >
                                  {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(acc.password || '', 'كلمة المرور', passKey)}
                                  className="p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                                  title="نسخ كلمة المرور"
                                >
                                  {copiedKey === passKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Profile URL */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              رابط الحساب (Profile URL)
                            </label>
                            <input
                              type="url"
                              dir="ltr"
                              value={acc.url || ''}
                              onChange={e => handleUpdateSocialAccount(acc.id, { url: e.target.value })}
                              placeholder="https://instagram.com/..."
                              className="w-full px-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] text-left"
                            />
                          </div>

                          {/* 2FA / Notes */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                              ملاحظات التحقق بخطوتين (2FA Notes)
                            </label>
                            <input
                              type="text"
                              value={acc.notes || ''}
                              onChange={e => handleUpdateSocialAccount(acc.id, { notes: e.target.value })}
                              placeholder="مثال: يطلب رمز على جوال العميل / لا يوجد 2FA"
                              className="w-full px-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AD ACCESS ACCOUNTS */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    إيميلات وصلاحيات الوصول للحسابات الإعلانية
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    سجل إيميلات الأكسيس الممنوحة لفريق الميديا باينج على حسابات فيسبوك، جوجل، تيك توك، وسناب شات.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddAdAccessAccount}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة إيميل أكسيس</span>
                </button>
              </div>

              {adAccessAccounts.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 bg-slate-50/50 dark:bg-[#1A1A1E]">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      لم يتم تسجيل أي إيميلات أكسيس إعلاني
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      أضف إيميلات الوصول لحسابات الإعلانات، المنصات، ومستويات الصلاحيات الممنوحة للفريق.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdAccessAccount}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة أكسيس إعلاني</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {adAccessAccounts.map((ad, idx) => (
                    <div
                      key={ad.id || idx}
                      className="p-4 bg-slate-50/80 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2 flex-1 max-w-xs">
                          <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                          <select
                            value={ad.platform}
                            onChange={e => handleUpdateAdAccessAccount(ad.id, { platform: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE]"
                          >
                            {AD_PLATFORMS.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAdAccessAccount(ad.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Access Email */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            إيميل الوصول (Access Email)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="email"
                              dir="ltr"
                              value={ad.email}
                              onChange={e => handleUpdateAdAccessAccount(ad.id, { email: e.target.value })}
                              placeholder="agency.buyer@domain.com"
                              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ad.email, 'إيميل الأكسيس', `ad-email-${ad.id}`)}
                              className="absolute left-1.5 p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                              title="نسخ الإيميل"
                            >
                              {copiedKey === `ad-email-${ad.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Role / Access Level */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            مستوى الصلاحية (Role / Level)
                          </label>
                          <select
                            value={ad.roleOrAccessLevel || 'مسؤول كامل (Admin)'}
                            onChange={e => handleUpdateAdAccessAccount(ad.id, { roleOrAccessLevel: e.target.value })}
                            className="w-full px-2.5 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE]"
                          >
                            {ACCESS_ROLES.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* Account ID */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            معرّف الحساب الإعلاني (Account ID)
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              dir="ltr"
                              value={ad.accountId || ''}
                              onChange={e => handleUpdateAdAccessAccount(ad.id, { accountId: e.target.value })}
                              placeholder="act_1234567890 أو رقم الحساب"
                              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ad.accountId || '', 'معرف الحساب', `ad-id-${ad.id}`)}
                              className="absolute left-1.5 p-1 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                              title="نسخ المعرف"
                            >
                              {copiedKey === `ad-id-${ad.id}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                            ملاحظات على الحساب الإعلاني
                          </label>
                          <input
                            type="text"
                            value={ad.notes || ''}
                            onChange={e => handleUpdateAdAccessAccount(ad.id, { notes: e.target.value })}
                            placeholder="مثال: تم قبول الدعوة / الحساب باسم المتجر"
                            className="w-full px-3 py-2 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GMAIL ACCOUNT */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  إيميل الجيميل الخاص بالمشروع (Gmail Account)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  سجل إيميل الجيميل المخصص للعميل لإدارة الحملات ومراسلات المنصات.
                </p>
              </div>

              <div className="p-5 bg-slate-50/80 dark:bg-[#1E1E22] border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-4">
                {/* Gmail Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    عنوان إيميل الجيميل (Gmail Address)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      dir="ltr"
                      value={gmailEmail}
                      onChange={e => setGmailEmail(e.target.value)}
                      placeholder="client.brand@gmail.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(gmailEmail, 'إيميل الجيميل', 'gmail-email')}
                      className="absolute left-2 p-1.5 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                      title="نسخ الإيميل"
                    >
                      {copiedKey === 'gmail-email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Gmail Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    كلمة مرور الجيميل (Password)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={visiblePasswords['gmail'] ? 'text' : 'password'}
                      dir="ltr"
                      value={gmailPassword}
                      onChange={e => setGmailPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-20 pr-3 py-2.5 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] font-mono text-left tracking-wider font-medium"
                    />
                    <div className="absolute left-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('gmail')}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={visiblePasswords['gmail'] ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {visiblePasswords['gmail'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(gmailPassword, 'كلمة المرور', 'gmail-pass')}
                        className="p-1.5 text-slate-400 hover:text-[#593BFE] transition-colors cursor-pointer"
                        title="نسخ كلمة المرور"
                      >
                        {copiedKey === 'gmail-pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recovery Email or Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                    إيميل الاسترداد أو رقم الهاتف المربوط (Recovery)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={gmailRecovery}
                    onChange={e => setGmailRecovery(e.target.value)}
                    placeholder="recovery@domain.com أو رقم الجوال"
                    className="w-full px-3 py-2.5 bg-white dark:bg-[#141416] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] text-left font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GENERAL ACCESS NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ملاحظات عامة وتعليمات الأكسيس ورموز التحقق
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  سجل أي تعليمات خاصة بتسجيل الدخول، أكواد النسخ الاحتياطي (Backup Codes)، أو طرق التواصل لطلب رمز التحقق OTP.
                </p>
              </div>

              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="اكتب هنا أي تعليمات إضافية بخصوص الدخول أو أوقات توفر العميل لإرسال أكواد التحقق..."
                rows={6}
                className="w-full p-4 bg-slate-50/80 dark:bg-[#1E1E22] border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#593BFE] resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#202024]/60 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>البيانات مشفرة ومحفوظة لفريق العمل المصرح له فقط.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#593BFE] hover:bg-[#492de0] text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCredentialsModal;
