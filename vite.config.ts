import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
export default defineConfig({
  plugins: [dts({exclude: ["dist", "**/*.spec.ts"]})],
  build: {
    outDir: "dist",
    lib: {
      entry: "src/postcssForPlugin.ts",
      name: "postcssForPlugin",
      formats: ["es", "cjs"]
    }
  }
});
