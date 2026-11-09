const fs = require('fs');
let content = fs.readFileSync('src/components/AppExperience.tsx', 'utf8');

// I will import useEffect and useState if they are not there, but they probably are.
if (!content.includes("useEffect")) {
  content = content.replace("import React, { useState }", "import React, { useState, useEffect }");
}

// Add local search state inside AppHeader
const hookInsertionPoint = "export function AppHeader(props: AppHeaderProps) {";
content = content.replace(hookInsertionPoint, `
export function AppHeader(props: AppHeaderProps) {
  const [localSearch, setLocalSearch] = React.useState(props.searchQuery);

  React.useEffect(() => {
    setLocalSearch(props.searchQuery);
  }, [props.searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      props.onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, props.onSearchChange]);
`);

// Replace props.searchQuery with localSearch
content = content.replace(/value=\{props\.searchQuery \|\| ''\}/g, "value={localSearch || ''}");
content = content.replace(/onChange=\{\(event\) => props\.onSearchChange\(event\.target\.value\)\}/g, "onChange={(event) => setLocalSearch(event.target.value)}");

fs.writeFileSync('src/components/AppExperience.tsx', content);
