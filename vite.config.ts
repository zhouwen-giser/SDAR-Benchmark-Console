import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";
import { fileURLToPath, URL } from "node:url";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    resolve: {
      alias: [
        { find: "antd/locale/zh_CN", replacement: fileURLToPath(new URL("./vendor/antd-locale.ts", import.meta.url)) },
        { find: "@ant-design/pro-components", replacement: fileURLToPath(new URL("./vendor/pro-components.tsx", import.meta.url)) },
        { find: "@ant-design/icons", replacement: fileURLToPath(new URL("./vendor/icons.tsx", import.meta.url)) },
        { find: "@tanstack/react-query", replacement: fileURLToPath(new URL("./vendor/react-query.tsx", import.meta.url)) },
        { find: "echarts-for-react", replacement: fileURLToPath(new URL("./vendor/echarts-react.tsx", import.meta.url)) },
        { find: "react-router-dom", replacement: fileURLToPath(new URL("./vendor/react-router-dom.tsx", import.meta.url)) },
        { find: "antd", replacement: fileURLToPath(new URL("./vendor/antd.tsx", import.meta.url)) },
        { find: "echarts", replacement: fileURLToPath(new URL("./vendor/echarts.ts", import.meta.url)) },
      ],
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["terminal.local"],
      watch: {
        ignored: ["**/.sites-runtime/**", "**/product/node_modules/**", "**/product/dist/**"],
        ...(isCodexSeatbeltSandbox ? { useFsEvents: false, usePolling: true } : {}),
      },
    },
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: localBindingConfig,
      }),
    ],
  };
});
