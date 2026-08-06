import { resolve } from "node:path";
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

const entry = process.env.BUILD_ENTRY || "background";

export default defineConfig({
	plugins: [svelte()],
	build: {
		outDir: "dist",
		emptyOutDir: false,
		rollupOptions: {
			input: {
				[entry]: resolve(`src/${entry}.ts`),
			},
			output: {
				format: "iife",
				inlineDynamicImports: true,
				entryFileNames: "[name].js",
			},
		},
	},
});
