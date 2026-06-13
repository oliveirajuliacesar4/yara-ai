const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const legacyDist = path.join(root, "dist");
const configuredApiBaseUrl =
  process.env.YARA_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.URL ||
  process.env.DEPLOY_URL ||
  "";

fs.rmSync(legacyDist, { recursive: true, force: true });

const forbiddenStaticEntrypoints = ["index.html", path.join("dist", "index.html")];
for (const file of forbiddenStaticEntrypoints) {
  if (fs.existsSync(path.join(root, file))) {
    throw new Error(`Forbidden static frontend entrypoint outside public/: ${file}`);
  }
}

for (const file of ["index.html", "admin.html", "style.css", "app.js"]) {
  const filePath = path.join(publicDir, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing official frontend file: public/${file}`);
  }
}

const legacyMarkers = [
  [97, 116, 108, 97, 115],
  [65, 116, 108, 97, 115, 32, 79, 110, 101],
  [65, 116, 108, 97, 115, 32, 65, 73],
  [97, 116, 108, 97, 115, 46, 111, 110, 101],
  [97, 116, 108, 97, 115, 111, 110, 101],
  [97, 112, 105, 47, 97, 116, 108, 97, 115],
  [65, 84, 76, 65, 83, 95, 67, 79, 78, 70, 73, 71],
  [65, 84, 76, 65, 83, 95, 65, 80, 73, 95, 66, 65, 83, 69, 95, 85, 82, 76],
].map((codes) => String.fromCharCode(...codes));

const publicFiles = listStaticFiles(publicDir);
const indexHtml = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
if (!indexHtml.includes("YARA AI")) {
  throw new Error("public/index.html is not the official YARA frontend.");
}

for (const filePath of publicFiles) {
  const contents = fs.readFileSync(filePath, "utf8").toLowerCase();
  const foundMarker = legacyMarkers.find((marker) => contents.includes(marker.toLowerCase()));
  if (foundMarker) {
    throw new Error(`Legacy frontend marker detected in ${path.relative(root, filePath)}.`);
  }
}

fs.writeFileSync(
  path.join(publicDir, "config.js"),
  `window.YARA_CONFIG = {
  API_BASE_URL: ${
    configuredApiBaseUrl
      ? JSON.stringify(configuredApiBaseUrl.replace(/\/$/, ""))
      : 'window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : window.location.origin'
  }
};
`
);

console.log(`YARA frontend verified in public/ with API_BASE_URL=${configuredApiBaseUrl || "same-origin"}`);

function listStaticFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listStaticFiles(entryPath));
      continue;
    }
    if (/\.(html|css|js)$/i.test(entry.name)) files.push(entryPath);
  }
  return files;
}
