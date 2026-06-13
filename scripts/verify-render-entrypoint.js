const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const expectedEntrypoint = "server.js";
const packageJsonPath = path.join(root, "package.json");
const renderYamlPath = path.join(root, "render.yaml");
const expectedEntrypointPath = path.join(root, expectedEntrypoint);
const officialFrontendPath = path.join(root, "public", "index.html");

function fail(message) {
  console.error(`[render-entrypoint] ${message}`);
  process.exit(1);
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

if (!fs.existsSync(expectedEntrypointPath)) {
  fail(`Expected Render entrypoint ${expectedEntrypoint} was not found.`);
}

if (!fs.existsSync(officialFrontendPath)) {
  fail("Official frontend public/index.html was not found.");
}

const frontendHtml = readText(officialFrontendPath);
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
if (!frontendHtml.includes("YARA AI")) {
  fail("public/index.html must be the official YARA frontend and must not contain legacy frontend markers.");
}

for (const filePath of listStaticFiles(path.join(root, "public"))) {
  const contents = readText(filePath).toLowerCase();
  const foundMarker = legacyMarkers.find((marker) => contents.includes(marker.toLowerCase()));
  if (foundMarker) {
    fail(`Legacy frontend marker detected in ${path.relative(root, filePath)}.`);
  }
}

const forbiddenStaticEntrypoints = ["index.html", "dist/index.html"]
  .filter((file) => fs.existsSync(path.join(root, file)));

if (forbiddenStaticEntrypoints.length) {
  fail(`Forbidden static frontend entrypoints found outside public/: ${forbiddenStaticEntrypoints.join(", ")}.`);
}

const packageJson = JSON.parse(readText(packageJsonPath));
if (packageJson.scripts?.start !== "node server.js") {
  fail("package.json start must execute node server.js.");
}

const renderYaml = readText(renderYamlPath);
if (!renderYaml.includes("startCommand: pnpm start")) {
  fail("render.yaml must use startCommand: pnpm start.");
}

if (!renderYaml.includes("pnpm install --shamefully-hoist")) {
  fail("render.yaml must install dependencies with pnpm install --shamefully-hoist.");
}

const unexpectedEntrypoints = ["index.ts", "src/index.ts", "dist/index.mjs", "dist/index.js"]
  .filter((file) => fs.existsSync(path.join(root, file)));

if (unexpectedEntrypoints.length) {
  fail(`Unexpected Render-like entrypoint files found: ${unexpectedEntrypoints.join(", ")}.`);
}

console.log("[render-entrypoint] Expected entrypoint confirmed: server.js");
console.log("[render-entrypoint] Official frontend confirmed: public/index.html");
console.log(`[render-entrypoint] Render commit: ${process.env.RENDER_GIT_COMMIT || "not provided by environment"}`);
console.log(`[render-entrypoint] Render branch: ${process.env.RENDER_GIT_BRANCH || "not provided by environment"}`);
console.log(`[render-entrypoint] DATABASE_URL configured: ${Boolean(process.env.DATABASE_URL)}`);
console.log(`[render-entrypoint] SESSION_SECRET configured: ${Boolean(process.env.SESSION_SECRET)}`);
console.log("[render-entrypoint] DATABASE_URL and SESSION_SECRET are lazy/optional at startup.");

function listStaticFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
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
