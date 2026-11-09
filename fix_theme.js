import fs from 'fs';
import path from 'path';

const patterns = [
  // Backgrounds
  { match: /bg-white dark:bg-slate-900/g, replace: 'bg-[var(--surface)]' },
  { match: /bg-white dark:bg-slate-950/g, replace: 'bg-[var(--surface)]' },
  { match: /bg-slate-50 dark:bg-slate-900/g, replace: 'bg-[var(--surface-hover)]' },
  { match: /bg-slate-50 dark:bg-slate-950/g, replace: 'bg-[var(--bg)]' },
  { match: /bg-slate-100 dark:bg-slate-800/g, replace: 'bg-[var(--surface-hover)]' },
  { match: /bg-slate-100 dark:bg-slate-900/g, replace: 'bg-[var(--surface-hover)]' },
  { match: /bg-slate-900 dark:bg-slate-950/g, replace: 'bg-[var(--surface)] text-[var(--text)]' },

  // Text
  { match: /text-slate-900 dark:text-white/g, replace: 'text-[var(--text)]' },
  { match: /text-slate-800 dark:text-white/g, replace: 'text-[var(--text)]' },
  { match: /text-slate-800 dark:text-slate-200/g, replace: 'text-[var(--text)]' },
  { match: /text-slate-700 dark:text-slate-300/g, replace: 'text-[var(--text)]' },
  { match: /text-slate-700 dark:text-slate-200/g, replace: 'text-[var(--text)]' },
  { match: /text-slate-600 dark:text-slate-400/g, replace: 'text-[var(--text-muted)]' },
  { match: /text-slate-600 dark:text-slate-300/g, replace: 'text-[var(--text-muted)]' },
  { match: /text-slate-500 dark:text-slate-400/g, replace: 'text-[var(--text-muted)]' },
  { match: /text-slate-500 dark:text-slate-300/g, replace: 'text-[var(--text-muted)]' },
  { match: /text-slate-400 dark:text-slate-500/g, replace: 'text-[var(--text-muted)]' },

  // Borders
  { match: /border-slate-200 dark:border-slate-800/g, replace: 'border-[var(--border)]' },
  { match: /border-slate-200 dark:border-slate-700/g, replace: 'border-[var(--border)]' },
  { match: /border-slate-300 dark:border-slate-700/g, replace: 'border-[var(--border)]' },
  { match: /border-slate-300 dark:border-slate-800/g, replace: 'border-[var(--border)]' },
  { match: /border-slate-100 dark:border-slate-800/g, replace: 'border-[var(--border)]' }
];

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            for (const p of patterns) {
                content = content.replace(p.match, p.replace);
            }

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}
processDir('src');
