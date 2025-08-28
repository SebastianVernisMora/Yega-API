import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignorar artefactos de build y dependencias
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      // Relajar reglas comunes para DX sin perder calidad
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  }
);

