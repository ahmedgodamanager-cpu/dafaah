const fs = require('fs');
let content = fs.readFileSync('src/components/ClientTasksSection.tsx', 'utf8');

// replace the end
content = content.replace(/      \}\)\n  \);\n\};\n/g, "  );\n};\n");
// Actually, let's just do a specific replace.
const badEnd = `        )}
      </div>
      </div>
      )}`;
const goodEnd = `        )}
      </div>
      </div>`;

content = content.replace(badEnd, goodEnd);
fs.writeFileSync('src/components/ClientTasksSection.tsx', content);
