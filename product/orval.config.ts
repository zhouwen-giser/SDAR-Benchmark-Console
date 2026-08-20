import { defineConfig } from "orval";

export default defineConfig({
  benchmarkServer: {
    input: "./api/benchmark-server.openapi.yaml",
    output: {
      target: "./src/api/generated/benchmark-server.ts",
      schemas: "./src/api/generated/model",
      client: "fetch",
      httpClient: "fetch",
      mock: false,
      clean: true,
      prettier: false,
    },
  },
});
