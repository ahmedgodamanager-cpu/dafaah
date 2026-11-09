const fs = require('fs');

// 1. Revert index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/<html lang="ar">/, '<html lang="ar" dir="rtl">');
fs.writeFileSync('index.html', indexHtml);

// 2. Revert main.tsx
let mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
mainTsx = mainTsx.replace(/import '\.\/i18n';\n/, '');
fs.writeFileSync('src/main.tsx', mainTsx);

// 3. Revert AppExperience.tsx
let appExp = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');
appExp = appExp.replace(/import \{ useTranslation \} from 'react-i18next';\n/, '');
appExp = appExp.replace(/const \{ t, i18n \} = useTranslation\(\);\n\s*const toggleLanguage = \(\) => \{\n\s*const nextLang = i18n\.language === 'ar' \? 'en' : 'ar';\n\s*i18n\.changeLanguage\(nextLang\);\n\s*\};\n/, '');

appExp = appExp.replace(/placeholder=\{t\("app\.searchPlaceholder", "ابحث عن عميل أو كود"\)\}/g, 'placeholder="ابحث عن عميل أو كود"');
appExp = appExp.replace(/placeholder=\{t\("app\.searchPlaceholder", "ابحث عن عميل"\)\}/g, 'placeholder="ابحث عن عميل"');
appExp = appExp.replace(/title=\{t\("app\.tools", "الأدوات"\)\}/g, 'title="الأدوات"');
appExp = appExp.replace(/aria-label=\{t\("app\.close", "إغلاق"\)\}/g, 'aria-label="إغلاق قائمة الأدوات"');
appExp = appExp.replace(/label=\{t\("app\.dailyActivation", "تفعيل يومي"\)\}/g, 'label="تفعيل يومي"');
appExp = appExp.replace(/label=\{props\.isReadingMode \? t\('app\.cancelReadingMode', 'إلغاء نمط القراءة'\) : t\('app\.readingMode', 'نمط القراءة'\)\}/g, "label={props.isReadingMode ? 'إلغاء نمط القراءة' : 'نمط القراءة'}");
appExp = appExp.replace(/label=\{t\("app\.printReport", "طباعة التقرير"\)\}/g, 'label="طباعة التقرير"');
appExp = appExp.replace(/label=\{t\("app\.exportCSV", "تصدير CSV"\)\}/g, 'label="تصدير CSV"');
appExp = appExp.replace(/label=\{t\("app\.importCSV", "استيراد CSV"\)\}/g, 'label="استيراد CSV"');
appExp = appExp.replace(/label=\{t\("app\.restoreData", "استعادة البيانات"\)\}/g, 'label="استعادة البيانات"');
appExp = appExp.replace(/aria-label=\{t\("app\.darkMode", "تبديل المظهر"\)\}/g, 'aria-label="تبديل المظهر"');
appExp = appExp.replace(/aria-label=\{t\("app\.alerts", "التنبيهات"\)\}/g, 'aria-label="التنبيهات"');
appExp = appExp.replace(/\{t\("app\.newClient", "عميل جديد"\)\}/g, 'عميل جديد');

appExp = appExp.replace(/const navigation = \[\s*\{ id: 'dashboard' as const, label: t\('app\.home', 'الرئيسية'\), icon: LayoutDashboard \}, \s*\{ id: 'focus' as const, label: t\('app\.focusMode', 'المتابعة'\), icon: ListTodo \}, \s*\{ id: 'activations' as const, label: t\('app\.globalActivations', 'التفعيلات'\), icon: Activity \}, \s*\{ id: 'reports' as const, label: t\('app\.monthlyReports', 'التقارير'\), icon: BarChart3 \}\s*\];/g, 
  "const navigation = [{ id: 'dashboard' as const, label: 'الرئيسية', icon: LayoutDashboard }, { id: 'focus' as const, label: 'المتابعة', icon: ListTodo }, { id: 'activations' as const, label: 'التفعيلات', icon: Activity }, { id: 'reports' as const, label: 'التقارير', icon: BarChart3 }];");

const langButtonRegex = /<button onClick=\{toggleLanguage\}[\s\S]*?<\/button>\s*(<button onClick=\{props\.onToggleDarkMode\})/;
appExp = appExp.replace(langButtonRegex, '$1');

// Add dir="rtl" back
appExp = appExp.replace(/<main className="grid/, '<main dir="rtl" className="grid');
appExp = appExp.replace(/<div  role="alert"/, '<div dir="rtl" role="alert"');
appExp = appExp.replace(/<header className="sticky/, '<header dir="rtl" className="sticky');

fs.writeFileSync('src/components/AppExperience.tsx', appExp);

