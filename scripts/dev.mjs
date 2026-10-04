import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const python = process.env.HANDBOOK_PYTHON || path.resolve(".venv/bin/python");
if (!existsSync(python)) {
  console.error(
    "Create .venv and install Python dependencies first. See README.md.",
  );
  process.exit(1);
}
const apiPort = process.env.HANDBOOK_API_PORT || "8000";
const api = spawn(
  python,
  [
    "-m",
    "uvicorn",
    "ml_handbook.api:app",
    "--host",
    "127.0.0.1",
    "--port",
    apiPort,
    "--limit-concurrency",
    "16",
  ],
  { stdio: "inherit" },
);
const web = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    env: { ...process.env, HANDBOOK_API_URL: `http://127.0.0.1:${apiPort}` },
  },
);
let closing = false;
function stop(code = 0) {
  if (closing) return;
  closing = true;
  api.kill("SIGTERM");
  web.kill("SIGTERM");
  setTimeout(() => process.exit(code), 300);
}
for (const child of [api, web]) {
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!closing) stop(code ?? 1);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
