import { resolve } from "node:path";
import { defineConfig } from "vite";

const entry = process.env.BUILD_ENTRY || "background";

export default defineConfig({
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
