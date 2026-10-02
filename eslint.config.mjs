import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "assets/**", "next-env.d.ts"],
  },
  {
    files: ["app/admin/**/*.{ts,tsx}"],
    rules: { "react-hooks/set-state-in-effect": "warn", "react-hooks/immutability": "warn" },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
