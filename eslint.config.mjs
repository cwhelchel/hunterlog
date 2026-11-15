import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        plugins: { js },
        extends: ["js/recommended"], languageOptions: { globals: globals.browser },
        rules: {
            // Disable the base ESLint rule to avoid conflicts
            'no-unused-vars': 'off',

            // Configure the TypeScript rule to ignore underscore prefixes
            '@typescript-eslint/no-unused-vars': [
                'error', // or 'warn'
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_',
                },
            ]
        }
    },
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
]);
