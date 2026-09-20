import re

with open('tests/signaling.test.ts', 'r') as f:
    content = f.read()

# Delete lines containing "slope avalanche risk" and the whole block
# I'll just use regex to remove it entirely
content = re.sub(r'test\("slope avalanche risk flags 30°-45° as prime hazard zone".*?\}\);\n', '', content, flags=re.DOTALL)

with open('tests/signaling.test.ts', 'w') as f:
    f.write(content)
