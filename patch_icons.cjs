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

walk(path.join(__dirname, 'src'), function(err, results) {
  if (err) throw err;
  
  const tsxFiles = results.filter(f => f.endsWith('.tsx'));
  
  for (const file of tsxFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Add rtl:-scale-x-100 to directional icons
    const iconRegex = /(<(?:ChevronLeft|ChevronRight|ArrowRight|ArrowLeft)\s+[^>]*className=")([^"]*)(")/g;
    
    content = content.replace(iconRegex, (match, p1, p2, p3) => {
      if (!p2.includes('rtl:-scale-x-100')) {
        changed = true;
        return p1 + p2 + ' rtl:-scale-x-100' + p3;
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(file, content);
    }
  }
});
