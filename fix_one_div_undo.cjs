const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');
code = code.replace(
  `            </div>\n              {client.notes && (`,
  `              {client.notes && (`
);
fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
