const fs = require('fs');
const code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');
const lines = code.split('\n');

// we can't easily parse jsx with cheerio without transpiling.
// let's instead try to grep for `<CheckSquare` or similar and see which one could be matched.

console.log('done');
