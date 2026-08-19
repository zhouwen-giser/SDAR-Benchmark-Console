import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

function previewFile(path: string) {
  return fileURLToPath(new URL(`../vendor/${path}`, import.meta.url));
}

export default defineConfig({
  base: "./",
  resolve: {
    alias: [
      { find: "antd/locale/zh_CN", replacement: previewFile("antd-locale.ts") },
      { find: "@ant-design/pro-components", replacement: previewFile("pro-components.tsx") },
      { find: "@ant-design/icons", replacement: previewFile("icons.tsx") },
      { find: "@tanstack/react-query", replacement: previewFile("react-query.tsx") },
      { find: "echarts-for-react", replacement: previewFile("echarts-react.tsx") },
      { find: "react-router-dom", replacement: previewFile("react-router-dom.tsx") },
      { find: "antd", replacement: previewFile("antd.tsx") },
      { find: "echarts", replacement: previewFile("echarts.ts") },
      { find: "msw/browser", replacement: previewFile("msw-browser.ts") },
      { find: "msw", replacement: previewFile("msw.ts") },
    ],
  },
  build: {
    outDir: "dist-preview",
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
  },
});
