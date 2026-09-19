import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Робоча тека figma-parity: Python-віртуалка з вендореним драйвером
    // Playwright. Вона в .gitignore, але ESLint читає лише цей список —
    // без неї лінт обвалюється на розмірі виводу.
    ".parity/**",
    // Міграції пише не людина, а `payload migrate:create`. Він завжди
    // розкриває сигнатуру `{ db, payload, req }`, хоч більшість міграцій
    // чіпає лише `db` — і кожна нова тягнула б за собою три однакові
    // попередження про невживані аргументи. Правити згенерований файл
    // марно: наступна генерація поверне все як було.
    "src/migrations/**",
  ]),
]);

export default eslintConfig;
