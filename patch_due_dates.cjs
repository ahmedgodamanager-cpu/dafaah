const fs = require('fs');
let code = fs.readFileSync('src/data/initialClients.ts', 'utf8');

const oldLogic = `      const dates = getTaskDatesForMonth(t.week, month);
      const isMultipleMonths = safeDuration > 1;
      const titleSuffix = isMultipleMonths ? \` (الشهر \${month + 1})\` : '';
      
      allTasks.push({
        id: \`t-\${clientId}-m\${month}-\${idx + 1}\`,
        taskNumber: \`\${t.taskNumber}-M\${month+1}\`,
        title: \`\${t.title}\${titleSuffix}\`,
        category: t.category,
        startDate: dates.start,
        dueDate: dates.due,
        completed: false,
        monthIndex: month + 1
      });`;

const newLogic = `      const dates = getTaskDatesForMonth(t.week, month);
      
      let dueDate = dates.due;
      if (t.taskNumber === 'W1-ACC-01') {
        dueDate = addBusinessDays(dates.start, 1);
      } else if (t.category === 'account_management' && t.title.includes('اعتماد العميل')) {
        dueDate = addBusinessDays(dates.start, 2);
      }

      const isMultipleMonths = safeDuration > 1;
      const titleSuffix = isMultipleMonths ? \` (الشهر \${month + 1})\` : '';
      
      allTasks.push({
        id: \`t-\${clientId}-m\${month}-\${idx + 1}\`,
        taskNumber: \`\${t.taskNumber}-M\${month+1}\`,
        title: \`\${t.title}\${titleSuffix}\`,
        category: t.category,
        startDate: dates.start,
        dueDate: dueDate,
        completed: false,
        monthIndex: month + 1
      });`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/data/initialClients.ts', code);
  console.log("Success");
} else {
  console.log("Failed to find logic block");
}
