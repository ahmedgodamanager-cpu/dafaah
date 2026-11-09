const fs = require('fs');
let content = fs.readFileSync('src/components/ClientFormModal.tsx', 'utf8');

content = content.replace(/إضافة عميل جديد/g, "{clientToEdit ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}");
content = content.replace(/إضافة العميل/g, "{clientToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}");

fs.writeFileSync('src/components/ClientFormModal.tsx', content);
