const fs = require('fs');

function patch(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-white([^"]*?border-slate-200)/g, 'bg-white dark:bg-slate-900 $1 dark:border-slate-800');
  content = content.replace(/bg-white([^"]*?shadow-2xl)/g, 'bg-white dark:bg-slate-900 $1');
  content = content.replace(/bg-white([^"]*?text-slate-700)/g, 'bg-white dark:bg-slate-900 $1 dark:text-slate-300');
  fs.writeFileSync(file, content);
}

patch('src/components/AlertsDrawer.tsx');
patch('src/components/GlobalActivationsView.tsx');

