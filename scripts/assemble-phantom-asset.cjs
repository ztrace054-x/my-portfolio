const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const partsDir = path.join(root, ".tmp", "phantom-asset");
const target = path.join(root, "assets", "phantom-signal-hero.webp");
const names = ["part-01.txt", "part-02.txt", "part-03.txt", "part-04.txt"];
const paths = names.map(name => path.join(partsDir, name));
const existing = paths.filter(file => fs.existsSync(file));
if (!existing.length && fs.existsSync(target)) {
  console.log("Phantom Signal portrait already exists; nothing to assemble.");
  process.exit(0);
}
if (existing.length !== names.length) {
  throw new Error("Expected all four original portrait transport fragments; found " + existing.length + " of " + names.length + ".");
}
const encoded = paths.map(file => fs.readFileSync(file, "utf8").trim()).join("");
if (encoded.length !== 27432) {
  throw new Error("Portrait payload length mismatch: expected 27432 base64 characters, received " + encoded.length + ".");
}
const bytes = Buffer.from(encoded, "base64");
if (bytes.length !== 20574 || bytes.subarray(0, 4).toString("ascii") !== "RIFF" || bytes.subarray(8, 12).toString("ascii") !== "WEBP") {
  throw new Error("Portrait payload is not the expected valid WebP asset.");
}
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, bytes);
for (const file of paths) fs.unlinkSync(file);
fs.rmSync(partsDir, { recursive: true, force: true });
console.log("Assembled original Phantom Signal portrait: " + bytes.length + " bytes.");
