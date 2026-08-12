import { spawnSync } from "node:child_process";
import { homedir, platform } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWindows = platform() === "win32";
const prefix = isWindows
  ? path.join(process.env["APPDATA"] ?? homedir(), "npm")
  : path.join(homedir(), ".npm-global");

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const result = spawnSync("npm", ["link"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    npm_config_prefix: prefix,
  },
  stdio: "inherit",
  shell: isWindows,
});

process.exit(result.status ?? 1);
