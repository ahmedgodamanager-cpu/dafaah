import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Users, Search, TrendingUp, Smartphone, Circle, Trash2 } from 'lucide-react';
import { formatDateArabic } from '../utils/dateUtils';
import { CATEGORIES_INFO } from '../data/initialClients';
import { TaskCategory } from '../types';

export interface TaskDisplayItem {
  id: string; // unique key
  taskId?: string;
  completed?: boolean;
  taskTitle: string;
  category: TaskCategory;
  clientName: string;
  clientId: string;
  dueDate: string;
  daysDiff: number;
}

interface TasksListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  headerIcon: React.ReactNode;
  headerIconBgClass: string;
  tasks: TaskDisplayItem[];
  onSelectClient?: (clientId: string) => void;
  onDeleteTask?: (clientId: string, taskId: string) => void;
  emptyMessage?: string;
}

export const TasksListModal: React.FC<TasksListModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  headerIcon,
  headerIconBgClass,
  tasks,
  onSelectClient,
  onDeleteTask,
  emptyMessage = "لا توجد مهام مطابقة",
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-8 border-b border-[var(--border)] bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${headerIconBgClass}`}>
              {headerIcon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-50/50 dark:bg-slate-900/20">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium text-lg">{emptyMessage}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((item) => {
                const catInfo = CATEGORIES_INFO.find(c => c.id === item.category) || CATEGORIES_INFO[0];
                return (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      if (onSelectClient) {
                        onSelectClient(item.clientId);
                        onClose();
                      }
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 p-2 rounded-lg ${catInfo.color}`}>
                        {catInfo.iconName === 'Users' ? <Users className="w-5 h-5" /> : 
                         catInfo.iconName === 'Search' ? <Search className="w-5 h-5" /> : 
                         catInfo.iconName === 'TrendingUp' ? <TrendingUp className="w-5 h-5" /> : 
                         catInfo.iconName === 'Smartphone' ? <Smartphone className="w-5 h-5" /> : 
                         <Circle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {item.taskTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">
                            العميل: {item.clientName}
                          </span>
                          <span className="text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            الاستحقاق: {formatDateArabic(item.dueDate)}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            item.daysDiff < 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                            item.daysDiff === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {item.daysDiff < 0 ? `متأخر (${Math.abs(item.daysDiff)} أيام)` :
                             item.daysDiff === 0 ? 'اليوم' : `متبقي ${item.daysDiff} أيام`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`هل أنت متأكد من حذف المهمة "${item.taskTitle}" نهائياً؟`)) {
                            onDeleteTask(item.clientId, item.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-all shrink-0 cursor-pointer"
                        title="حذف المهمة نهائياً"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
