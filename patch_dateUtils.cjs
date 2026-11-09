const fs = require('fs');
let code = fs.readFileSync('src/utils/dateUtils.ts', 'utf8');

const oldFunc = `export function evaluateClientCaseStatus(client: Client, refDate: Date = new Date()): import('../types').CaseStatus {
  if (client.caseStatus !== 'نشط' && client.caseStatus !== 'جديد') {
    return client.caseStatus;
  }
  
  if (!client.startDate) return client.caseStatus;
  
  const start = parseDate(client.startDate);
  if (!start) return client.caseStatus;
  
  const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffTime = ref.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  
  if (diffDays <= 30) {
    return 'جديد';
  } else {
    return 'نشط';
  }
}`;

const newFunc = `export function evaluateClientCaseStatus(client: Client, refDate: Date = new Date()): import('../types').CaseStatus {
  if (client.caseStatus !== 'نشط' && client.caseStatus !== 'جديد') {
    return client.caseStatus;
  }
  
  // Check if a brief task is completed
  const tasks = client.tasks || [];
  const isBriefDone = tasks.some(t => 
    t.completed && (t.title.includes('بريف') || t.title.toLowerCase().includes('brief'))
  );
  if (isBriefDone) {
    return 'نشط';
  }

  if (!client.startDate) return client.caseStatus;
  
  const start = parseDate(client.startDate);
  if (!start) return client.caseStatus;
  
  const ref = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const diffTime = ref.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
  
  if (diffDays <= 30) {
    return 'جديد';
  } else {
    return 'نشط';
  }
}`;

if (code.includes(oldFunc)) {
  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('src/utils/dateUtils.ts', code);
  console.log("Success");
} else {
  console.log("Could not find function");
}
