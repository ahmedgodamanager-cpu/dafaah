const fs = require('fs');
let code = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

code = code.replace(
  `      </div>\n      </div>\n      {/* Main Section Selector Tabs */}`,
  `      {/* Main Section Selector Tabs */}`
);

fs.writeFileSync('src/components/ClientDetailPage.tsx', code);
