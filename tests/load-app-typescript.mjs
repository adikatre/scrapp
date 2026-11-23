import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

// The app uses extensionless TypeScript imports. Use its installed TypeScript
// compiler for this test process so no separate runner or network is required.
export const require = createRequire(import.meta.url);
require.extensions[".ts"] = (mod, file) => {
  const source = readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  });
  mod._compile(result.outputText, file);
};
