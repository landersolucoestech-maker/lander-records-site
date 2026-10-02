import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "assets/**", "next-env.d.ts"],
  },
  {
    files: ["app/(public)/page.tsx", "app/admin/(protected)/media-kit/components/*.tsx", "app/admin/(protected)/pages/\[id\]/PageContentWorkbench.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default config;
