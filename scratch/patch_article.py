import re

with open('src/app/article/[id].tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useApp } from "@/state/app";', 'import { useApp } from "@/state/app";\nimport { useLocation } from "@/hooks/use-location";\nimport { useEffect } from "react";')

new_logic = """export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = articles[id];
  const { run } = useApp();
  const { requestLocation } = useLocation();
  const isIncident = typeof id === "string" && id.startsWith("g-");

  useEffect(() => {
    if (isIncident) {
      return requestLocation();
    }
  }, [isIncident, requestLocation]);
"""
content = re.sub(r'export default function ArticleScreen\(\) {.*?const { run } = useApp\(\);', new_logic, content, flags=re.DOTALL)

render_logic = """
  return (
    <Screen title={article.title} subtitle={article.subtitle || undefined} back>
      {isIncident && (
        <View style={{ marginBottom: 18 }}>
          <EmergencyActions compact situation={article.title} />
        </View>
      )}
"""
content = re.sub(r'  return \(\n    <Screen title=\{article\.title\} subtitle=\{article\.subtitle \|\| undefined\} back>\n      <View style=\{\{ marginBottom: 18 \}\}>\n        <EmergencyActions compact situation=\{article\.title\} />\n      </View>', render_logic, content)

with open('src/app/article/[id].tsx', 'w') as f:
    f.write(content)
