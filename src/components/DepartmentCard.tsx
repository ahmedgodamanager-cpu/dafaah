import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export interface DepartmentStats {
  total: number;
  completed: number;
  delayed: number;
  dueSoon: number;
}

export interface DepartmentCardProps {
  dept: string;
  stats: DepartmentStats;
  onClick?: () => void;
}

export const DepartmentCard: React.FC<DepartmentCardProps> = React.memo(({ dept, stats, onClick }) => {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm print:break-inside-avoid print:bg-white print:border-gray-300 print:shadow-none ${onClick ? 'cursor-pointer hover:border-indigo-400 transition-colors' : ''}`}
    >
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 print:text-black">
        {dept}
      </h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">إجمالي المهام</span>
          <span className="text-lg font-bold text-slate-900 dark:text-white print:text-black font-mono">{stats.total}</span>
        </div>
        
        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>مكتملة</span>
          </div>
          <span className="text-lg font-bold font-mono">{stats.completed}</span>
        </div>

        <div className="flex justify-between items-center text-rose-600 dark:text-rose-400 print:text-rose-700">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>متأخرة</span>
          </div>
          <span className="text-lg font-bold font-mono">{stats.delayed}</span>
        </div>

        <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 print:text-amber-700">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>قريبة (3 أيام)</span>
          </div>
          <span className="text-lg font-bold font-mono">{stats.dueSoon}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 print:border-gray-200">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-bold text-slate-600 dark:text-slate-400 print:text-gray-700">نسبة الإنجاز</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400 print:text-indigo-800 font-mono">
            {completionRate}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 print:bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
});

DepartmentCard.displayName = 'DepartmentCard';
export default DepartmentCard;
