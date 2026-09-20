import re

with open('/Users/andrew/.gemini/antigravity/brain/4b22dc47-15fe-4fac-a03d-f3dea60ea444/task.md', 'r') as f:
    content = f.read()

# Mark all as done
content = re.sub(r'- `\[ \]`', r'- `[x]`', content)

with open('/Users/andrew/.gemini/antigravity/brain/4b22dc47-15fe-4fac-a03d-f3dea60ea444/task.md', 'w') as f:
    f.write(content)
