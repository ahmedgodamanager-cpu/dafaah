const fs = require('fs');

let dash = fs.readFileSync('src/components/DashboardCustomizerModal.tsx', 'utf8');
dash = dash.replace(/<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/60 backdrop-blur-xs animate-in fade-in duration-200">/, '<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">');
fs.writeFileSync('src/components/DashboardCustomizerModal.tsx', dash);

let focus = fs.readFileSync('src/components/FocusView.tsx', 'utf8');
focus = focus.replace(/<section className="space-y-5">/, '<section className="space-y-5" dir="rtl">');
fs.writeFileSync('src/components/FocusView.tsx', focus);

