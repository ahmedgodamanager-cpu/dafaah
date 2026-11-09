const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

code = code.replace(
  '{/* Bottom Quick Action Bar (أزرار الإجراءات السريعة) */}',
  '{/* Bottom Quick Action Bar (أزرار الإجراءات السريعة) */}\n      {/* Hiding old bar as we added hover overlay */}'
);
code = code.replace(
  '<div className="relative z-10 pt-1">\n        <div className="grid grid-cols-4 gap-2">',
  '<div className="relative z-10 pt-1 hidden">\n        <div className="grid grid-cols-4 gap-2">'
);

fs.writeFileSync('src/components/ClientCard.tsx', code);
