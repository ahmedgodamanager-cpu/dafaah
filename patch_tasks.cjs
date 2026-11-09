const fs = require('fs');
let code = fs.readFileSync('src/data/initialClients.ts', 'utf8');

// Replace week 1
code = code.replace(
  "{ taskNumber: 'W1-ACC-01', title: 'البريف', category: 'account_management', week: 1, oneTimeOnly: true },",
  "{ taskNumber: 'W1-ACC-01', title: 'البريف - بيكون خلال 24 ساعة بحد أقصي من اضافة العميل علي السيستم', category: 'account_management', week: 1, oneTimeOnly: true },"
);

// We need to replace Week 2 and Week 3 ACC tasks. 
// Let's just find and replace the whole block of W2-ACC-01 to W2-ACC-05

const w2old = `  { taskNumber: 'W2-ACC-01', title: 'اعتماد العميل لبلان تصاميم السوشيال ميديا', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-02', title: 'اعتماد العميل لبلان فيديوهات السوشيال ميديا', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-03', title: 'اعتماد العميل لبلان تصاميم الحملات الاعلانية', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-04', title: 'اعتماد العميل لبلان الفيديوهات للحملات الاعلانية', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-05', title: 'تقرير الاسبوع الثاني', category: 'account_management', week: 2 },`;

const w2new = `  { taskNumber: 'W2-ACC-01', title: 'اعتماد العميل لبلان تصاميم السوشيال ميديا - بعد 48 ساعه بحد أقصي من استلام البلان', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-02', title: 'اعتماد العميل لبلان فيديوهات الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام البلان', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-03', title: 'اعتماد العميل لبلان تصاميم الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام التصاميم', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-04', title: 'اعتماد العميل لبلان الفيديوهات للحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام البلان', category: 'account_management', week: 2 },
  { taskNumber: 'W2-ACC-05', title: 'تقرير الاسبوع الثاني', category: 'account_management', week: 2 },`;

code = code.replace(w2old, w2new);

const w3old = `  { taskNumber: 'W3-ACC-01', title: 'اعتماد العميل تصاميم السوشيال ميديا', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-02', title: 'اعتماد العميل فيديوهات السوشيال ميديا', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-03', title: 'اعتماد العميل تصاميم الحملات الاعلانية', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-04', title: 'اعتماد العميل الفيديوهات للحملات الاعلانية', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-05', title: 'تقرير الاسبوع الثالث', category: 'account_management', week: 3 },`;

const w3new = `  { taskNumber: 'W3-ACC-01', title: 'اعتماد العميل تصاميم السوشيال ميديا - بعد 48 ساعه بحد أقصي من استلام التصاميم', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-02', title: 'اعتماد العميل فيديوهات الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام الفيديوهات', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-03', title: 'اعتماد العميل تصاميم الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام التصاميم', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-04', title: 'اعتماد العميل الفيديوهات للحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام الفيديوهات', category: 'account_management', week: 3 },
  { taskNumber: 'W3-ACC-05', title: 'تقرير الاسبوع الثالث', category: 'account_management', week: 3 },`;

code = code.replace(w3old, w3new);

const mAccOld = `{ taskNumber: 'M-ACC-01', title: 'التقرير الشهري', category: 'account_management', week: 5 },`;
const mAccNew = `{ taskNumber: 'M-ACC-01', title: 'التقرير الشهري (لكل شهر حسب مدة تعاقد العميل)', category: 'account_management', week: 5 },`;

code = code.replace(mAccOld, mAccNew);

fs.writeFileSync('src/data/initialClients.ts', code);
console.log("Success");
