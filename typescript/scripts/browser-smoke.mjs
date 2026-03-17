import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(workspaceRoot, "packages/polygen");
const tempRoot = mkdtempSync(join(tmpdir(), "polygen-browser-"));
const tarballDirectory = resolve(tempRoot, "pack");
const projectDirectory = resolve(tempRoot, "app");

try {
  mkdirSync(tarballDirectory, { recursive: true });
  mkdirSync(projectDirectory, { recursive: true });

  run("pnpm", ["--filter", "polygen", "build"], workspaceRoot);

  const packInfo = JSON.parse(
    execFileSync(
      "pnpm",
      ["pack", "--pack-destination", tarballDirectory, "--json"],
      {
        cwd: packageRoot,
        encoding: "utf8"
      }
    )
  );
  const tarballPath = packInfo.filename;

  writeFileSync(
    resolve(projectDirectory, "package.json"),
    JSON.stringify(
      {
        name: "polygen-browser-smoke",
        private: true,
        type: "module"
      },
      null,
      2
    )
  );

  writeFileSync(
    resolve(projectDirectory, "index.js"),
    [
      'import { polygen, polygenSegment, polygenWithInfo } from "polygen";',
      "",
      'const grammar = "S ::= alpha | beta | gamma;";',
      "const text = polygen(grammar, { seed: 42 });",
      "const info = polygenWithInfo(grammar);",
      'const segment = polygenSegment("left | right", { seed: 7 });',
      "",
      'if (!["alpha", "beta", "gamma"].includes(text)) {',
      "  throw new Error(`Unexpected bundled polygen output: ${text}`);",
      "}",
      "",
      'if (!["alpha", "beta", "gamma"].includes(info.text)) {',
      "  throw new Error(`Unexpected bundled polygenWithInfo output: ${info.text}`);",
      "}",
      "",
      'if (!["left", "right"].includes(segment)) {',
      "  throw new Error(`Unexpected bundled polygenSegment output: ${segment}`);",
      "}",
      "",
      "if (!Number.isInteger(info.resolvedSeed)) {",
      '  throw new Error("Bundled resolvedSeed must be an integer.");',
      "}",
      "",
      'console.log("Browser smoke test passed.");'
    ].join("\n")
  );

  run("pnpm", ["add", tarballPath], projectDirectory);
  run(
    localBinary("esbuild"),
    [
      "index.js",
      "--bundle",
      "--platform=browser",
      "--format=iife",
      "--target=es2020",
      "--outfile=bundle.js"
    ],
    projectDirectory
  );
  run("node", ["bundle.js"], projectDirectory);
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}

function localBinary(name) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  return resolve(workspaceRoot, "node_modules/.bin", `${name}${suffix}`);
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}
