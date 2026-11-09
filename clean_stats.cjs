const fs = require('fs');
let content = fs.readFileSync('src/components/StatsOverview.tsx', 'utf8');

const regexCompanyCounts = /\/\/ Company count breakdown[\s\S]*?const companyCounts: Record<string, number> = {[\s\S]*?'AL - Ahly': 0,[\s\S]*?'SYT': 0,[\s\S]*?'Herak': 0,[\s\S]*?};\s*/;
content = content.replace(regexCompanyCounts, "");

const regexCompanyCalc = /if \(client\.companyName && companyCounts\[client\.companyName\] !== undefined\) {\s*companyCounts\[client\.companyName\]\+\+;\s*}\s*/;
content = content.replace(regexCompanyCalc, "");

fs.writeFileSync('src/components/StatsOverview.tsx', content);
