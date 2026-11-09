const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const startStr = `<div className="space-y-6">`;
const endStr = `      </div>\n      )}`; // Just before ConfirmationModal

const startIndex = content.indexOf(startStr, 55000);
const endIndex = content.indexOf('      {/* Confirmation Modal */}');

if (startIndex !== -1 && endIndex !== -1) {
  const tasksJsx = content.substring(startIndex, endIndex);
  fs.writeFileSync('tasks_jsx.txt', tasksJsx);
  console.log("Copied to tasks_jsx.txt, length:", tasksJsx.length);
} else {
  console.log("Failed", startIndex, endIndex);
}
