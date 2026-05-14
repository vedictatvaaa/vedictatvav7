// PM2 ecosystem config for vedictatva.
//
// Loads .env from this directory into process.env BEFORE PM2 spawns the app,
// so plain `pm2 restart vedictatva` (no --update-env, no manual `set -a` dance)
// always picks up the latest values.
//
// Usage on the VPS:
//   pm2 delete vedictatva 2>/dev/null || true
//   pm2 start ecosystem.config.cjs
//   pm2 save
//
// After that, `pm2 restart vedictatva` Just Works, and `pm2 startup` survives
// reboots.

const fs = require("fs");
const path = require("path");

function loadDotEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  const raw = fs.readFileSync(file, "utf8");
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const envFromFile = loadDotEnv(path.join(__dirname, ".env"));

module.exports = {
  apps: [
    {
      name: "vedictatva",
      script: "dist/index.cjs",
      cwd: __dirname,
      node_args: "--enable-source-maps",
      max_memory_restart: "1G",
      env: {
        ...envFromFile,
        NODE_ENV: "production",
      },
    },
  ],
};
