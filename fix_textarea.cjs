const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const oldTextareaSection = `
              <div className="pt-2">
                <div className="relative group">
                  <div className="absolute top-3 right-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <AlignRight className="w-4 h-4" />
                  </div>
                  <textarea
                    value={localMiniBrief}
                    onChange={(e) => setLocalMiniBrief(e.target.value)}
                    onBlur={() => {
                      if (localMiniBrief !== (client.miniBrief || '')) {
                        onUpdateClient({ ...client, miniBrief: localMiniBrief });
                      }
                    }}
                    placeholder="اكتب بريف مصغر أو نبذة سريعة عن العميل هنا..."
                    className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm hover:border-slate-300 dark:hover:border-slate-700"
                    rows={2}
                  />
                </div>
              </div>`;

const newTextareaSection = `
              <div className="pt-2">
                <div className="relative group">
                  <div className="absolute top-3 right-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                    <AlignRight className="w-4 h-4" />
                  </div>
                  {!isEditingMiniBrief && localMiniBrief ? (
                    <div className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-3 pr-10 pl-12 shadow-sm relative min-h-[50px] whitespace-pre-wrap leading-relaxed overflow-hidden">
                      {localMiniBrief}
                      <button
                        onClick={() => setIsEditingMiniBrief(true)}
                        className="absolute left-2 top-2 p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="تعديل النبذة"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <textarea
                        value={localMiniBrief}
                        onChange={(e) => setLocalMiniBrief(e.target.value)}
                        placeholder="اكتب بريف مصغر أو نبذة سريعة عن العميل هنا..."
                        className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl py-3 pr-10 pl-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 resize-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 pb-12"
                        rows={Math.max(2, localMiniBrief.split('\\n').length)}
                        autoFocus={isEditingMiniBrief}
                      />
                      {localMiniBrief && (
                        <div className="absolute left-2 bottom-2 flex gap-2">
                          {isEditingMiniBrief && (
                            <button
                              onClick={() => {
                                setIsEditingMiniBrief(false);
                                setLocalMiniBrief(client.miniBrief || '');
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              إلغاء
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setIsEditingMiniBrief(false);
                              if (localMiniBrief !== (client.miniBrief || '')) {
                                onUpdateClient({ ...client, miniBrief: localMiniBrief });
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                            حفظ
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>`;

if (code.includes('placeholder="اكتب بريف مصغر')) {
  // Let's do a more robust replace using regex to handle spacing issues
  code = code.replace(/<div className="pt-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, newTextareaSection);
  fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target code block");
}
