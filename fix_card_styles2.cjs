const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

// Update main text color for stronger contrast
code = code.replace(/text-lg font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400/g, 'text-lg font-extrabold text-slate-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400');

// Update hover on card container
code = code.replace(/shadow-sm hover:shadow-xl hover:-translate-y-1\.5 hover:ring-2 hover:ring-indigo-500\/30 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50\/30 dark:hover:bg-indigo-900\/10 transition-all duration-300 ease-out cursor-pointer/g, 'shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-indigo-500/30 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer');

// Fix group text
code = code.replace(/text-xs text-slate-500 dark:text-slate-400 font-medium mt-1/g, 'text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1');

// Update action bar text contrast
code = code.replace(/text-slate-600 dark:text-slate-300/g, 'text-slate-700 dark:text-slate-200');
code = code.replace(/text-slate-500 dark:text-slate-400 font-medium/g, 'text-slate-600 dark:text-slate-300 font-semibold');

fs.writeFileSync('src/components/ClientCard.tsx', code);
