const fs = require('fs');
const glob = require('glob');
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
}

walk(path.join(__dirname, 'src/components'), function(err, results) {
  if (err) throw err;
  
  const modalFiles = results.filter(f => f.includes('Modal.tsx'));
  
  for (const file of modalFiles) {
    let content = fs.readFileSync(file, 'utf8');

    // Make modal backgrounds dark mode compatible
    content = content.replace(/bg-white([^"]*?border-slate-200)/g, 'bg-white dark:bg-slate-900 $1 dark:border-slate-800');
    content = content.replace(/bg-white([^"]*?border-b border-slate-200)/g, 'bg-white dark:bg-slate-900 $1 dark:border-slate-800');
    // But wait, the header has `bg-slate-900` explicitly. So let's replace exact strings.
  }
});
