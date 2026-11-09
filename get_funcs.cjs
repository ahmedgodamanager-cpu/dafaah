const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const funcs = [
  "const handleDragStart",
  "const handleDragOver",
  "const handleDragEnd",
  "const toggleTaskCompletion",
  "const saveTaskNotes"
];

funcs.forEach(f => {
  const i = content.indexOf(f);
  console.log(f, i !== -1 ? "FOUND" : "NOT FOUND");
});
