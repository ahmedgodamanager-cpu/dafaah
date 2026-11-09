import React from 'react';
import { EmergencyRecoveryReport } from '../utils/emergencyRecovery';
import { CheckCircle2, RotateCcw, AlertTriangle, X, Check, Building2, Calendar } from 'lucide-react';

interface EmergencyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
  isRecovering?: boolean;
  report: EmergencyRecoveryReport | null;
  onStartRecovery: () => void | Promise<void>;
}

export const EmergencyRecoveryModal: React.FC<EmergencyRecoveryModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  isRecovering,
  report,
  onStartRecovery
}) => {
  const loading = isRecovering ?? isLoading ?? false;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        dir="rtl"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                استرجاع المهام المفقودة من سجل النشاطات
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                أداة طوارئ خاصة بالمدير لاسترجاع المهام المكتملة وتواريخ إنجازها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {!report && !loading && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    كيف تعمل عملية الاسترجاع؟
                  </p>
                  <p>
                    تقوم هذه الأداة بمسح جميع العملاء وقراءة <strong>سجل النشاطات (Activity Log)</strong> التاريخي لكل عميل. عندما تجد نشاطاً يثبت إكمال مهمة ما، ستقوم بإعادة تعيين حالتها إلى <span className="font-mono font-bold bg-amber-100/80 dark:bg-amber-900/60 px-1 rounded">completed: true</span> واستعادة تاريخ الإنجاز الأصلي <span className="font-mono font-bold bg-amber-100/80 dark:bg-amber-900/60 px-1 rounded">completedAt</span>.
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                    ✓ عملية آمنة بنسبة 100% ولا تحذف أو تعدل أي مهام أخرى.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={onStartRecovery}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  بدء فحص السجلات واسترجاع المهام
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                جارٍ فحص سجلات النشاطات واسترجاع المهام المكتملة...
              </h4>
              <p className="text-xs text-[var(--text-muted)] max-w-sm">
                يتم قراءة سجلات كل عميل ومطابقتها مع المهام. يرجى الانتظار ثوانٍ معدودة.
              </p>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-xs text-[var(--text-muted)] font-medium">العملاء المفحوصون</span>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{report.clientsScanned}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <span className="text-xs text-[var(--text-muted)] font-medium">إجمالي المهام</span>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{report.tasksScanned}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">المهام المسترجعة</span>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-300 mt-1">
                    {report.tasksRestored}
                  </p>
                </div>
              </div>

              {/* Status Message */}
              {report.tasksRestored > 0 ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      تم استرجاع {report.tasksRestored} مهمة مكتملة بنجاح!
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      تم تحديث حالة المهام في قاعدة البيانات لتعود مكتملة مع تواريخ إنجازها الموثقة.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    جميع المهام المكتملة مطابقة ومحفوظة بالفعل
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    لم يتم العثور على أي مهام مكتملة في السجل مفقودة في المهام الحالية.
                  </p>
                </div>
              )}

              {/* Restored Details List */}
              {report.restoredDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    تفاصيل المهام التي تم استرجاعها:
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl border border-slate-200 dark:border-slate-800 p-2 bg-slate-50/50 dark:bg-slate-950/40">
                    {report.restoredDetails.map((item, idx) => (
                      <div 
                        key={idx}
                        className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{item.clientName}</span>
                            <span className="text-[var(--text-muted)]">›</span>
                            <span className="text-emerald-600 dark:text-emerald-400">{item.taskTitle}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                            المصدر: {item.sourceActivity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-1 rounded-md shrink-0 self-start sm:self-auto border border-emerald-200 dark:border-emerald-800">
                          <Calendar className="w-3 h-3" />
                          <span>{item.completedAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-2">
          {report && !isLoading ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              تم وإغلاق
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
