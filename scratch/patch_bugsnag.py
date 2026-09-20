import re

with open('src/app/_layout.tsx', 'r') as f:
    content = f.read()

new_bugsnag = """
if (typeof window !== 'undefined' && Platform.OS !== 'web') {
  const Bugsnag = require('@bugsnag/expo').default || require('@bugsnag/expo');
  Bugsnag.start({
    onError: function (event) {
      // Redact sensitive data from Bugsnag reports
      event.context = "redacted";
      event.user = {};
      event.addMetadata('device', 'id', 'redacted');
    }
  });
}
"""

content = re.sub(r"if \(typeof window !== 'undefined' && Platform\.OS !== 'web'\) \{.*?Bugsnag\.start\(\);\n\}", new_bugsnag.strip(), content, flags=re.DOTALL)

with open('src/app/_layout.tsx', 'w') as f:
    f.write(content)
