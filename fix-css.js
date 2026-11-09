import fs from 'fs';
let content = fs.readFileSync('src/index.css', 'utf8');

// Insert after @layer base {
const insertion = `
  input, textarea, select {
    color: #0f172a;
  }
  html.dark input, html.dark textarea, html.dark select {
    color: #f8fafc;
    background-color: #020617;
  }
  input::placeholder, textarea::placeholder {
    color: #94a3b8;
  }
  html.dark input::placeholder, html.dark textarea::placeholder {
    color: #64748b;
  }
`;

content = content.replace('@layer base {', '@layer base {' + insertion);
fs.writeFileSync('src/index.css', content);
