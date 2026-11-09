import React from 'react';
import { User } from 'firebase/auth';
import { ShieldAlert, LogOut, Mail, User as UserIcon } from 'lucide-react';

interface SuspendedUserScreenProps {
  user: User;
  profile: any;
  onLogout: () => void;
}

export const SuspendedUserScreen: React.FC<SuspendedUserScreenProps> = ({
  user,
  profile,
  onLogout,
}) => {
  const displayName = profile?.name || user.displayName || 'المستخدم';
  const email = user.email || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-[#593BFE]/20" dir="rtl">
      <div className="max-w-md w-full bg-white dark:bg-[#18181b] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
        
        {/* App Logo */}
        <div className="flex justify-center">
          <img
            src="/logo-light.png"
            alt="دفة - DEFFA CRM"
            className="block dark:hidden h-14 w-auto object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.dataset.tried !== '1') {
                target.dataset.tried = '1';
                target.src = 'https://i.ibb.co/Kpk6wtn2/logo-light.jpg';
              }
            }}
          />
          <img
            src="/logo-dark.png"
            alt="دفة - DEFFA CRM"
            className="hidden dark:block h-14 w-auto object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.dataset.tried !== '1') {
                target.dataset.tried = '1';
                target.src = 'https://i.ibb.co/fzL9yFQd/logo-dark.jpg';
              }
            }}
          />
        </div>

        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-rose-600 dark:text-rose-400" />
        </div>

        {/* Main Status Headline */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            الحساب موقوف حالياً
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            تم إيقاف صلاحية الوصول لهذا الحساب
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            تم تعطيل صلاحية الدخول الخاصة بك إلى لوحة تحكم النظام من قبل إدارة الوكالة. لا يمكنك الوصول إلى بيانات العملاء أو المهام.
          </p>
        </div>

        {/* User Details Card */}
        <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-right space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">اسم الحساب:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>{displayName}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">البريد الإلكتروني:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5 dir-ltr">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{email}</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-slate-400 font-medium">حالة الحساب:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              معطل (Pending / Suspended)
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
          إذا كنت تعتقد أن هذا الإجراء تم بالخطأ أو ترغب بإعادة تفعيل حسابك، يرجى التواصل مع مدير النظام (Ahmed Goda).
        </p>

        {/* Action Button: Sign Out */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-rose-600/20 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>

      </div>
    </div>
  );
};
