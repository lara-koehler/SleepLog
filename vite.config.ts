import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  base: "/SleepLog/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Sleep Tracker",
        short_name: "Sleep",
        description: "Log when you sleep, when you wake, and how you feel.",
        theme_color: "#1e1b4b",
        background_color: "#1e1b4b",
        display: "standalone",
        start_url: "/SleepLog/",
        scope: "/SleepLog/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
