const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const regex = /              <div>\s*<h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">\s*\{client\.clientName\}\s*<\/h1>\s*\{client\.groupName && \(\s*<p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">\s*اسم الجروب: \{client\.groupName\}\s*<\/p>\s*\)\}\s*<\/div>/;

const newH1 = `              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                    {client.clientName}
                  </h1>
                </div>
                {client.groupName && (
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500 dark:text-slate-400">
                    <Users className="w-4 h-4 opacity-70" />
                    <p className="text-sm font-medium">
                      اسم الجروب: {client.groupName}
                    </p>
                  </div>
                )}
              </div>`;

code = code.replace(regex, newH1);
fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
