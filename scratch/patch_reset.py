import re

with open('src/app/prepare.tsx', 'r') as f:
    content = f.read()

# Update the manual reset button to clear checklist.checks and reset planId/startedAt
content = content.replace('onConfirm: () => update((d) => ({ ...d, checks: [] })),', 'onConfirm: () => update((d) => ({ ...d, checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now(), planId: currentPlan?.id } })),')

stale_logic = '''
  const isStale = data.checklist.checks.length > 0 && (
    (currentPlan && data.checklist.planId !== currentPlan.id) ||
    (!currentPlan && Date.now() - data.checklist.updatedAt > 7 * 24 * 60 * 60 * 1000)
  );
  
  return (
    <Screen
      title="Before You Go"
      subtitle="Essentials, phone readiness, and trip prep"
    >
      {isStale && (
        <View style={{ marginBottom: 12 }}>
          <Callout title="Checklist may be from a previous trip" variant="warning">
            This checklist was started a while ago or belongs to an older trip plan.
            <View style={{ marginTop: 10 }}>
              <Button
                label="Start Fresh"
                small
                onPress={() =>
                  void run(() =>
                    update((d) => ({
                      ...d,
                      checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now(), planId: currentPlan?.id },
                    }))
                  )
                }
              />
            </View>
          </Callout>
        </View>
      )}
'''

content = content.replace('''  return (
    <Screen
      title="Before You Go"
      subtitle="Essentials, phone readiness, and trip prep"
    >''', stale_logic)

with open('src/app/prepare.tsx', 'w') as f:
    f.write(content)
