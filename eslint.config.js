const { defineConfig } = require("eslint/config");
const expo = require("eslint-config-expo/flat");
module.exports = defineConfig([
  expo,
  {
    ignores: [
      "dist/**",
      "docs/reference/**",
      "scripts/**",
      "ios/**",
      "android/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
]);
