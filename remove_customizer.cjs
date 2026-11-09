const fs = require('fs');
let content = fs.readFileSync('src/components/DashboardCustomizerModal.tsx', 'utf8');

const regex = /<div className="flex items-center justify-between p-3.*?إظهار شريط توزيع الشركات.*?<\/div>\s*<\/div>/s;
content = content.replace(regex, "");
fs.writeFileSync('src/components/DashboardCustomizerModal.tsx', content);
