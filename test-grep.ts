import fs from 'fs';
const code = fs.readFileSync('src/components/StatsOverview.tsx', 'utf-8');
console.log(code.split('\n').slice(0, 50).join('\n'));
