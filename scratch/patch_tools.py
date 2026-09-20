import re

with open('src/app/tools.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useAutomaticLocation } from "@/hooks/use-location";', 'import { useLocation } from "@/hooks/use-location";')
replacement = """  const { fix, requestLocation } = useLocation();
  useEffect(() => {
    if (activeTab === "solar" || activeTab === "hazards" || activeTab === "backcountry") {
      return requestLocation();
    }
  }, [activeTab, requestLocation]);"""
content = content.replace('  const { fix } = useAutomaticLocation(\n    activeTab === "solar" || activeTab === "hazards" || activeTab === "backcountry",\n  );', replacement)

with open('src/app/tools.tsx', 'w') as f:
    f.write(content)
