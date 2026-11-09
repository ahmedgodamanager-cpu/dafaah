const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const restoreNotes = `
              {client.notes && (
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 max-w-2xl mt-3">
                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-1">ملاحظات العميل:</span>
                  {client.notes}
                </p>
              )}
            </div>`;

code = code.replace(
  `                </div>
              </div>

              {/* Plan Links */}`,
  `                </div>
              </div>

${restoreNotes}

              {/* Plan Links */}`
);

fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
console.log("Restored notes successfully");
