const fs = require('fs');
let code = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

code = code.replace("import React from 'react';", "import React, { useState } from 'react';");

// Add ChevronDown to imports
code = code.replace("  ChevronLeft,", "  ChevronLeft,\n  ChevronDown,\n  ChevronUp,");

// Add state to component
code = code.replace(
  'const stats = calculateClientProgress(client);',
  'const [isExpanded, setIsExpanded] = useState(false);\n  const stats = calculateClientProgress(client);'
);

fs.writeFileSync('src/components/ClientCard.tsx', code);
