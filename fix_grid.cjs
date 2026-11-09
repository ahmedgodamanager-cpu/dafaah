const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace('<div className="space-y-4">', '<div className="space-y-6 mt-8">');
code = code.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">', '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">');

fs.writeFileSync('src/App.tsx', code);
