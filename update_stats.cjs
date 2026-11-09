const fs = require('fs');
let content = fs.readFileSync('src/components/StatsOverview.tsx', 'utf8');

// 1. Add import
content = content.replace(
  "import { WorkloadDashboardView } from './WorkloadDashboardView';",
  "import { WorkloadDashboardView } from './WorkloadDashboardView';\nimport { useAuth } from '../context/AuthContext';"
);

// 2. Add useAuth hook
content = content.replace(
  "const [sectionModalState, setSectionModalState] = useState",
  "const { profile } = useAuth();\n  const [sectionModalState, setSectionModalState] = useState"
);

// 3. Replace company summary UI
const oldCompanySummary = `      {config.showCompanySummary && (
        <div className="bg-[var(--surface)] p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-[var(--text)]">توزيع العملاء حسب الشركة:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {COMPANY_OPTIONS.map((cName) => {
              const isSelected = filterState.company === cName;
              return (
                <button
                  key={cName}
                  onClick={() => onFilterChange({ company: isSelected ? '' : cName })}
                  className={\`px-3 py-1 rounded-lg font-bold border flex items-center gap-1.5 transition-all \${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-[var(--text)] border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }\`}
                >
                  {cName === 'AL - Ahly' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm">
                      <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'Herak' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm">
                      <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : cName === 'SYT' ? (
                    <div className="flex items-center justify-center w-8 h-8 rounded bg-white dark:bg-transparent dark:border-transparent dark:shadow-none overflow-hidden border border-slate-200 shadow-sm">
                      <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
                      <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
                    </div>
                  ) : null}
                  <span>{cName}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                    {companyCounts[cName] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}`;

const newCompanySummary = `      {config.showCompanySummary && (
        <div className="animate-in fade-in duration-200 mt-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] text-lg">
                  {profile?.role === 'admin' ? 'إحصائيات الشركات (إجمالي العملاء)' : 'الشركات الخاصة بك (عدد عملائك)'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {profile?.role === 'admin' ? 'إجمالي العملاء المسجلين في كل شركة عبر النظام' : 'العملاء المسندين إليك أو قمت بإنشائهم في كل شركة'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COMPANY_OPTIONS.map((cName) => {
              const isSelected = filterState.company === cName;
              const count = companyCounts[cName] || 0;
              
              return (
                <button
                  key={cName}
                  onClick={() => onFilterChange({ company: isSelected ? '' : cName })}
                  className={\`relative overflow-hidden flex flex-col p-5 rounded-2xl border text-right transition-all \${
                    isSelected
                      ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-600 ring-2 ring-indigo-400/20'
                      : 'bg-[var(--surface)] border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700/50 shadow-xs hover:shadow-md'
                  }\`}
                >
                  <div className="flex items-center justify-between w-full mb-4">
                    {cName === 'AL - Ahly' ? (
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="https://i.ibb.co/d0KGfwr0/Chat-GPT-Image-Aug-8-2026-05-18-21-PM.png" alt="AL - Ahly" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/RGwxNcLQ/image.png" alt="AL - Ahly" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : cName === 'Herak' ? (
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="https://i.ibb.co/8nZzHJfw/image.png" alt="Herak" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/39625k7S/image.png" alt="Herak" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : cName === 'SYT' ? (
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white dark:bg-transparent overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img src="https://i.ibb.co/SDtvxvbQ/image.png" alt="SYT" className="dark:hidden w-full h-full object-contain scale-90" />
                        <img src="https://i.ibb.co/d0j14h76/image.png" alt="SYT" className="hidden dark:block w-full h-full object-contain scale-90" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <Building2 className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto">
                    <h4 className="text-[var(--text)] font-bold text-lg mb-1">{cName}</h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className={\`text-3xl font-black \${count > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}\`}>
                        {count}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-muted)]">عميل</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}`;

content = content.replace(oldCompanySummary, newCompanySummary);

fs.writeFileSync('src/components/StatsOverview.tsx', content);
