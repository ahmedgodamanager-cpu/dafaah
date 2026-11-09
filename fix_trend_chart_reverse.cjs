const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

code = code.replace('<AreaChart data={trendData.slice().reverse()} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>', '<AreaChart data={trendData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>');

fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
