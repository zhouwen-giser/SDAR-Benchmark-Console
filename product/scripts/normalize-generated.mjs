import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const generatedRoot = new URL("../src/api/generated/", import.meta.url).pathname;
for (const file of await walk(generatedRoot)) {
  if (!file.endsWith(".ts")) continue;
  const source = await readFile(file, "utf8");
  const normalized = source.replace(/[\t ]+$/gmu, "");
  if (normalized !== source) await writeFile(file, normalized);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}
