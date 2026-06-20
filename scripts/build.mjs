#!/usr/bin/env node
/** Validación de build: comprueba sintaxis de handlers y scripts del chat. */
import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const root = join(fileURLToPath(import.meta.url), "..", "..");

async function collectJs(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    if (e.name === "node_modules") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await collectJs(p, acc);
    else if (e.name.endsWith(".js") || e.name.endsWith(".mjs")) acc.push(p);
  }
  return acc;
}

const targets = [join(root, "api"), join(root, "lib"), join(root, "js")];
const files = [];
for (const t of targets) {
  files.push(...(await collectJs(t, [])));
}

let failed = 0;
for (const file of [...new Set(files)]) {
  const code = await readFile(file, "utf8");
  const rel = relative(root, file);
  const isModule = /^\s*(import |export )/m.test(code);

  try {
    if (isModule) {
      execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
    } else {
      // eslint-disable-next-line no-new-func
      new Function(code);
    }
  } catch (err) {
    console.error(`Syntax error in ${rel}: ${err.message}`);
    failed += 1;
  }
}

if (failed) {
  console.error(`Build failed: ${failed} file(s) with syntax errors.`);
  process.exit(1);
}

console.log(`Build OK — ${files.length} JavaScript files validated.`);
