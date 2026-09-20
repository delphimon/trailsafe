import re

with open('src/app/tools.tsx', 'r') as f:
    content = f.read()

# Replace the Core Chill section
new_core_chill = """
              <View style={{ gap: 2 }}>
                <T
                  style={{
                    fontFamily: fonts.bold,
                    fontVariant: ["tabular-nums"],
                    fontSize: 38,
                    lineHeight: 44,
                    color: C.heading,
                  }}
                >
                  {hypoAssessment.windChillF}°F
                </T>
                <T style={{ fontSize: 13, color: C.ink, fontFamily: fonts.bold }}>
                  NWS Wind Chill Index
                </T>
              </View>

              <T style={{ fontSize: 12, color: C.muted }}>
                Air: {hypoAssessment.airTempF}°F · Moisture: {hypoAssessment.moisture}
              </T>
"""

content = re.sub(r'<View style=\{\{ gap: 2 \}\}>.*?Air: \{hypoAssessment\.airTempF\}°F.*?<\/T>', new_core_chill.strip(), content, flags=re.DOTALL)

# Remove timeToExhaustion line
content = re.sub(r'<T style=\{\{ fontSize: 14, color: C\.ink \}\}>\s*<T style=\{\{ fontFamily: fonts\.bold \}\}>Est\. Time to Exhaustion:<\/T>\s*\{hypoAssessment\.timeToExhaustion\}\s*<\/T>', '', content)

with open('src/app/tools.tsx', 'w') as f:
    f.write(content)
