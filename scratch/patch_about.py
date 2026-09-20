import re

with open('src/app/about.tsx', 'r') as f:
    content = f.read()

content = content.replace('version: 2026.09.06.', 'version: {getGuideContentVersion()}.')

with open('src/app/about.tsx', 'w') as f:
    f.write(content)
