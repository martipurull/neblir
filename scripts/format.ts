#!/usr/bin/env node
import { execSync } from "node:child_process";

const glob = "**/*.{ts,tsx,js,jsx,json,css,md}";
const out = execSync(`npx prettier --write --cache "${glob}"`, {
  encoding: "utf8",
});
const lines = out.trim().split("\n").filter(Boolean);

const changedPaths = lines
  .filter((line) => !line.includes("(unchanged)"))
  .map((line) => line.replace(/\s+\d+ms$/, "").trim())
  .filter(Boolean);

if (changedPaths.length === 0) {
  console.log("No files needed formatting.");
} else {
  console.log(`Formatted ${changedPaths.length} file(s)`);
  console.log("Files formatted:");
  changedPaths.forEach((p) => console.log(`  ${p}`));
  console.log("");
}
