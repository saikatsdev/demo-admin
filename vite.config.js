import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/_img": {
        target: "https://api.waqeya.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/_img/, ""),
      },
    },
  },
});