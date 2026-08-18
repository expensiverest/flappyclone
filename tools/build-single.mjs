#!/usr/bin/env node
/**
 * Builds `flappy-clone.html`: a single self-contained file with the CSS and the
 * three ES modules inlined (imports/exports stripped, since everything ends up
 * in one classic script scope).
 *
 * Usage: node tools/build-single.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const stripModuleSyntax = (src) =>
  src
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*$/gm, "")
    .replace(/^export\s+/gm, "")
    .trim();

const css = read("css/style.css").trim();
const js = ["js/sprites.js", "js/game.js", "js/main.js"]
  .map((f) => stripModuleSyntax(read(f)))
  .join("\n\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#70c5ce" />
<title>Flappy Clone</title>
<style>
${css}
</style>
</head>
<body>
<main class="app">
<canvas id="game" width="288" height="512" aria-label="Flappy Clone game"></canvas>
<p class="hint">Click / tap / space to flap</p>
</main>
<script>
${js}
</script>
</body>
</html>
`;

writeFileSync(join(root, "flappy-clone.html"), html);
console.log("wrote flappy-clone.html");
