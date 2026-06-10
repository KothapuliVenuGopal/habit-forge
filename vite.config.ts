import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: [
        "streak-stars.onrender.com",
        "habit-forge-6mbe.onrender.com",
      ],
    },
  },
  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});
