const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

// 1. Softer shadows (shadow-sm -> shadow-md) and gentler hover shadow
code = code.replace(/shadow-sm hover:shadow-2xl hover:-translate-y-2 hover:ring-2 hover:ring-indigo-500\/30 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer/g, 'shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer');

// 2. High contrast for Arabic text
// Already text-slate-950, let's keep it or change groupName text
code = code.replace(/text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1/g, 'text-xs text-slate-700 dark:text-slate-300 font-bold mt-1');

// 3. Carefully considered padding
// Replace p-5 sm:p-6 gap-5 with p-6 sm:p-7 gap-6
code = code.replace(/p-5 sm:p-6 gap-5/g, 'p-6 sm:p-7 gap-6');

// Additional adjustments to make data look more organized
// Dates: text-slate-600 -> text-slate-800
code = code.replace(/text-slate-600 dark:text-slate-300 font-semibold/g, 'text-slate-800 dark:text-slate-200 font-bold');

// Days Diff pill
code = code.replace(/text-\[10px\] font-medium border shadow-2xs/g, 'text-[11px] font-bold border shadow-xs');

// Status indicator
code = code.replace(/text-\[11px\] font-medium/g, 'text-[11px] font-bold tracking-wide');

fs.writeFileSync('src/components/ClientCard.tsx', code);
