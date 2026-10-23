#!/usr/bin/env node
// Fails if a raw color value appears outside src/styles/tokens.css.
// Colors must come from design tokens (e.g. `bg-primary`, `var(--color-border)`).

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = join(import.meta.dirname, "..");
const srcDir = join(root, "src");
const allowed = new Set(["src/styles/tokens.css"]);
const extensions = /\.(css|ts|tsx|js|jsx|mdx)$/;

const rules = [
  { name: "hex color", pattern: /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b(?![-\w])/gi },
  { name: "color function", pattern: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/gi },
  { name: "named color in CSS", pattern: /:\s*(?:white|black)\b/gi, only: /\.css$/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (extensions.test(entry.name)) yield path;
  }
}

const problems = [];
for (const file of walk(srcDir)) {
  const rel = relative(root, file);
  if (allowed.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const rule of rules) {
      if (rule.only && !rule.only.test(rel)) continue;
      for (const match of line.matchAll(rule.pattern)) {
        problems.push(`${rel}:${i + 1}:${match.index + 1}  ${rule.name} "${match[0]}"`);
      }
    }
  });
}

if (problems.length) {
  console.error(`Hardcoded colors found — use design tokens from src/styles/tokens.css:\n`);
  console.error(problems.map((p) => `  ${p}`).join("\n"));
  process.exit(1);
}
console.log("Design tokens: no hardcoded colors found.");
