const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');
const lines = code.split('\n');
const newLines = [...lines.slice(0, 1000), ...lines.slice(1032)];
fs.writeFileSync('src/components/ClientDetailPage.tsx', newLines.join('\n'));
