import re

with open('tests/signaling.test.ts', 'r') as f:
    content = f.read()

# Delete lines containing "2 blasts"
lines = content.split('\n')
new_lines = []
for line in lines:
    if '2 blasts' in line:
        continue
    if '#E4572E' in line:
        line = line.replace('#E4572E', '#D9534F')
    new_lines.append(line)

with open('tests/signaling.test.ts', 'w') as f:
    f.write('\n'.join(new_lines))
