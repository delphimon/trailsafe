import re

with open('src/hooks/use-location.tsx', 'r') as f:
    content = f.read()

content = content.replace('import React, { createContext, useContext, useCallback, useMemo } from "react";', '')

with open('src/hooks/use-location.tsx', 'w') as f:
    f.write(content)

with open('src/app/_layout.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { AppProvider } from "@/state/app";', 'import { AppProvider } from "@/state/app";\nimport { LocationProvider } from "@/hooks/use-location";')
content = content.replace('<AppProvider>', '<LocationProvider>\n        <AppProvider>')
content = content.replace('</AppProvider>', '</AppProvider>\n        </LocationProvider>')

with open('src/app/_layout.tsx', 'w') as f:
    f.write(content)
