import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures"
);

export function readFixture(name: string): string {
  return readFileSync(resolve(fixtureDirectory, name), "utf8");
}
