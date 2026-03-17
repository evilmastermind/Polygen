import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = resolve(workspaceRoot, "packages/polygen");
const tempRoot = mkdtempSync(join(tmpdir(), "polygen-consumer-"));
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
        name: "polygen-consumer-smoke",
        private: true,
        type: "module"
      },
      null,
      2
    )
  );

  writeFileSync(
    resolve(projectDirectory, "index.mjs"),
    [
      'import { polygen, polygenSegment, polygenWithInfo } from "polygen";',
      "",
      'const grammar = "S ::= alpha | beta | gamma;";',
      "const text = polygen(grammar, { seed: 42 });",
      "const info = polygenWithInfo(grammar);",
      'const segment = polygenSegment("left | right", { seed: 7 });',
      "",
      'if (!["alpha", "beta", "gamma"].includes(text)) {',
      "  throw new Error(`Unexpected polygen output: ${text}`);",
      "}",
      "",
      'if (!["alpha", "beta", "gamma"].includes(info.text)) {',
      "  throw new Error(`Unexpected polygenWithInfo output: ${info.text}`);",
      "}",
      "",
      "if (!Number.isInteger(info.resolvedSeed)) {",
      '  throw new Error("resolvedSeed must be an integer.");',
      "}",
      "",
      'if (!["left", "right"].includes(segment)) {',
      "  throw new Error(`Unexpected polygenSegment output: ${segment}`);",
      "}",
      "",
      'console.log("Consumer smoke test passed.");'
    ].join("\n")
  );

  run("pnpm", ["add", tarballPath], projectDirectory);
  run("node", ["index.mjs"], projectDirectory);
} finally {
  rmSync(tempRoot, { force: true, recursive: true });
}

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: "inherit"
  });
}
