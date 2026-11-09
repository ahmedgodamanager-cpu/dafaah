const fs = require('fs');
const content = fs.readFileSync('/tmp/AppExperience.js', 'utf8');
const lines = content.split('\n');
const lastLine = lines[lines.length - 2];
if (lastLine.startsWith('//# sourceMappingURL=data:application/json;base64,')) {
  const base64 = lastLine.replace('//# sourceMappingURL=data:application/json;base64,', '');
  const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
  const sourcemap = JSON.parse(jsonStr);
  const originalSource = sourcemap.sourcesContent[0];
  fs.writeFileSync('src/components/AppExperience.tsx', originalSource);
  console.log('Successfully recovered AppExperience.tsx! Size: ', originalSource.length);
} else {
  console.log('Could not find sourcemap comment. Found:', lastLine.substring(0, 50));
}
