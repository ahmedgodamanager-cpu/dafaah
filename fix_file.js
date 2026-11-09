import fs from 'fs';
let code = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

code = code.replace(/<\/motion.div><\/\}><\/AnimatePresence>/g, '</motion.div></div>}</AnimatePresence>');
code = code.replace(/<\/motion.aside><\/\}><\/AnimatePresence>/g, '</motion.aside></div>}</AnimatePresence>');
code = code.replace(/<\/motion.div><\/\?\}><\/AnimatePresence>/g, '</motion.div></div>}</AnimatePresence>');

fs.writeFileSync('src/components/AppExperience.tsx', code);
