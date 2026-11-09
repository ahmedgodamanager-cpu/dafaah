const fs = require('fs');

const files = [
  'src/components/DepartmentTasksModal.tsx',
  'src/components/SectionTasksModal.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import { createPortal }')) {
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { createPortal } from 'react-dom';");
    content = content.replace('  return (', '  return createPortal(');
    content = content.replace(/  \);\n};\n?$/, '  ),\n  document.body\n  );\n};\n');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
