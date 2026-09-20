import re

with open('src/app/plans/[id].tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useStore } from "@/state/store";', 'import { useStore } from "@/state/store";\nimport { scheduleTripReminders, cancelTripReminders } from "@/lib/notifications";')

new_save = """  const save = async (status = plan.status) => {
    let saved = plan;
    await update((d) => {
      const previous = d.plans.find((p) => p.id === plan.id);
      saved = {
        ...plan,
        status,
        updatedAt: Date.now(),
        revision: previous ? previous.revision + 1 : 1,
      };
      const newPlans = d.plans.map((p) => {
        if (p.id === saved.id) return saved;
        // Enforce exactly one Current trip plan
        if (status === "current" && p.status === "current") {
          return { ...p, status: "draft" as const };
        }
        return p;
      });
      if (!newPlans.some((p) => p.id === saved.id)) {
        newPlans.push(saved);
      }
      return {
        ...d,
        plans: newPlans,
      };
    });
    setPlan(saved);
    if (status === "current") {
      void scheduleTripReminders(saved);
    } else {
      void cancelTripReminders();
    }
    return saved;
  };"""

content = re.sub(r'  const save = async \(status = plan\.status\) => \{.*?\n    return saved;\n  \};', new_save.strip(), content, flags=re.DOTALL)

with open('src/app/plans/[id].tsx', 'w') as f:
    f.write(content)
