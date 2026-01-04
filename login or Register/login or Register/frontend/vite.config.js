import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000", // 👈 FastAPI backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // 👈 removes /api prefix
      },
    },
  },
  resolve: {
    alias: {
      react: path.resolve("./node_modules/react"),
    },
  },
});
