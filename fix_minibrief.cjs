const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

// Add the useState hook for local miniBrief
const hookInsert = `  const [copied, setCopied] = useState(false);
  const [localMiniBrief, setLocalMiniBrief] = useState(client.miniBrief || '');`;
code = code.replace("  const [copied, setCopied] = useState(false);", hookInsert);

// Ensure it updates if client changes from outside
const effectInsert = `  React.useEffect(() => {
    setLocalMiniBrief(client.miniBrief || '');
  }, [client.miniBrief]);

  const [copied, setCopied]`;
code = code.replace("  const [copied, setCopied]", effectInsert);

// Update textarea
const oldTextarea = `<textarea
                  value={client.miniBrief || ''}
                  onChange={(e) => onUpdateClient({ ...client, miniBrief: e.target.value })}
                  placeholder="اكتب بريف مصغر عن العميل هنا..."
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={2}
                />`;

const newTextarea = `<textarea
                  value={localMiniBrief}
                  onChange={(e) => setLocalMiniBrief(e.target.value)}
                  onBlur={() => {
                    if (localMiniBrief !== (client.miniBrief || '')) {
                      onUpdateClient({ ...client, miniBrief: localMiniBrief });
                    }
                  }}
                  placeholder="اكتب بريف مصغر عن العميل هنا..."
                  className="w-full text-sm bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={2}
                />`;

code = code.replace(oldTextarea, newTextarea);

fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
