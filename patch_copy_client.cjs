const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const oldCopyFn = `  const handleCopyClientData = async () => {
    const text = \`📋 بيانات العميل:
• اسم العميل: \${client.clientName}
• كود العميل: \${client.code}
\${client.companyName ? \`• الشركة: \${client.companyName}\\n\` : ''}• نوع العقد: \${client.contract}
• حالة العقد: \${client.caseStatus}
• مدة العقد: \${client.durationMonths} \${client.durationMonths === 1 ? 'شهر' : 'أشهر'} (+ 10 أيام)
• رقم الهاتف: \${client.clientNumber}
\${client.groupName ? \`• اسم الجروب: \${client.groupName}\\n\` : ''}\${client.contractDate ? \`• تاريخ التعاقد: \${formatDateArabic(client.contractDate)}\\n\` : ''}• تاريخ بداية العمل: \${formatDateArabic(client.startDate)}
• تاريخ النهاية: \${formatDateArabic(client.endDate)}
\${client.driveFolderUrl ? \`• رابط المجلد: \${client.driveFolderUrl}\\n\` : ''}\${client.notes ? \`• ملاحظات: \${client.notes}\\n\` : ''}\`.trim();`;

const newCopyFn = `  const handleCopyClientData = async () => {
    let text = \`📋 بيانات العميل:
• اسم العميل: \${client.clientName}
• كود العميل: \${client.code}
\${client.companyName ? \`• الشركة: \${client.companyName}\\n\` : ''}• نوع العقد: \${client.contract}
• حالة العقد: \${client.caseStatus}
• مدة العقد: \${client.durationMonths} \${client.durationMonths === 1 ? 'شهر' : 'أشهر'} (+ 10 أيام)
• رقم الهاتف: \${client.clientNumber}
\${client.groupName ? \`• اسم الجروب: \${client.groupName}\\n\` : ''}\${client.contractDate ? \`• تاريخ التعاقد: \${formatDateArabic(client.contractDate)}\\n\` : ''}• تاريخ بداية العمل: \${formatDateArabic(client.startDate)}
• تاريخ النهاية: \${formatDateArabic(client.endDate)}
\${client.driveFolderUrl ? \`• رابط المجلد: \${client.driveFolderUrl}\\n\` : ''}\${client.notes ? \`• ملاحظات: \${client.notes}\\n\` : ''}\`.trim();

    if (client.tasks && client.tasks.length > 0) {
      const stats = calculateClientProgress(client);
      const completedTasks = client.tasks.filter(t => t.completed);
      const pendingTasks = client.tasks.filter(t => !t.completed);
      
      text += \`\\n\\n📊 موجز المهام (\${stats.progressPercent}% نسبة الإنجاز):
• إجمالي المهام: \${stats.totalTasks}
• المهام المنجزة: \${stats.completedTasks}
• المهام المتبقية: \${stats.totalTasks - stats.completedTasks}\`;

      if (completedTasks.length > 0) {
        text += \`\\n\\n✅ المهام المكتملة:\\n\`;
        text += completedTasks.map(t => \`- \${t.title} (\${t.category === 'account_management' ? 'إدارة حسابات' : t.category === 'seo' ? 'سيو' : t.category === 'media_buying' ? 'ميديا باينج' : 'سوشيال ميديا'})\`).join('\\n');
      }

      if (pendingTasks.length > 0) {
        text += \`\\n\\n⏳ المهام المتبقية:\\n\`;
        text += pendingTasks.map(t => \`- \${t.title} (التسليم: \${formatDateArabic(t.dueDate)})\`).join('\\n');
      }
    }`;

if (content.includes("const text = `📋 بيانات العميل:")) {
    content = content.replace(oldCopyFn, newCopyFn);
    fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
    console.log("Successfully patched ClientDetailPage.");
} else {
    console.log("Could not find the function to patch.");
}
