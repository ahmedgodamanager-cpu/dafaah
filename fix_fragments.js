const fs = require('fs');
let code = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

code = code.replace(/<AnimatePresence>{toolsOpen && <>/g, '<AnimatePresence>{toolsOpen && <div className="contents" key="tools-menu">');
code = code.replace(/<\/motion.div><\/><\/AnimatePresence><\/div>/g, '</motion.div></div>}</AnimatePresence></div>');

code = code.replace(/<AnimatePresence>{mobileOpen && <>/g, '<AnimatePresence>{mobileOpen && <div className="contents" key="mobile-menu">');
code = code.replace(/<\/motion.aside><\/><\/AnimatePresence>/g, '</motion.aside></div>}</AnimatePresence>');

fs.writeFileSync('src/components/AppExperience.tsx', code);
