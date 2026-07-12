import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
	...nextVitals,
	...nextTypeScript,
	eslintConfigPrettier,
	{
		files: ["**/*.{ts,tsx,js,jsx}"],
		rules: {
			"react-hooks/component-hook-factories": "warn",
			"react-hooks/config": "warn",
			"react-hooks/error-boundaries": "warn",
			"react-hooks/gating": "warn",
			"react-hooks/globals": "warn",
			"react-hooks/immutability": "warn",
			"react-hooks/incompatible-library": "warn",
			"react-hooks/preserve-manual-memoization": "warn",
			"react-hooks/purity": "warn",
			"react-hooks/refs": "warn",
			"react-hooks/set-state-in-effect": "warn",
			"react-hooks/set-state-in-render": "warn",
			"react-hooks/static-components": "warn",
			"react-hooks/unsupported-syntax": "warn",
			"react-hooks/use-memo": "warn",
			"no-extra-semi": "error",
		},
	},
	{
		files: ["**/*.{ts,tsx}"],
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
			curly: "error",
			quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
			"@typescript-eslint/naming-convention": [
				"error",
				{ selector: "default", format: ["camelCase"] },
				{ selector: "import", format: ["camelCase", "PascalCase", "UPPER_CASE"] },
				{ selector: "memberLike", modifiers: ["private", "static", "readonly"], format: ["UPPER_CASE"] },
				{ selector: "memberLike", modifiers: ["static", "readonly"], format: ["UPPER_CASE"] },
				{ selector: "enumMember", format: ["PascalCase"] },
				{ selector: "variable", format: ["camelCase", "UPPER_CASE"] },
				{ selector: "parameter", format: ["camelCase"], leadingUnderscore: "allow" },
				{ selector: "property", format: ["camelCase", "snake_case", "UPPER_CASE"] },
				{ selector: "property", modifiers: ["requiresQuotes"], format: null },
				{ selector: "memberLike", modifiers: ["private"], format: ["camelCase"] },
				{ selector: "memberLike", modifiers: ["requiresQuotes"], format: null },
				{ selector: "property", modifiers: ["private"], format: ["camelCase"], leadingUnderscore: "allow" },
				{ selector: "property", modifiers: ["private", "static", "readonly"], format: ["UPPER_CASE"] },
				{ selector: "typeLike", format: ["PascalCase"] },
				{ selector: "variable", modifiers: ["destructured"], format: null },
				{ selector: "parameter", modifiers: ["destructured"], format: null },
				{ selector: "variable", modifiers: ["global"], format: ["camelCase", "UPPER_CASE", "PascalCase"] },
				{ selector: "function", modifiers: ["global"], format: ["camelCase", "PascalCase"] },
			],
		},
	},
	globalIgnores([".next/**", ".vercel/**", ".worktrees/**", "functions/**", "web/**", "supabase/.temp/**"]),
]);
