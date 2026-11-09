const fs = require('fs');
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
    // For AddActivationModal and others missing dark:bg-slate-900
    content = content.replace(/className="bg-white rounded-2xl/g, 'className="bg-white dark:bg-slate-900 rounded-2xl');
    
    // For text colors inside AddActivationModal
    content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-slate-200');
    content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-300');
    content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-400');
    content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
    
    // Inputs background
    content = content.replace(/bg-white border/g, 'bg-white dark:bg-slate-950 border');
    content = content.replace(/border-slate-300/g, 'border-slate-300 dark:border-slate-700');
    content = content.replace(/bg-slate-50/g, 'bg-slate-50 dark:bg-slate-800/50');
    content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-800');
    content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800');
    content = content.replace(/bg-slate-100/g, 'bg-slate-100 dark:bg-slate-800');
    
    // Clean up duplicate dark:classes that might have been created
    content = content.replace(/dark:text-slate-300 dark:text-slate-[0-9]+/g, 'dark:text-slate-300');
    content = content.replace(/dark:text-slate-400 dark:text-slate-[0-9]+/g, 'dark:text-slate-400');
    content = content.replace(/dark:text-slate-200 dark:text-slate-[0-9]+/g, 'dark:text-slate-200');
    content = content.replace(/dark:bg-slate-800\/50 dark:bg-slate-[0-9]+\/?[0-9]*/g, 'dark:bg-slate-800/50');
    content = content.replace(/dark:border-slate-800 dark:border-slate-[0-9]+/g, 'dark:border-slate-800');
    content = content.replace(/dark:border-slate-700 dark:border-slate-[0-9]+/g, 'dark:border-slate-700');
    content = content.replace(/dark:bg-slate-900 dark:bg-slate-[0-9]+/g, 'dark:bg-slate-900');
    
    fs.writeFileSync(file, content);
  }
});
