const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

content = content.replace(
  "import { useState } from 'react';",
  "import React, { useState } from 'react';"
);

fs.writeFileSync('src/components/AppExperience.tsx', content);
