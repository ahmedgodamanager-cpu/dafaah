const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

// Update main text color
code = code.replace(/text-slate-800 dark:text-slate-100 hover:text-slate-500 dark:hover:text-slate-300/g, 'text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400');

// Update group text color
code = code.replace(/text-xs text-slate-400 dark:text-slate-500 font-medium mt-1/g, 'text-xs text-slate-500 dark:text-slate-400 font-medium mt-1');

// Add hover ring and shadow to card container
code = code.replace(/shadow-sm hover:shadow-xl hover:-translate-y-1\.5 hover:bg-slate-50\/50 dark:hover:bg-slate-800\/50 transition-all duration-500 ease-out/g, 'shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:ring-2 hover:ring-indigo-500/30 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300 ease-out cursor-pointer');

fs.writeFileSync('src/components/ClientCard.tsx', code);
