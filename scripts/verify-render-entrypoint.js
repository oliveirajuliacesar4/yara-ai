const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const expectedEntrypoint = "server.js";
const packageJsonPath = path.join(root, "package.json");
const renderYamlPath = path.join(root, "render.yaml");
const expectedEntrypointPath = path.join(root, expectedEntrypoint);

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
console.log(`[render-entrypoint] Render commit: ${process.env.RENDER_GIT_COMMIT || "not provided by environment"}`);
console.log(`[render-entrypoint] Render branch: ${process.env.RENDER_GIT_BRANCH || "not provided by environment"}`);
console.log(`[render-entrypoint] DATABASE_URL configured: ${Boolean(process.env.DATABASE_URL)}`);
console.log(`[render-entrypoint] SESSION_SECRET configured: ${Boolean(process.env.SESSION_SECRET)}`);
console.log("[render-entrypoint] DATABASE_URL and SESSION_SECRET are lazy/optional at startup.");
