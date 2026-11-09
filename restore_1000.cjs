const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const restoreText = `            </div>

            {/* Contract Dates & Automated Days Counter */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">تاريخ العقد:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatDateArabic(client.startDate)} ← {formatDateArabic(client.endDate)}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">عد الأيام المتبقية للعقد:</span>
                <span className={\`font-extrabold px-2.5 py-1 rounded-md text-xs \${
                  contractDaysDiff < 0
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    : contractDaysDiff <= 7
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }\`}>
                  {contractDaysDiff < 0
                    ? \`انتهى العقد من \${Math.abs(contractDaysDiff)} يوم\`
                    : \`متبقي \${contractDaysDiff} يوم\`}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
`;

code = code.replace(`      {/* Main Section Selector Tabs */}`, restoreText + `\n      {/* Main Section Selector Tabs */}`);
fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
