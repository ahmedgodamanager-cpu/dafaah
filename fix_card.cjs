const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

code = code.replace(/p-4 sm:p-5 gap-4/g, 'p-5 sm:p-6 gap-5');

fs.writeFileSync('src/components/ClientCard.tsx', code);
