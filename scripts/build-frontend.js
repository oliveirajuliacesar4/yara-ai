const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");
const apiBaseUrl =
  process.env.ATLAS_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.URL ||
  process.env.DEPLOY_URL ||
  "http://localhost:5500";

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "admin.html", "style.css", "app.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.writeFileSync(
  path.join(dist, "config.js"),
  `window.ATLAS_CONFIG = {
  API_BASE_URL: ${JSON.stringify(apiBaseUrl.replace(/\/$/, ""))}
};
`
);

console.log(`Frontend built in dist/ with API_BASE_URL=${apiBaseUrl}`);
