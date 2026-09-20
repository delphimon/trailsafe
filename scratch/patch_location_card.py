import re

with open('src/components/trailsafe/location-card.tsx', 'r') as f:
    content = f.read()

# Make coordinate text use a warning color if stale
content = content.replace('color: "white",', 'color: age >= 120 ? "#FFDED1" : "white",')

with open('src/components/trailsafe/location-card.tsx', 'w') as f:
    f.write(content)
