const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

// Update main hover effect on card
code = code.replace(
  'hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between overflow-hidden group relative p-6 sm:p-7 gap-6`}',
  'hover:-translate-y-1 hover:scale-[1.02] hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between overflow-hidden group relative p-6 sm:p-7 gap-6`}'
);

// We need to inject a hover overlay containing quick actions
const quickActionsOverlay = `      {/* Hover Quick Actions Overlay */}
      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex flex-col gap-2 w-3/4 max-w-[200px] translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(client.id); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            فتح ملف العميل
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); onAddTask?.(client.id); }}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 py-2.5 px-4 rounded-xl text-sm font-bold shadow-md border border-slate-200 dark:border-slate-700 transition-all"
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            إضافة مهمة سريعة
          </button>

          <a
            href={client.clientNumber ? waLink : '#'}
            target={client.clientNumber ? '_blank' : '_self'}
            onClick={(e) => { e.stopPropagation(); if (!client.clientNumber) e.preventDefault(); }}
            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 py-2.5 px-4 rounded-xl text-sm font-bold shadow-md border border-slate-200 dark:border-slate-700 transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            مراسلة واتساب
          </a>
        </div>
      </div>
`;

// Insert the overlay right after the wrapper div opening tag
code = code.replace(
  '{isExpired && (',
  quickActionsOverlay + '\n      {isExpired && ('
);

fs.writeFileSync('src/components/ClientCard.tsx', code);
