const fs = require('fs');
let code = fs.readFileSync('src/data/initialClients.ts', 'utf8');

const oldLogic = `      const dates = getTaskDatesForMonth(t.week, month);
      
      allTasks.push({
        id: \`\${clientId}-M\${month+1}-\${t.taskNumber}\`,
        taskNumber: t.taskNumber,
        title: month > 0 && t.title.includes('الشهري') ? \`\${t.title} (الشهر \${month+1})\` : t.title,
        category: t.category,
        startDate: dates.start,
        dueDate: dates.due,
        completed: false
      });`;

const newLogic = `      const dates = getTaskDatesForMonth(t.week, month);
      
      let dueDate = dates.due;
      // Overrides based on task titles
      if (t.title.includes('البريف - بيكون خلال 24 ساعة')) {
        dueDate = addBusinessDays(dates.start, 1);
      } else if (t.title.includes('بعد 48 ساعه')) {
        // Technically these depend on completion of another task, but by default we give them a short window
        dueDate = addBusinessDays(dates.start, 2);
      }
      
      allTasks.push({
        id: \`\${clientId}-M\${month+1}-\${t.taskNumber}\`,
        taskNumber: t.taskNumber,
        title: month > 0 && t.title.includes('الشهري') ? \`\${t.title} (الشهر \${month+1})\` : t.title,
        category: t.category,
        startDate: dates.start,
        dueDate: dueDate,
        completed: false
      });`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/data/initialClients.ts', code);
console.log("Success");
