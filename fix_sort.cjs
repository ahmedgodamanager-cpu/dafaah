const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const oldSort1 = `.sort((a, b) => {
      const dateA = new Date(a.dueDate || '2999-12-31').getTime();
      const dateB = new Date(b.dueDate || '2999-12-31').getTime();
      if (dateA !== dateB) return dateA - dateB;
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });`;

const newSort1 = `.sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = new Date(a.dueDate || '2999-12-31').getTime();
      const dateB = new Date(b.dueDate || '2999-12-31').getTime();
      return dateA - dateB;
    });`;

const oldSort2 = `const sortedTasks = [...tasksList].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      return orderA - orderB;
    });`;

const newSort2 = `const sortedTasks = [...tasksList].sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : 999;
      const orderB = b.order !== undefined ? b.order : 999;
      if (orderA !== orderB) return orderA - orderB;
      const dateA = new Date(a.dueDate || '2999-12-31').getTime();
      const dateB = new Date(b.dueDate || '2999-12-31').getTime();
      return dateA - dateB;
    });`;

content = content.replace(oldSort1, newSort1);
content = content.replace(oldSort2, newSort2);

fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
