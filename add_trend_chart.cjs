const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

// Change the grid
code = code.replace(
  '<div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">',
  '<div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">'
);

// New chart block
const chartBlock = `            {/* 3-Month Trend Chart */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                <span>معدل الإنجاز (آخر 3 أشهر):</span>
              </div>
              <div className="h-44 w-full relative flex items-center justify-center pt-2">
                {trendData.length > 0 && trendData.some(d => d.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData.slice().reverse()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" opacity={0.2} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        dy={5}
                      />
                      <RechartsTooltip
                        formatter={(val, name, props) => [
                          \`\${val}% (\${props.payload.completed}/\${props.payload.total})\`,
                          'نسبة الإنجاز'
                        ]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '11px',
                          direction: 'rtl'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 font-medium">لا توجد مهام سابقة كافية</div>
                )}
              </div>
            </div>

            {/* Contract Dates & Automated Days Counter */}`;

code = code.replace('            {/* Contract Dates & Automated Days Counter */}', chartBlock);

fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
