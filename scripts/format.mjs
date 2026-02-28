#!/usr/bin/env node
import { execSync } from "child_process";

const glob = "**/*.{ts,tsx,js,jsx,json,css,md}";
const out = execSync(`npx prettier --write "${glob}"`, { encoding: "utf8" });
const lines = out.trim().split("\n").filter(Boolean);
const paths = lines.map((line) =>
  line.replace(/\s+\d+ms(\s+\(unchanged\))?$/, "").trim()
);

console.log(`Formatted ${paths.length} file(s)`);
console.log("Files formatted:");
paths.forEach((path) => console.log(`  ${path}`));
console.log("");
