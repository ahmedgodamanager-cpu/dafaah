const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

// Insert import
content = content.replace("import { ClientTimelineSection } from './ClientTimelineSection';", "import { ClientTimelineSection } from './ClientTimelineSection';\nimport { ClientActivitiesSection } from './ClientActivitiesSection';");

// Replace the JSX block
const startStr = `<div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="text-lg font-bold text-[var(--text)] mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-500" />
            سجل النشاطات والأحداث
          </h3>`;
const endStr = `          )}
        </div>`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex > startIndex) {
  content = content.substring(0, startIndex) + '<ClientActivitiesSection client={client} />' + content.substring(endIndex);
  fs.writeFileSync('src/components/ClientDetailPage.tsx', content);
  console.log("Success");
} else {
  console.log("Failed to find bounds", startIndex, endIndex);
}
