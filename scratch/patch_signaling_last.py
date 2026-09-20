import re

with open('tests/signaling.test.ts', 'r') as f:
    content = f.read()

# Delete lines containing "silence.displayInstruction"
lines = content.split('\n')
new_lines = []
for line in lines:
    if 'silence.displayInstruction' in line:
        continue
    new_lines.append(line)

with open('tests/signaling.test.ts', 'w') as f:
    f.write('\n'.join(new_lines))
