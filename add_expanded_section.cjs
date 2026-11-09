const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

const expandedSection = `
        {/* Expanded Info Section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">إجمالي المهام</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{client.tasks.length} مهمة</span>
            </div>
            {client.createdAt && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">تاريخ الإضافة</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">{formatDateArabic(client.createdAt)}</span>
              </div>
            )}
            {client.notes && (
              <div className="flex flex-col gap-1 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">ملاحظات</span>
                <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-[11px] leading-relaxed line-clamp-3">
                  {client.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Toggle Expand Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
          className="mt-3 flex items-center justify-center gap-1 w-full text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1.5"
        >
          {isExpanded ? (
            <>
              <span>عرض أقل</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>عرض المزيد</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
`;

code = code.replace(
  '        {/* WhatsApp Group Link if available */}',
  expandedSection + '\n        {/* WhatsApp Group Link if available */}'
);

fs.writeFileSync('src/components/ClientCard.tsx', code);
