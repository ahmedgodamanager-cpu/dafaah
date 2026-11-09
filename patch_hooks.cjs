const fs = require('fs');
let content = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

content = content.replace(
  "handleFirestoreError(err, OperationType.LIST, 'clients');\n      setError(err.message);\n      setLoading(false);",
  "setError(err.message);\n      setLoading(false);\n      console.error('Firestore LIST error:', err);"
);

fs.writeFileSync('src/hooks/useFirestoreData.ts', content, 'utf8');
