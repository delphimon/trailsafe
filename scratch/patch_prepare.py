import re

with open('src/app/prepare.tsx', 'r') as f:
    content = f.read()

# Update toggle to use data.checklist.checks
content = content.replace('''
  const toggle = (key: string) =>
    void run(() =>
      update((d) => ({
        ...d,
        checks: d.checks.includes(key)
          ? d.checks.filter((k) => k !== key)
          : [...d.checks, key],
      })),
    );''', '''
  const toggle = (key: string) =>
    void run(() =>
      update((d) => ({
        ...d,
        checklist: {
          ...d.checklist,
          checks: d.checklist.checks.includes(key)
            ? d.checklist.checks.filter((k) => k !== key)
            : [...d.checklist.checks, key],
          updatedAt: Date.now(),
        },
      })),
    );''')

# Build the UI
replacement_chips = '''
      <View style={s.wrap}>
        <Chip
          label="Day hike"
          selected={data.tripDuration === "day"}
          onPress={() => void run(() => update((d) => ({ ...d, tripDuration: "day" })))}
        />
        <Chip
          label="Overnight"
          selected={data.tripDuration === "overnight"}
          onPress={() => void run(() => update((d) => ({ ...d, tripDuration: "overnight" })))}
        />
        <Chip
          label="Winter conditions"
          selected={data.winterConditions}
          onPress={() => void run(() => update((d) => ({ ...d, winterConditions: !d.winterConditions })))}
        />
      </View>
'''
content = re.sub(r'<View style=\{s\.wrap\}>.*?</View>', replacement_chips.strip(), content, flags=re.DOTALL, count=1)

content = content.replace('const addon = library.ADD_ONS[data.tripType];', '''
  const baseAddon = library.ADD_ONS[data.tripDuration];
  const winterAddon = data.winterConditions ? library.ADD_ONS["winter"] : null;
  const currentPlan = data.plans.find((p) => p.status === "current");
''')

# Modify data.checks.filter to data.checklist.checks.filter
content = content.replace('data.checks.filter(', 'data.checklist.checks.filter(')
content = content.replace('data.checks.includes(', 'data.checklist.checks.includes(')

# Update addon rendering
addon_replacement = '''      <Card>
        <Heading>{baseAddon.title}</Heading>
        {baseAddon.items.map((item, i) => (
          <Checkbox
            key={item}
            label={item}
            checked={data.checklist.checks.includes(`${data.tripDuration}-${i}`)}
            onPress={() => toggle(`${data.tripDuration}-${i}`)}
          />
        ))}
        {winterAddon && (
          <>
            <Heading style={{ marginTop: 16 }}>{winterAddon.title}</Heading>
            {winterAddon.items.map((item, i) => (
              <Checkbox
                key={item}
                label={item}
                checked={data.checklist.checks.includes(`winter-${i}`)}
                onPress={() => toggle(`winter-${i}`)}
              />
            ))}
          </>
        )}
        <Checkbox
          label="Food for the trip, plus extra for a delay"
          checked={data.checklist.checks.includes("food")}
          onPress={() => toggle("food")}
        />
      </Card>'''
content = re.sub(r'<Card>\s*<Heading>\{addon.title\}</Heading>.*?</Card>', addon_replacement.strip(), content, flags=re.DOTALL)

with open('src/app/prepare.tsx', 'w') as f:
    f.write(content)
