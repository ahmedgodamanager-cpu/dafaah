import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary' | 'success' | string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  const variantStyles: Record<string, { bg: string; iconBg: string }> = {
    danger: {
      bg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      iconBg: 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400',
    },
    warning: {
      bg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
      iconBg: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
    },
    primary: {
      bg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    },
    success: {
      bg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface)] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200">

        
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${style.iconBg}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-[var(--text-muted)] dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--text)] bg-white dark:bg-slate-800 hover:bg-[var(--surface-hover)] dark:hover:bg-slate-700 border border-[var(--border)] rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${style.bg}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
