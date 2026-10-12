import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import JavaScriptObfuscator from "javascript-obfuscator";

// Preserve public APIs and avoid anti-debugging or costly control-flow tricks.
const options = {
  target: "browser",
  compact: true,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  renameProperties: false,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.6,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  selfDefending: false,
  sourceMap: false,
  seed: 2026,
};
const assets = readdirSync("dist/assets").filter((name) => /^index-[A-Za-z0-9_-]+\.js$/.test(name));
if (!assets.length) throw new Error("Run the production build before obfuscation.");
let html = readFileSync("dist/index.html", "utf8");
const manifest = {};
function obfuscate(source) {
  const notices = [...source.matchAll(/\/\*[\s\S]*?\*\//g)]
    .map(([comment]) => comment)
    .filter((comment) => /@license|@preserve|copyright/i.test(comment));
  return `${notices.join("\n")}\n${JavaScriptObfuscator.obfuscate(source, options).getObfuscatedCode()}`;
}
for (const name of assets) {
  const code = obfuscate(readFileSync(`dist/assets/${name}`, "utf8"));
  const digest = createHash("sha256").update(code).digest("hex");
  const output = `index-${digest.slice(0, 12)}.js`;
  renameSync(`dist/assets/${name}`, `dist/assets/${output}`);
  writeFileSync(`dist/assets/${output}`, code);
  html = html.replaceAll(name, output);
  manifest[`assets/${output}`] = digest;
}
writeFileSync("dist/index.html", html);
mkdirSync(".protected", { recursive: true });
const admin = obfuscate(readFileSync("admin/admin.js", "utf8"));
writeFileSync(".protected/admin.js", admin);
manifest["admin/admin.js"] = createHash("sha256").update(admin).digest("hex");
writeFileSync(".protected/manifest.json", JSON.stringify(manifest, null, 2));
console.log(`Obfuscated ${assets.length} public bundle(s) and the admin JavaScript. No source maps generated.`);
