const fs = require('fs');

let content = fs.readFileSync('src/components/AddTaskModal.tsx', 'utf8');

// 1. Modal container
content = content.replace(
  'className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200"',
  'className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200"'
);

// 2. Header
// Leave as bg-slate-900 text-white (or make it adapt).
content = content.replace(
  'className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between"',
  'className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between"'
);

// 3. Labels
content = content.replace(
  /className="block font-bold text-slate-700 mb-1"/g,
  'className="block font-bold text-slate-700 dark:text-slate-300 mb-1"'
);

// 4. Inputs & Select & Textarea
const inputClass = 'className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"';
const inputClassDark = 'className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"';

content = content.replace(new RegExp(inputClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), inputClassDark);

// 5. Special Inputs
const inputClass2 = 'className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"';
const inputClass2Dark = 'className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"';
content = content.replace(new RegExp(inputClass2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), inputClass2Dark);

const inputClass3 = 'className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-rose-700"';
const inputClass3Dark = 'className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-rose-700 dark:text-rose-400"';
content = content.replace(new RegExp(inputClass3.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), inputClass3Dark);

// 6. Buttons
content = content.replace(
  'className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"',
  'className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"'
);

content = content.replace(
  'className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2"',
  'className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2"'
);

fs.writeFileSync('src/components/AddTaskModal.tsx', content);

