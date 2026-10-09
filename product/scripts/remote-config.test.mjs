import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfigFromFile, loadEnv } from "vite";

test("local evaluation default, offline mode and local/process precedence", async () => {
  const dir = await mkdtemp(join(tmpdir(), "console-config-test-"));
  const key = "VITE_BENCHMARK_API_UPSTREAM";
  const previous = process.env[key];
  try {
    const defaults = await readFile(new URL("../.env", import.meta.url), "utf8");
    await writeFile(join(dir, ".env"), defaults);
    await writeFile(join(dir, ".env.test"), await readFile(new URL("../.env.test", import.meta.url), "utf8"));
    delete process.env[key];
    assert.equal(loadEnv("development", dir).VITE_API_MODE, "http");
    assert.equal(loadEnv("production", dir)[key], "http://127.0.0.1:18090");
    assert.equal(loadEnv("production", dir).VITE_TELEMETRY_QUERY_UPSTREAM, "http://17.26.1.20:28081");
    assert.equal(loadEnv("test", dir).VITE_API_MODE, "mock");
    await writeFile(join(dir, ".env.local"), `${key}=http://17.26.1.20:38090\n`);
    assert.equal(loadEnv("development", dir)[key], "http://17.26.1.20:38090");
    process.env[key] = "http://127.0.0.1:18094";
    assert.equal(loadEnv("development", dir)[key], "http://127.0.0.1:18094");
  } finally {
    if (previous === undefined) delete process.env[key]; else process.env[key] = previous;
    await rm(dir, { recursive: true });
  }
});

test("development and preview resolve the same proxy defaults and explicit overrides", async () => {
  const dir = await mkdtemp(join(tmpdir(), "console-proxy-test-"));
  const cwd = process.cwd();
  const keys = ["VITE_BENCHMARK_API_UPSTREAM", "VITE_TELEMETRY_QUERY_UPSTREAM"];
  const previous = keys.map((key) => process.env[key]);
  try {
    await writeFile(join(dir, ".env"), await readFile(new URL("../.env", import.meta.url), "utf8"));
    process.chdir(dir);
    keys.forEach((key) => delete process.env[key]);
    const configFile = fileURLToPath(new URL("../vite.config.ts", import.meta.url));
    for (const [mode, isPreview] of [["development", false], ["production", true]]) {
      const result = await loadConfigFromFile({ command: "serve", mode, isPreview }, configFile);
      assert.equal(result.config.server.proxy["/benchmark-api"].target, "http://127.0.0.1:18090");
      assert.equal(result.config.preview.proxy["/benchmark-api"].target, "http://127.0.0.1:18090");
      assert.equal(result.config.server.proxy["/telemetry-api"].target, "http://17.26.1.20:28081");
      assert.equal(result.config.preview.proxy["/telemetry-api"].target, "http://17.26.1.20:28081");
      assert.equal(result.config.server.proxy["/benchmark-api"].rewrite("/benchmark-api/v1/context/options"), "/v1/context/options");
    }
    await writeFile(join(dir, ".env.local"), `${keys[0]}=http://17.26.1.20:38090\n${keys[1]}=http://127.0.0.1:18081\n`);
    const local = await loadConfigFromFile({ command: "serve", mode: "development" }, configFile);
    assert.equal(local.config.server.proxy["/benchmark-api"].target, "http://17.26.1.20:38090");
    assert.equal(local.config.preview.proxy["/telemetry-api"].target, "http://127.0.0.1:18081");
    process.env[keys[0]] = "http://127.0.0.1:18094";
    const explicit = await loadConfigFromFile({ command: "serve", mode: "production", isPreview: true }, configFile);
    assert.equal(explicit.config.preview.proxy["/benchmark-api"].target, "http://127.0.0.1:18094");
  } finally {
    process.chdir(cwd);
    keys.forEach((key, index) => { if (previous[index] === undefined) delete process.env[key]; else process.env[key] = previous[index]; });
    await rm(dir, { recursive: true });
  }
});
