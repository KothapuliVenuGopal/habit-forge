import http from "node:http";
import { createApp } from "./app";
import { config } from "./config";
import { initSocket } from "./realtime/socket";
import { prisma } from "./lib/prisma";

async function main() {
  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(config.port, () => {
    console.log(`[consitrack-api] listening on :${config.port} (${config.nodeEnv})`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[consitrack-api] ${signal} — shutting down`);
    server.close(() => process.exit(0));
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
