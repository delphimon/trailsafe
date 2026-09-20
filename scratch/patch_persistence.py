import re

with open('src/lib/persistence.ts', 'r') as f:
    content = f.read()

# Replace types
content = content.replace('''  /** Array of completed checklist item IDs (e.g. Ten Essentials). */
  checks: string[];
  /** Selected trip type preset for checklist add-ons ("day", "overnight", or "winter"). */
  tripType: "day" | "overnight" | "winter";''', '''  /** Array of completed checklist item IDs (e.g. Ten Essentials). */
  checklist: {
    checks: string[];
    startedAt: number;
    updatedAt: number;
    planId?: string;
  };
  tripDuration: "day" | "overnight";
  winterConditions: boolean;''')

content = content.replace('version: 2;', 'version: 3;')
content = content.replace('version: 2,', 'version: 3,')

# Initial Data Update
content = content.replace('''  checks: [],
  tripType: "day",''', '''  checklist: { checks: [], startedAt: Date.now(), updatedAt: Date.now() },
  tripDuration: "day",
  winterConditions: false,''')

# Validation logic update
old_validation = '''  if (
    (v?.version !== 1 && v?.version !== 2) ||
    !Array.isArray(v.plans) ||
    !Array.isArray(v.checks) ||
    !v.profile ||
    !["day", "overnight", "winter"].includes(v.tripType) ||
    !["DD", "DDM", "UTM"].includes(v.format)
  )
    throw new Error("Unrecognized saved data. It has been preserved.");'''

new_validation = '''  if (
    ![1, 2, 3].includes(v?.version) ||
    !Array.isArray(v.plans) ||
    !v.profile ||
    !["DD", "DDM", "UTM"].includes(v.format)
  )
    throw new Error("Unrecognized saved data. It has been preserved.");'''
content = content.replace(old_validation, new_validation)

# Check array check in v1/v2 vs v3
migration_logic = '''  if (v.version === 1) {
    v.profile.travelerName = typeof v.profile.name === "string" ? v.profile.name : "";
    v.profile.travelerPhone = typeof v.profile.phone === "string" ? v.profile.phone : "";
    v.profile.defaultTrustedContactName = "";
    v.profile.defaultTrustedContactPhone = "";
    delete v.profile.name;
    delete v.profile.phone;
  }

  if (v.version === 1 || v.version === 2) {
    v.checklist = {
      checks: Array.isArray(v.checks) ? v.checks : [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
    v.tripDuration = v.tripType === "overnight" ? "overnight" : "day";
    v.winterConditions = v.tripType === "winter";
    delete v.checks;
    delete v.tripType;
  }
  
  if (!v.checklist || !Array.isArray(v.checklist.checks) || typeof v.checklist.startedAt !== "number" || typeof v.checklist.updatedAt !== "number" || !["day", "overnight"].includes(v.tripDuration)) {
    throw new Error("Saved data is damaged. It has been preserved.");
  }'''

content = content.replace('''  if (v.version === 1) {
    v.profile.travelerName = typeof v.profile.name === "string" ? v.profile.name : "";
    v.profile.travelerPhone = typeof v.profile.phone === "string" ? v.profile.phone : "";
    v.profile.defaultTrustedContactName = "";
    v.profile.defaultTrustedContactPhone = "";
    delete v.profile.name;
    delete v.profile.phone;
  }''', migration_logic)

content = content.replace('!v.checks.every((x: unknown) => typeof x === "string")', '!v.checklist.checks.every((x: unknown) => typeof x === "string")')
content = content.replace('v.version = 2;', 'v.version = 3;')

with open('src/lib/persistence.ts', 'w') as f:
    f.write(content)
