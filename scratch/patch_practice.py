import re

with open('src/state/app.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { Linking, Platform, Share } from "react-native";', 'import { AppState, Linking, Platform, Share } from "react-native";')

new_logic = """
  useEffect(() => {
    let backgroundTime = 0;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        if (backgroundTime === 0) backgroundTime = Date.now();
      } else if (state === "active") {
        if (backgroundTime > 0 && Date.now() - backgroundTime > 5 * 60 * 1000) {
          setPractice(false);
        }
        backgroundTime = 0;
      }
    });
    return () => sub.remove();
  }, []);
"""

content = content.replace('  const location = useLocation();', f'  const location = useLocation();\n{new_logic}')

with open('src/state/app.tsx', 'w') as f:
    f.write(content)
