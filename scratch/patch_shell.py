import re

with open('src/components/trailsafe/shell.tsx', 'r') as f:
    content = f.read()

content = content.replace('path.startsWith("/article") || path === "/resources" || path === "/about"', 'path.startsWith("/article")')

with open('src/components/trailsafe/shell.tsx', 'w') as f:
    f.write(content)
