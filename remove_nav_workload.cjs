const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

const strToReplace = '{ id: "workload" as const, label: "حِمل الفريق", icon: Users },';
const lines = content.split('\\n');
const filtered = lines.filter(line => !line.includes('id: "workload"'));
fs.writeFileSync('src/components/AppExperience.tsx', filtered.join('\\n'));
