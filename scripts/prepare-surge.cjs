const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
// Expo exports bundled fonts beneath assets/node_modules. Surge otherwise skips
// every node_modules directory; include only this exported asset subtree.
fs.writeFileSync(path.join(dist, ".surgeignore"), "!assets/node_modules/\n!assets/node_modules/**\n");
// Cloudflare parses CSP before the browser decodes HTML entities, and Rocket
// Loader must leave Expo's entry/hydration scripts in their original order.
function prepareHtml(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) prepareHtml(file);
    else if (entry.name.endsWith(".html")) {
      const html = fs.readFileSync(file, "utf8")
        .replace(/(<meta[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]*)(")/g,
          (_, start, content, end) => start + content.replaceAll("&#x27;", "'") + end)
        .replace(/<script(?![^>]*data-cfasync)(?=[\s>])/g, '<script data-cfasync="false"');
      fs.writeFileSync(file, html);
    }
  }
}
prepareHtml(dist);
// Surge's SPA fallback lets direct links to locally stored plans reach Expo Router.
fs.copyFileSync(path.join(dist, "index.html"), path.join(dist, "200.html"));
const version = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8")).expo.version;
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
fs.writeFileSync(path.join(dist, "deploy-info.json"), JSON.stringify({ version, commit }, null, 2) + "\n");
