const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

// Ensure Download is imported from lucide-react
if (!content.includes('Download,')) {
  content = content.replace("from 'lucide-react';", "Download,\n} from 'lucide-react';");
}

const functionToAdd = `  const handleExportTasksPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('الرجاء السماح بالنوافذ المنبثقة (Pop-ups) لطباعة التقرير');
      return;
    }

    const filteredTasks = client.tasks || [];

    const htmlContent = \`
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>تقرير مهام - \${client.clientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { 
            font-family: 'Cairo', sans-serif; 
            padding: 40px; 
            color: #1e293b; 
            background: #ffffff;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e2e8f0; 
            padding-bottom: 20px; 
          }
          h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 24px; }
          .client-info { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
            background: #f8fafc; 
            padding: 20px; 
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .info-label { font-size: 13px; color: #64748b; font-weight: 600; }
          .info-value { font-size: 16px; color: #0f172a; font-weight: 700; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
          }
          th, td { 
            border: 1px solid #e2e8f0; 
            padding: 14px; 
            text-align: right; 
          }
          th { 
            background-color: #f1f5f9; 
            font-weight: 700; 
            color: #475569;
            font-size: 14px;
          }
          td { font-size: 14px; }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
          }
          .status-completed { background: #d1fae5; color: #059669; }
          .status-delayed { background: #ffe4e6; color: #e11d48; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .client-info { break-inside: avoid; }
            table { break-inside: auto; }
            tr { break-inside: avoid; break-after: auto; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقرير متابعة المهام</h1>
          <p style="margin: 0; color: #64748b;">\${client.companyName || ''}</p>
        </div>
        <div class="client-info">
          <div class="info-item">
            <span class="info-label">اسم العميل</span>
            <span class="info-value">\${client.clientName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">كود العميل</span>
            <span class="info-value">\${client.code}</span>
          </div>
          <div class="info-item">
            <span class="info-label">إجمالي المهام</span>
            <span class="info-value">\${filteredTasks.length}</span>
          </div>
          <div class="info-item">
            <span class="info-label">تاريخ التقرير</span>
            <span class="info-value">\${new Date().toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th width="35%">المهمة</th>
              <th width="15%">القسم</th>
              <th width="15%">الاستحقاق</th>
              <th width="15%">الحالة</th>
              <th width="20%">ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            \${filteredTasks.map(task => {
              const isCompleted = task.completed;
              const catInfo = CATEGORIES_INFO.find(c => c.id === task.category);
              const daysDiff = getDaysDifference(task.dueDate);
              
              let statusText = '';
              let statusClass = '';
              
              if (isCompleted) {
                statusText = 'مكتملة';
                statusClass = 'status-completed';
              } else if (daysDiff < 0) {
                statusText = 'متأخرة';
                statusClass = 'status-delayed';
              } else {
                statusText = 'قيد التنفيذ';
                statusClass = 'status-pending';
              }

              return \`
                <tr>
                  <td style="font-weight: 600;">\${task.title}</td>
                  <td>\${catInfo ? catInfo.nameAr : task.category}</td>
                  <td>\${formatDateArabic(task.dueDate)}</td>
                  <td><span class="status-badge \${statusClass}">\${statusText}</span></td>
                  <td style="color: #64748b;">\${task.notes || '-'}</td>
                </tr>
              \`;
            }).join('')}
          </tbody>
        </table>
        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً من نظام الإدارة
        </div>
        <script>
          window.onload = () => { 
            setTimeout(() => {
              window.print(); 
              window.close(); 
            }, 500);
          };
        </script>
      </body>
      </html>
    \`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };`;

// Insert the function before return (
const returnIndex = content.indexOf('  return (');
if (returnIndex !== -1) {
  content = content.slice(0, returnIndex) + '\n' + functionToAdd + '\n\n' + content.slice(returnIndex);
}

// Insert the button next to "إضافة تاسك لهذه المرحلة"
const buttonHtml = `          <div className="flex items-center gap-2">
            <button
              onClick={handleExportTasksPDF}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-[var(--border)] shadow-xs transition-all shrink-0"
              title="تصدير جدول المهام كملف PDF"
            >
              <Download className="w-3.5 h-3.5" />
              تصدير PDF
            </button>
            {!isReadingMode && (
              <button
                onClick={() => onOpenAddTask(client.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                إضافة تاسك لهذه المرحلة
              </button>
            )}
          </div>`;

const oldButtonHtmlMatch = content.match(/{!isReadingMode && \(\s*<button\s*onClick={\(\) => onOpenAddTask\(client\.id\)}[\s\S]*?إضافة تاسك لهذه المرحلة\s*<\/button>\s*\)}/);

if (oldButtonHtmlMatch) {
  content = content.replace(oldButtonHtmlMatch[0], buttonHtml);
} else {
  console.log("Could not find the button HTML");
}

fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
