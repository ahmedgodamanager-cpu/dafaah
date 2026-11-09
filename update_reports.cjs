const fs = require('fs');
let content = fs.readFileSync('src/components/MonthlyReportsView.tsx', 'utf8');

if (!content.includes('import { useAuth }')) {
  content = content.replace(
    "import { Client, DailyActivation } from '../types';",
    "import { Client, DailyActivation } from '../types';\nimport { useAuth } from '../context/AuthContext';"
  );
}

const componentStart = 'export function MonthlyReportsView({ clients, onSelectClient }: MonthlyReportsViewProps) {';
const profileHook = '  const { profile } = useAuth();';

if (!content.includes(profileHook)) {
  content = content.replace(
    componentStart,
    `${componentStart}\n${profileHook}`
  );
}

const renderStart = '      {/* Page Header & Month Selector */}';

const newCompanySummary = `      {/* Company Summaries */}
      <div className="bg-[var(--surface)] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {profile?.role === 'admin' ? 'إحصائيات الشركات (إجمالي العملاء)' : 'الشركات الخاصة بك (عدد عملائك)'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.role === 'admin' ? 'إجمالي العملاء المسجلين في كل شركة عبر النظام' : 'العملاء المسندين إليك أو قمت بإنشائهم في كل شركة'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COMPANY_OPTIONS.map((cName) => {
            const count = clients.filter(c => (c.companyName || 'بدون شركة') === cName).length;
            
            return (
              <div
                key={cName}
                className="relative overflow-hidden flex flex-col p-5 rounded-2xl border bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 text-right transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between w-full mb-4">
                  {cName === 'AL - Ahly' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'Herak' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'SYT' ? (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                      <Building2 className="w-7 h-7 text-slate-400" />
                    </div>
                  )}
                </div>
                
                <div className="mt-auto">
                  <h4 className="text-[var(--text)] font-bold text-xl mb-1">{cName}</h4>
                  <div className="flex items-baseline gap-1.5">
                    <span className={\`text-4xl font-black \${count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}\`}>
                      {count}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text-muted)]">عميل</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Page Header & Month Selector */}`;

if (!content.includes('إحصائيات الشركات')) {
  content = content.replace(renderStart, newCompanySummary);
}

fs.writeFileSync('src/components/MonthlyReportsView.tsx', content);
