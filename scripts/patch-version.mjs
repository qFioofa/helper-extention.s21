import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

for (const rel of ["dist/manifest.json", "public/manifest.json"]) {
	const manifestPath = resolve(root, rel);
	const source = readFileSync(manifestPath, "utf8");
	if (source.includes(pkg.version)) {
		console.log(`patched ${rel} already at ${pkg.version}`);
		continue;
	}
	writeFileSync(manifestPath, source.replace(/"version"\s*:\s*"[^"]*"/, `"version": "${pkg.version}"`));
	console.log(`patched ${rel} version -> ${pkg.version}`);
}