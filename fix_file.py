import re

with open('src/components/AppExperience.tsx', 'r') as f:
    content = f.read()

content = content.replace('{mobileOpen && <>', '{mobileOpen && <div className="contents" key="mobile-menu">')

with open('src/components/AppExperience.tsx', 'w') as f:
    f.write(content)

