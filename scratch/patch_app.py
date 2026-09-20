import re

with open('src/state/app.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { useAutomaticLocation } from "@/hooks/use-location";', 'import { useLocation } from "@/hooks/use-location";')
content = content.replace('location: ReturnType<typeof useAutomaticLocation>;', "location: ReturnType<typeof useLocation>;")
content = content.replace('const location = useAutomaticLocation(path === "/emergency");', 'const location = useLocation();\n  useEffect(() => {\n    if (path === "/emergency") return location.requestLocation();\n  }, [path, location]);')

with open('src/state/app.tsx', 'w') as f:
    f.write(content)
