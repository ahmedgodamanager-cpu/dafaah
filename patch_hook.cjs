const fs = require('fs');
let content = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

content = content.replace("const { user } = useAuth();", "const { user, profile } = useAuth();");
content = content.replace(
  "if (user.email === 'ahmedgoda.manager@gmail.com') {",
  "if (user.email === 'ahmedgoda.manager@gmail.com' || profile?.role === 'admin' || profile?.role === 'manager') {"
);

fs.writeFileSync('src/hooks/useFirestoreData.ts', content);
