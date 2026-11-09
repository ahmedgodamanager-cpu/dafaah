import fs from 'fs';
import path from 'path';

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Check if it has an input, textarea or select
            if (/<(input|textarea|select)/.test(content)) {
                // Find all classNames in these tags and ensure they have dark:text-white and dark:bg-slate-950
                // Actually, just add it globally in index.css is much safer.
                console.log(fullPath);
            }
        }
    }
}
processDir('src/components');
