const fs = require('fs');
let content = fs.readFileSync('src/components/ClientDetailPage.tsx', 'utf8');

const startStr = `<div className="space-y-6">
          {/* Task Tracker List */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-xs p-5">`;
const endStr = `              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};`; // The end of the component

const startIndex = content.indexOf(startStr);
console.log("Start index:", startIndex);
