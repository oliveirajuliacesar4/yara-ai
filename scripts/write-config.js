const fs = require("node:fs");
const path = require("node:path");

const apiBaseUrl =
  process.env.ATLAS_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5500";
const normalizedApiBaseUrl = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

const output = `window.ATLAS_CONFIG = {
  API_BASE_URL: ${JSON.stringify(normalizedApiBaseUrl)}
};
`;

fs.writeFileSync(path.join(__dirname, "..", "config.js"), output);
console.log(`config.js generated with API_BASE_URL=${apiBaseUrl}`);
