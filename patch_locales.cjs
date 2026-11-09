const fs = require('fs');

const ar = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));

ar.app = {
  ...ar.app,
  searchPlaceholder: "ابحث عن عميل أو كود",
  tools: "الأدوات",
  darkMode: "تبديل المظهر",
  alerts: "التنبيهات",
  newClient: "عميل جديد",
  close: "إغلاق",
  dailyActivation: "تفعيل يومي",
  readingMode: "نمط القراءة",
  cancelReadingMode: "إلغاء نمط القراءة",
  printReport: "طباعة التقرير",
  exportCSV: "تصدير CSV",
  importCSV: "استيراد CSV",
  restoreData: "استعادة البيانات"
};

en.app = {
  ...en.app,
  searchPlaceholder: "Search client or code",
  tools: "Tools",
  darkMode: "Toggle Theme",
  alerts: "Alerts",
  newClient: "New Client",
  close: "Close",
  dailyActivation: "Daily Activation",
  readingMode: "Reading Mode",
  cancelReadingMode: "Cancel Reading Mode",
  printReport: "Print Report",
  exportCSV: "Export CSV",
  importCSV: "Import CSV",
  restoreData: "Restore Data"
};

fs.writeFileSync('src/locales/ar.json', JSON.stringify(ar, null, 2));
fs.writeFileSync('src/locales/en.json', JSON.stringify(en, null, 2));
