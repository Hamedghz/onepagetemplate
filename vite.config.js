import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const phpServer = "http://127.0.0.1:4180";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/admin": { target: phpServer, changeOrigin: false },
      "/api": { target: phpServer, changeOrigin: false },
      "/dl": { target: phpServer, changeOrigin: false },
      "/install.php": { target: phpServer, changeOrigin: false },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
