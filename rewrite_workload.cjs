const fs = require('fs');

const content = `import React, { useMemo } from 'react';
import { Client, TaskItem } from '../types';
import { CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';
import { getTaskTimeStatus } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';

interface WorkloadDashboardViewProps {
  clients: Client[];
}

export function WorkloadDashboardView({ clients }: WorkloadDashboardViewProps) {
  const { profile } = useAuth();
  
  const workloadStats = useMemo(() => {
    const stats: Record<string, { total: number, completed: number, delayed: number, dueSoon: number }> = {
      'قسم الأكونت مانجمنت': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم السيو': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم الميديا باينج': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
      'قسم السوشيال ميديا': { total: 0, completed: 0, delayed: 0, dueSoon: 0 },
    };

    clients.forEach(client => {
      // Skip completed or lost clients
      if (client.caseStatus === 'مكتمل' || client.isLost) return;
      
      const isClientCreator = profile?.role === 'admin' || client.createdBy === profile?.name || client.createdBy === profile?.email;

      (client.tasks || []).forEach(task => {
        // If not admin, check if user is assigned to this task or created this client
        const isTaskOwner = isClientCreator || task.assignedTo === profile?.name || task.createdBy === profile?.name;
        
        if (profile?.role !== 'admin' && !isTaskOwner) {
          return; // Skip this task if it doesn't belong to the user
        }

        let dept = '';
        if (task.category === 'account_management') dept = 'قسم الأكونت مانجمنت';
        else if (task.category === 'seo') dept = 'قسم السيو';
        else if (task.category === 'media_buying') dept = 'قسم الميديا باينج';
        else if (task.category === 'social_media') dept = 'قسم السوشيال ميديا';
        else return;

        stats[dept].total++;
        if (task.completed) {
          stats[dept].completed++;
        } else {
          const timeStatus = getTaskTimeStatus(task);
          if (timeStatus.type === 'overdue') {
            stats[dept].delayed++;
          } else if (timeStatus.type === 'due_soon' || timeStatus.type === 'due_today') {
            stats[dept].dueSoon++;
          }
        }
      });
    });

    return stats;
  }, [clients, profile]);

  const departments = Object.entries(workloadStats) as [string, { total: number, completed: number, delayed: number, dueSoon: number }][];

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {profile?.role === 'admin' ? 'مراقبة حِمل الفريق (Workload)' : 'حِمل العمل الخاص بك (Your Workload)'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {profile?.role === 'admin' 
              ? 'متابعة أداء الأقسام، المهام المتأخرة وتوزيع الضغط' 
              : 'متابعة مهامك الخاصة عبر الأقسام'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(([dept, stats]) => (
          <div key={dept} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">{dept}</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">إجمالي المهام</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.total}</span>
              </div>
              
              <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  مكتملة
                </div>
                <span className="text-lg font-bold">{stats.completed}</span>
              </div>

              <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" />
                  متأخرة
                </div>
                <span className="text-lg font-bold">{stats.delayed}</span>
              </div>

              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  قريبة (3 أيام)
                </div>
                <span className="text-lg font-bold">{stats.dueSoon}</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-600 dark:text-slate-400">نسبة الإنجاز</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: \`\${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%\` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/WorkloadDashboardView.tsx', content);
