import re

with open('/Users/andrew/.gemini/antigravity/brain/4b22dc47-15fe-4fac-a03d-f3dea60ea444/task.md', 'r') as f:
    content = f.read()

content = content.replace('[ ] Water treatment wording changes.', '[x] Water treatment wording changes.')
content = content.replace('[ ] Audible signaling wording.', '[x] Audible signaling wording.')
content = content.replace('[ ] Strobe beacon rate / UI rewrite.', '[x] Strobe beacon rate / UI rewrite.')
content = content.replace('[ ] Signal mirror text.', '[x] Signal mirror text.')
content = content.replace('[ ] Solar & hiking time estimator caveats.', '[x] Solar & hiking time estimator caveats.')
content = content.replace('[ ] Change OTA fallbackToCacheTimeout to 0', '[x] Change OTA fallbackToCacheTimeout to 0')
content = content.replace('[ ] Bugsnag privacy updates (redact sensitive data)', '[x] Bugsnag privacy updates (redact sensitive data)')
content = content.replace('[ ] Centralize safety-content version reporting', '[x] Centralize safety-content version reporting')
content = content.replace('[ ] Fix About tab state issue', '[x] Fix About tab state issue')

with open('/Users/andrew/.gemini/antigravity/brain/4b22dc47-15fe-4fac-a03d-f3dea60ea444/task.md', 'w') as f:
    f.write(content)
