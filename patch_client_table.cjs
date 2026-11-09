const fs = require('fs');
let content = fs.readFileSync('src/components/ClientListTable.tsx', 'utf8');

// Replace export const ClientListTable: React.FC<ClientListTableProps> = ({ ... }) => {
content = content.replace(
  "export const ClientListTable: React.FC<ClientListTableProps> = ({ clients, onSelect, onEdit, onDelete, onArchiveToggle, onAddTask, config }) => {",
  "export const ClientListTable: React.FC<ClientListTableProps> = React.memo(({ clients, onSelect, onEdit, onDelete, onArchiveToggle, onAddTask, config }) => {"
);

// We need to add the closing parenthesis for React.memo
// Assuming the component ends with a standard `};` or `  );` followed by `}`.
// Let's find the last `};` and replace it with `});`

const lastBraceIndex = content.lastIndexOf('};');
if (lastBraceIndex !== -1 && content.slice(lastBraceIndex).match(/};\s*$/)) {
    content = content.slice(0, lastBraceIndex) + '});\n' + content.slice(lastBraceIndex + 2);
} else {
    // try finding the last `}`
    const lastBrace = content.lastIndexOf('}');
    content = content.slice(0, lastBrace + 1) + ');\n';
}

fs.writeFileSync('src/components/ClientListTable.tsx', content);
