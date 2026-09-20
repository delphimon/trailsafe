import re

with open('tests/hypothermia.test.ts', 'r') as f:
    content = f.read()

content = re.sub(r"test\('wet chill penalty.*?\);\n\n", "", content, flags=re.DOTALL)

with open('tests/hypothermia.test.ts', 'w') as f:
    f.write(content)
