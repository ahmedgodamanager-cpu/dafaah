const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

// Undo the bad sed
content = content.replace(/import \{ StickyNote,/g, 'import {');

// Properly add to lucide-react ONLY
content = content.replace(/import \{([\s\S]*?)from 'lucide-react';/, function(match, p1) {
    if (!p1.includes('StickyNote')) {
        return `import { StickyNote,${p1}from 'lucide-react';`;
    }
    return match;
});

fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
