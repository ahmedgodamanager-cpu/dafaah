const fs = require('fs');
let content = fs.readFileSync('src/components/UsersView.tsx', 'utf8');

content = content.replace(
  "<option value=\"member\">مستخدم</option>",
  "<option value=\"member\">مستخدم</option>\n                              <option value=\"manager\">مدير الأكونت مانجمنت</option>"
);

// We should also change how roles are displayed if not in editing mode.
fs.writeFileSync('src/components/UsersView.tsx', content);
