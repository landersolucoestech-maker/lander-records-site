// Resolves the extensionless relative imports used by server modules (Next.js bundler
// convention) so Node's built-in type stripping can load them in behavioral tests.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
    for (const candidate of [`${specifier}.ts`, `${specifier}/index.ts`]) {
      const url = new URL(candidate, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
  }
  return nextResolve(specifier, context);
}
