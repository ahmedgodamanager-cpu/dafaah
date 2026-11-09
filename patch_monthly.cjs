const fs = require('fs');
let content = fs.readFileSync('src/components/MonthlyReportsView.tsx', 'utf8');

content = content.replace(
  "{profile?.role === 'admin' ? 'إحصائيات الشركات (إجمالي العملاء)' : 'الشركات الخاصة بك (عدد عملائك)'}",
  "{(profile?.role === 'admin' || profile?.role === 'manager') ? 'إحصائيات الشركات (إجمالي العملاء)' : 'الشركات الخاصة بك (عدد عملائك)'}"
);

content = content.replace(
  "{profile?.role === 'admin' ? 'إجمالي العملاء المسجلين في كل شركة عبر النظام' : 'العملاء المسندين إليك أو قمت بإنشائهم في كل شركة'}",
  "{(profile?.role === 'admin' || profile?.role === 'manager') ? 'إجمالي العملاء المسجلين في كل شركة عبر النظام' : 'العملاء المسندين إليك أو قمت بإنشائهم في كل شركة'}"
);

fs.writeFileSync('src/components/MonthlyReportsView.tsx', content);
