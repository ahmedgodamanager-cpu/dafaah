const fs = require('fs');
let content = fs.readFileSync('src/components/ClientTasksSection.tsx', 'utf8');

const lastBracket = content.lastIndexOf(')}');
if (lastBracket !== -1) {
  content = content.substring(0, lastBracket) + content.substring(lastBracket + 2);
}

fs.writeFileSync('src/components/ClientTasksSection.tsx', content);
