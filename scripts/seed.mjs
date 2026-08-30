import { spawn } from "node:child_process";

const command = process.platform === "win32" ? "node.exe" : "node";
const child = spawn(command, ["scripts/migrate.mjs"], { stdio: "inherit", env: process.env });
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
