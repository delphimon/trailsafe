import re

with open('src/app/tools.tsx', 'r') as f:
    content = f.read()

# Fix mirror text
content = content.replace('DAYLIGHT SIGNAL MIRROR', 'SIGNAL MIRROR AIMING GUIDE')
content = content.replace('Hold phone screen up to face', 'Hold phone screen up to face (Note: A phone screen is not a substitute for a real glass signal mirror)')

# Fix Solar text
content = content.replace('HEADLAMP REQUIRED', 'Plan to need a headlamp by')

# Fix Naismith Estimator caveats
content = content.replace('ESTIMATED TIME: ', 'PLANNING ESTIMATE: ')

# Fix Magnetic Declination
content = content.replace('Exact compass bezel adjustment', 'Approximate compass bezel adjustment')

with open('src/app/tools.tsx', 'w') as f:
    f.write(content)
