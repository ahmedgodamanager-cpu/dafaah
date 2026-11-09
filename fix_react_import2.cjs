const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

content = "import React from 'react';\n" + content;

fs.writeFileSync('src/components/AppExperience.tsx', content);
