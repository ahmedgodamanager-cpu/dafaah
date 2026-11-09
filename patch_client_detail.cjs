const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

content = content.replace("const { user } = useAuth();", "const { user, profile } = useAuth();");
content = content.replace(
  "const isAdmin = user?.email === 'ahmedgoda.manager@gmail.com';",
  "const isAdmin = user?.email === 'ahmedgoda.manager@gmail.com' || profile?.role === 'admin';"
);

// We need to hide delete client if not admin.
// Wait, currently the delete button is rendered like this:
const deleteBtn = `<button
                onClick={handleDeleteClient}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-[var(--surface)] hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-[var(--border)] px-3 py-2 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                حذف العميل
              </button>`;

if (content.includes(deleteBtn)) {
  content = content.replace(deleteBtn, `{isAdmin && (${deleteBtn})}`);
}

fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
