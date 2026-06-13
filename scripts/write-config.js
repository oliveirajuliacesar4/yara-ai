const fs = require("node:fs");
const path = require("node:path");

const configuredApiBaseUrl =
  process.env.YARA_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

const output = `window.YARA_CONFIG = {
  API_BASE_URL: ${
    configuredApiBaseUrl
      ? JSON.stringify(configuredApiBaseUrl.replace(/\/$/, ""))
      : 'window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "http://localhost:3000" : window.location.origin'
  }
};
`;

fs.writeFileSync(path.join(__dirname, "..", "public", "config.js"), output);
console.log(`config.js generated with API_BASE_URL=${configuredApiBaseUrl || "same-origin"}`);
