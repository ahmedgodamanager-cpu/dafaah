const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

// Add import
content = content.replace(
  /import \{ Logo \} from '\.\/Logo';/,
  "import { Logo } from './Logo';\nimport { useTranslation } from 'react-i18next';"
);

// Remove dir="rtl"
content = content.replace(/dir="rtl"/g, '');

// Update AppHeader to use translation
content = content.replace(
  /export function AppHeader\(props: AppHeaderProps\) \{/,
  `export function AppHeader(props: AppHeaderProps) {
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const nextLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
  };
`
);

// Update navigation
content = content.replace(
  /const navigation = \[\{ id: 'dashboard' as const, label: 'الرئيسية', icon: LayoutDashboard \}, \{ id: 'focus' as const, label: 'المتابعة', icon: ListTodo \}, \{ id: 'activations' as const, label: 'التفعيلات', icon: Activity \}, \{ id: 'reports' as const, label: 'التقارير', icon: BarChart3 \}\];/,
  `const navigation = [
    { id: 'dashboard' as const, label: t('app.home', 'الرئيسية'), icon: LayoutDashboard }, 
    { id: 'focus' as const, label: t('app.focusMode', 'المتابعة'), icon: ListTodo }, 
    { id: 'activations' as const, label: t('app.globalActivations', 'التفعيلات'), icon: Activity }, 
    { id: 'reports' as const, label: t('app.monthlyReports', 'التقارير'), icon: BarChart3 }
  ];`
);

// Add language button
const langButtonHtml = `
      <button onClick={toggleLanguage} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300" aria-label="تبديل اللغة">
        <span className="text-xs font-bold uppercase">{i18n.language === 'ar' ? 'EN' : 'AR'}</span>
      </button>
      <button onClick={props.onToggleDarkMode}`;

content = content.replace(
  /<button onClick=\{props\.onToggleDarkMode}/,
  langButtonHtml.trim()
);

fs.writeFileSync('src/components/AppExperience.tsx', content);
