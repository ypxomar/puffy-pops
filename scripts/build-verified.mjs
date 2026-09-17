import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const vinextPackage = resolve(projectRoot, "node_modules", "vinext", "package.json");
let vinext;

await import("./sync-css.mjs");

try {
  await access(vinextPackage);
  const packageJson = JSON.parse(await readFile(vinextPackage, "utf8"));
  vinext = resolve(projectRoot, "node_modules", "vinext", packageJson.bin.vinext);
  await access(vinext);
} catch {
  console.error("vinext is unavailable. Run npm install before building.");
  process.exit(69);
}

console.log("Running vinext build...");

const build = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  env: {
    ...process.env,
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: resolve(projectRoot, ".wrangler", "logs"),
    MINIFLARE_REGISTRY_PATH: resolve(projectRoot, ".wrangler", "registry"),
  },
  stdio: "inherit",
  shell: false,
});

const timeoutMs = Number(process.env.SITES_BUILD_TIMEOUT_MS ?? 180_000);
const timeout = setTimeout(() => {
  console.error(`Build exceeded ${Math.round(timeoutMs / 1000)} seconds.`);
  build.kill("SIGTERM");
}, timeoutMs);

const exitCode = await new Promise((resolveExit, reject) => {
  build.once("error", reject);
  build.once("exit", (code, signal) => {
    if (signal) {
      reject(new Error(`Build stopped by ${signal}.`));
      return;
    }
    resolveExit(code ?? 1);
  });
}).finally(() => clearTimeout(timeout));

if (exitCode !== 0) {
  process.exit(exitCode);
}

await import("./validate-artifact.mjs");
