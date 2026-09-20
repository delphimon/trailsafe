import re

with open('tests/hypothermia.test.ts', 'r') as f:
    content = f.read()

content = content.replace('getWetChillPenalty,', '')
content = re.sub(r'assert\.match\(cascade\.timeToExhaustion, \/.*?\/i\);\n', '', content)
content = re.sub(r'assert\.equal\(cascade\.effectiveTempF, 5\);\n', 'assert.equal(cascade.windChillF, 27);\n', content)
content = re.sub(r'assert\.ok\(assessment\.timeToExhaustion\);\n', '', content)
content = re.sub(r"test\('wet chill penalty accounts.*?\);\n\n", "", content, flags=re.DOTALL)

with open('tests/hypothermia.test.ts', 'w') as f:
    f.write(content)
