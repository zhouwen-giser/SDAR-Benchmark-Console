import { defineConfig } from "orval";

export default defineConfig({
  console: {
    input: "./api/console-api-extension.openapi.yaml",
    output: {
      target: "./src/api/generated/console.ts",
      schemas: "./src/api/generated/model",
      client: "react-query",
      httpClient: "fetch",
      mock: true,
      clean: true,
      prettier: false,
    },
  },
});
