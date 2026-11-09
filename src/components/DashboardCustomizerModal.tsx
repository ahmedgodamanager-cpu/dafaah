import React from 'react';
import { createPortal } from 'react-dom';
import { X, LayoutGrid, Eye, GripVertical, RotateCcw, Check, SlidersHorizontal, BellRing } from 'lucide-react';
import { DashboardConfig, Client } from '../types';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onUpdateConfig: (newConfig: Partial<DashboardConfig>) => void;
  onResetCardOrder: () => void;
  /** Not used any more (it fed the removed colour-by-contract/group section); kept so callers stay valid. */
  clients?: Client[];
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetCardOrder,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" >
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">تخصيص لوحة التحكم والعرض</h3>
              <p className="text-xs text-[var(--text-muted)]">إظهار وإخفاء أجزاء لوحة التحكم</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[var(--text-muted)] dark:hover:text-slate-200 hover:bg-[var(--surface-hover)] dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-3.5">
          {/* Customization Options */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)]/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 text-[var(--text)] rounded-lg border border-[var(--border)]">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">كروت الإحصائيات والأرقام</p>
                <p className="text-[11px] text-[var(--text-muted)]">إجمالي العملاء، التأخيرات، ونسبة الإنجاز</p>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ showStatsCards: !config.showStatsCards })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                config.showStatsCards ? 'bg-indigo-600 justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)]/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 text-[var(--text)] rounded-lg border border-[var(--border)]">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">شريط الفلاتر السريعة والشركات</p>
                <p className="text-[11px] text-[var(--text-muted)]">تصفية حسب الشركة والعقد والحالة</p>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ showFilterBar: !config.showFilterBar })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                config.showFilterBar ? 'bg-indigo-600 justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)]/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 text-[var(--text)] rounded-lg border border-[var(--border)]">
                <GripVertical className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">ترتيب البطاقات (سحب وإفلات)</p>
                <p className="text-[11px] text-[var(--text-muted)]">إتاحة سحب وتغيير مواقع كروت العملاء</p>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ enableDragAndDrop: !config.enableDragAndDrop })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                config.enableDragAndDrop ? 'bg-indigo-600 justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform" />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)]/60 dark:border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 text-[var(--text)] rounded-lg border border-[var(--border)] text-amber-500">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text)]">تنبيه المهام المستحقة عند الدخول</p>
                <p className="text-[11px] text-[var(--text-muted)]">إظهار تنبيه مرئي لوجود مهام متأخرة أو اليوم</p>
              </div>
            </div>
            <button
              onClick={() => onUpdateConfig({ enableTaskAlerts: !config.enableTaskAlerts })}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                config.enableTaskAlerts ? 'bg-indigo-600 justify-start' : 'bg-slate-300 dark:bg-slate-700 justify-end'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform" />
            </button>
          </div>
          
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <button
            onClick={onResetCardOrder}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 px-3 py-2 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة ضبط الترتيب
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-900 dark:bg-[var(--surface-hover)] text-white dark:text-slate-900 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            <Check className="w-4 h-4" />
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  ,
  document.body
  );
};
