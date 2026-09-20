import re

with open('tests/signaling.test.ts', 'r') as f:
    content = f.read()

content = content.replace('prime38.', 'prime.')

with open('tests/signaling.test.ts', 'w') as f:
    f.write(content)
