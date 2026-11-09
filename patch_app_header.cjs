const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

// Update hardcoded texts to use t('...')
const replacements = [
  ['placeholder="ابحث عن عميل أو كود"', 'placeholder={t("app.searchPlaceholder", "ابحث عن عميل أو كود")}'],
  ['placeholder="ابحث عن عميل"', 'placeholder={t("app.searchPlaceholder", "ابحث عن عميل")}'],
  ['title="الأدوات"', 'title={t("app.tools", "الأدوات")}'],
  ['aria-label="إغلاق قائمة الأدوات"', 'aria-label={t("app.close", "إغلاق")}'],
  ['label="تفعيل يومي"', 'label={t("app.dailyActivation", "تفعيل يومي")}'],
  ["label={props.isReadingMode ? 'إلغاء نمط القراءة' : 'نمط القراءة'}", "label={props.isReadingMode ? t('app.cancelReadingMode', 'إلغاء نمط القراءة') : t('app.readingMode', 'نمط القراءة')}"],
  ['label="طباعة التقرير"', 'label={t("app.printReport", "طباعة التقرير")}'],
  ['label="تصدير CSV"', 'label={t("app.exportCSV", "تصدير CSV")}'],
  ['label="استيراد CSV"', 'label={t("app.importCSV", "استيراد CSV")}'],
  ['label="استعادة البيانات"', 'label={t("app.restoreData", "استعادة البيانات")}'],
  ['aria-label="تبديل المظهر"', 'aria-label={t("app.darkMode", "تبديل المظهر")}'],
  ['aria-label="التنبيهات"', 'aria-label={t("app.alerts", "التنبيهات")}'],
  ['عميل جديد', '{t("app.newClient", "عميل جديد")}']
];

for (const [search, replace] of replacements) {
  content = content.replace(new RegExp(search.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replace);
}

fs.writeFileSync('src/components/AppExperience.tsx', content);
