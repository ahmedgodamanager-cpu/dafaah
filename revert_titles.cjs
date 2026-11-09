const fs = require('fs');

let content = fs.readFileSync('src/data/initialClients.ts', 'utf8');

const replacements = {
  "'البريف - بيكون خلال 24 ساعة بحد أقصي من اضافة العميل علي السيستم'": "'البريف'",
  "'اعتماد العميل لبلان تصاميم السوشيال ميديا - بعد 48 ساعه بحد أقصي من استلام البلان'": "'اعتماد العميل لبلان تصاميم السوشيال ميديا'",
  "'اعتماد العميل لبلان فيديوهات الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام البلان'": "'اعتماد العميل لبلان فيديوهات الحملات الاعلانية'",
  "'اعتماد العميل لبلان تصاميم الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام التصاميم'": "'اعتماد العميل لبلان تصاميم الحملات الاعلانية'",
  "'اعتماد العميل لبلان الفيديوهات للحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام البلان'": "'اعتماد العميل لبلان الفيديوهات للحملات الاعلانية'",
  "'اعتماد العميل تصاميم السوشيال ميديا - بعد 48 ساعه بحد أقصي من استلام التصاميم'": "'اعتماد العميل تصاميم السوشيال ميديا'",
  "'اعتماد العميل فيديوهات الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام الفيديوهات'": "'اعتماد العميل فيديوهات الحملات الاعلانية'",
  "'اعتماد العميل تصاميم الحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام التصاميم'": "'اعتماد العميل تصاميم الحملات الاعلانية'",
  "'اعتماد العميل الفيديوهات للحملات الاعلانية - بعد 48 ساعه بحد أقصي من استلام الفيديوهات'": "'اعتماد العميل الفيديوهات للحملات الاعلانية'",
  "'التقرير الشهري (لكل شهر حسب مدة تعاقد العميل)'": "'التقرير الشهري'",
  "'التقرير الاسبوعي الأول ( ده بيكون يوم الخميس )'": "'التقرير الاسبوعي الأول ( ده بيكون يوم الخميس )'", // this one might be okay but maybe I should revert it to original if needed? No they said it like that.
};

for (const [oldStr, newStr] of Object.entries(replacements)) {
  content = content.replaceAll(oldStr, newStr);
}

// Now we need to update the logic for dueDate calculation based on the task IDs or exact clean titles
// Previously it was:
/*
      let dueDate = dates.due;
      // Overrides based on task titles
      if (t.title.includes('البريف - بيكون خلال 24 ساعة')) {
        dueDate = addBusinessDays(dates.start, 1);
      } else if (t.title.includes('بعد 48 ساعه')) {
        dueDate = addBusinessDays(dates.start, 2);
      }
*/
const oldLogic = `      let dueDate = dates.due;
      // Overrides based on task titles
      if (t.title.includes('البريف - بيكون خلال 24 ساعة')) {
        dueDate = addBusinessDays(dates.start, 1);
      } else if (t.title.includes('بعد 48 ساعه')) {
        // Technically these depend on completion of another task, but by default we give them a short window
        dueDate = addBusinessDays(dates.start, 2);
      }`;

const newLogic = `      let dueDate = dates.due;
      // Overrides based on task titles
      if (t.taskNumber === 'W1-ACC-01') {
        dueDate = addBusinessDays(dates.start, 1);
      } else if (t.title.includes('اعتماد العميل') && (t.week === 2 || t.week === 3) && t.category === 'account_management') {
        // For tasks W2-ACC-01 to W2-ACC-04 and W3-ACC-01 to W3-ACC-04
        dueDate = addBusinessDays(dates.start, 2);
      }`;

content = content.replace(oldLogic, newLogic);

fs.writeFileSync('src/data/initialClients.ts', content);
console.log("Updated initialClients.ts");

