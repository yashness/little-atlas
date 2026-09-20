#!/usr/bin/env node
const { buildSync } = require("esbuild");
const path = require("node:path");
const fs = require("node:fs");
// Runtime imports may only point inward. Type-only boundaries remain explicit
// in contracts and are checked during review; they disappear from the bundle.
const ranks = {
  contracts: 0,
  utils: 1,
  library: 2,
  shared: 3,
  platform: 4,
  features: 5,
};
const rank = (file) => (file === "src/main.ts" ? 6 : ranks[file.split("/")[1]]);
function checkRings(inputs) {
  for (const [file, info] of Object.entries(inputs)) {
    if (file.startsWith("data/sources/"))
      throw new Error("Raw source caches must not enter the browser bundle.");
    if (!file.startsWith("src/") || !file.endsWith(".ts")) continue;
    if (rank(file) === undefined)
      throw new Error(`Unregistered source ring: ${file}`);
    for (const dependency of info.imports) {
      if (
        dependency.path.startsWith("src/") &&
        rank(dependency.path) > rank(file)
      ) {
        throw new Error(
          `Ring boundary violation: ${file} imports ${dependency.path}`,
        );
      }
    }
  }
  const visiting = new Set(),
    visited = new Set();
  function visit(file) {
    if (visiting.has(file))
      throw new Error(`Cyclic runtime dependency: ${file}`);
    if (visited.has(file)) return;
    visiting.add(file);
    for (const dependency of inputs[file]?.imports ?? [])
      if (inputs[dependency.path]) visit(dependency.path);
    visiting.delete(file);
    visited.add(file);
  }
  Object.keys(inputs).forEach(visit);
}
const root = path.resolve(__dirname, "../..");
for (const [entry, outfile] of [
  ["src/main.ts", "app.js"],
  ["src/shared/ui/index.css", "styles.css"],
]) {
  const result = buildSync({
    absWorkingDir: root,
    entryPoints: [entry],
    outfile,
    bundle: true,
    write: false,
    metafile: true,
    target: "es2022",
    format: "iife",
    legalComments: "none",
    logLevel: "info",
    banner: outfile.endsWith(".js")
      ? {
          js: "/* Generated from src/. Run npm run compile; do not hand-edit this file. */",
        }
      : undefined,
  });
  checkRings(result.metafile.inputs);
  for (const file of result.outputFiles)
    fs.writeFileSync(file.path, file.contents);
}
