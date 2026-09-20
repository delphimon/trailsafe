import re

with open('src/app/plan/current/[action].tsx', 'r') as f:
    content = f.read()

# I will replace the useEffect content to show a dialog instead.
new_effect = """
  useEffect(() => {
    if (!ready || processedRef.current) return;
    processedRef.current = true;

    if (action === "complete") {
      const currentPlan = data.plans.find((p) => p.status === "current");
      if (currentPlan) {
        setDialog({
          title: "Complete Trip Plan",
          message: `Are you sure you want to mark "${currentPlan.title || 'your trip'}" as complete?`,
          confirmLabel: "Mark Complete",
          onConfirm: () => {
            void update((s) => ({
              ...s,
              plans: s.plans.map((p) =>
                p.id === currentPlan.id
                  ? {
                      ...p,
                      status: "completed",
                      updatedAt: Date.now(),
                      revision: p.revision + 1,
                    }
                  : p,
              ),
            }));
            setDialog(null);
            notify(`Trip "${currentPlan.title || 'plan'}" marked complete! Remember to confirm safe return with your emergency contacts.`);
            router.replace({
              pathname: "/plans/[id]",
              params: { id: currentPlan.id },
            });
          }
        });
      } else {
        notify("No active trip plan was found to mark complete.");
        router.replace("/plans");
      }
    } else if (action === "start") {
      const latestDraft = data.plans
        .filter((p) => p.status === "draft")
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      if (latestDraft) {
        setDialog({
          title: "Start Trip",
          message: `Are you sure you want to start "${latestDraft.title || 'this trip'}"?`,
          confirmLabel: "Start Trip",
          onConfirm: () => {
            void update((s) => ({
              ...s,
              plans: s.plans.map((p) => {
                if (p.id === latestDraft.id) {
                  return { ...p, status: "current", updatedAt: Date.now(), revision: p.revision + 1 };
                }
                if (p.status === "current") {
                  return { ...p, status: "draft" };
                }
                return p;
              }),
            }));
            setDialog(null);
            notify(`Trip "${latestDraft.title || 'plan'}" is now active! Stay safe out there.`);
            router.replace({
              pathname: "/plans/[id]",
              params: { id: latestDraft.id },
            });
          }
        });
      } else {
        notify("No draft trip plan found to start.");
        router.replace("/plans");
      }
    } else {
      router.replace("/plans");
    }
  }, [action, ready, data.plans, update, notify, setDialog]);
"""

content = re.sub(r'  useEffect\(\(\) => \{.*?void handleAction\(\);\n  \}, \[action, ready, data\.plans, update, notify\]\);', new_effect.strip(), content, flags=re.DOTALL)
content = content.replace('const { notify } = useApp();', 'const { notify, setDialog } = useApp();')

with open('src/app/plan/current/[action].tsx', 'w') as f:
    f.write(content)
