const fs = require('fs');
let content = fs.readFileSync('src/components/ClientCard.tsx', 'utf8');

content = content.replace(
  "export const ClientCard: React.FC<ClientCardProps> = ({",
  "export const ClientCard: React.FC<ClientCardProps> = React.memo(({"
);

const lastBraceIndex = content.lastIndexOf('};');
if (lastBraceIndex !== -1 && content.slice(lastBraceIndex).match(/};\s*$/)) {
    content = content.slice(0, lastBraceIndex) + '});\n' + content.slice(lastBraceIndex + 2);
} else {
    // try finding the last `}`
    const lastBrace = content.lastIndexOf('}');
    content = content.slice(0, lastBrace + 1) + ');\n';
}

fs.writeFileSync('src/components/ClientCard.tsx', content);
