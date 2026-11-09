const fs = require('fs');
const content = fs.readFileSync('/tmp/AppExperience.js', 'utf8');
const match = content.match(/\/\/# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
if (match) {
  const base64 = match[1];
  const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
  const sourcemap = JSON.parse(jsonStr);
  const originalSource = sourcemap.sourcesContent[0];
  fs.writeFileSync('src/components/AppExperience.tsx', originalSource);
  console.log('Successfully recovered AppExperience.tsx! Size: ', originalSource.length);
} else {
  console.log('Could not find sourcemap comment.');
}
