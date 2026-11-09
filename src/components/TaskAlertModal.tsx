import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarClock, AlertCircle, ArrowLeft } from 'lucide-react';

interface TaskAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  overdueCount: number;
  dueTodayCount: number;
  onNavigateToOverdue?: () => void;
  onNavigateToToday?: () => void;
}

export const TaskAlertModal: React.FC<TaskAlertModalProps> = ({
  isOpen,
  onClose,
  overdueCount,
  dueTodayCount,
  onNavigateToOverdue,
  onNavigateToToday,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleOverdueClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (onNavigateToOverdue) {
        onNavigateToOverdue();
      }
      onClose();
    } catch (err) {
      console.error('Error navigating to overdue tasks:', err);
      onClose();
    }
  };

  const handleTodayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (onNavigateToToday) {
        onNavigateToToday();
      }
      onClose();
    } catch (err) {
      console.error('Error navigating to today tasks:', err);
      onClose();
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm sm:max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Decorative Top Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-rose-500 to-[#593BFE]" />
        
        {/* Close "X" Button in top left (RTL) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-slate-800 shadow-sm relative">
            <BellRingIcon className="w-8 h-8 animate-pulse" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full" />
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1.5">تنبيه بالمهام المستحقة</h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-5">
            يوجد لديك مهام تتطلب انتباهك اليوم أو مهام متأخرة. اضغط على أي قسم للانتقال إليه مباشرة:
          </p>
          
          {/* Quick Clickable Stats Cards */}
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            {/* Overdue Clickable Box */}
            <button
              type="button"
              onClick={handleOverdueClick}
              className="group relative bg-rose-50/80 hover:bg-rose-100/90 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-600 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-rose-500/10 cursor-pointer text-center"
              title="اضغط للانتقال للمهام المتأخرة"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight leading-none mb-1">
                {overdueCount}
              </span>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                متأخرة
              </span>
              <span className="text-[10px] text-rose-500/90 dark:text-rose-400/90 mt-2 flex items-center gap-1 font-semibold group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                <span>عرض المهام</span>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </button>
            
            {/* Due Today Clickable Box */}
            <button
              type="button"
              onClick={handleTodayClick}
              className="group relative bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer text-center"
              title="اضغط للانتقال لمهام اليوم"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight leading-none mb-1">
                {dueTodayCount}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                مستحقة اليوم
              </span>
              <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 mt-2 flex items-center gap-1 font-semibold group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                <span>عرض المهام</span>
                <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              </span>
            </button>
          </div>

          {/* Dismiss Action */}
          <div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              تخطي ومتابعة للرئيسية
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Extracted just to keep imports clean above
const BellRingIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    <path d="M4 2C2.8 3.7 2 5.7 2 8" />
    <path d="M22 8c0-2.3-.8-4.3-2-6" />
  </svg>
);
