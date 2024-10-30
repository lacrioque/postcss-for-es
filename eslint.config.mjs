import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignored: ["dist"] },
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    files: ["**/*.{cjs}"],
    languageOptions: { globals: globals.node }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended
];
