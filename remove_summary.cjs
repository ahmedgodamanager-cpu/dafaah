const fs = require('fs');
let content = fs.readFileSync('src/components/StatsOverview.tsx', 'utf8');

const regex = /\{\s*\/\*\s*Optional Company Breakdown Summary Bar\s*\*\/\s*\}(.*?)\{\s*\/\*\s*Filter Controls Bar\s*\*\/\s*\}/s;
content = content.replace(regex, "{/* Filter Controls Bar */}");
fs.writeFileSync('src/components/StatsOverview.tsx', content);
