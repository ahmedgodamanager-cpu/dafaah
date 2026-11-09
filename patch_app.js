const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { Users, Search, PlusCircle, RotateCcw, ChevronLeft, Home, Building2, ChevronUp, ChevronDown } from 'lucide-react';",
  "import { Users, Search, PlusCircle, RotateCcw, ChevronLeft, Home, Building2, ChevronUp, ChevronDown, Database } from 'lucide-react';"
);

let emptyState = `{clients.length === 0 ? (
                <div className="text-center py-16 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border)] p-8 shadow-xs">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">مرحباً بك في المنصة</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                    يبدو أن حسابك لا يحتوي على أي بيانات. يمكنك البدء بإضافة عميل جديد أو تحميل بيانات افتراضية نموذجية لتجربة المنصة.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => setIsAddClientOpen(true)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors"
                    >
                      إضافة عميل جديد
                    </button>
                    <button
                      onClick={seedInitialData}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      تحميل بيانات تجريبية
                    </button>
                  </div>
                </div>
              ) : filteredClients.length === 0 ? (`;

content = content.replace("{filteredClients.length === 0 ? (", emptyState);

fs.writeFileSync('src/App.tsx', content, 'utf8');
