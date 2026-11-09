const fs = require('fs');
let content = fs.readFileSync('src/utils/firebaseUtils.ts', 'utf8');

content = content.replace(
  "throw new Error(JSON.stringify(errInfo));",
  "// throw new Error(JSON.stringify(errInfo));"
);

fs.writeFileSync('src/utils/firebaseUtils.ts', content, 'utf8');
