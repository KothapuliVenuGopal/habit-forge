import { Server as IOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { config } from "../config";

let io: IOServer | null = null;

export function getIo() {
  return io;
}

export function initSocket(httpServer: HttpServer) {
  io = new IOServer(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    socket.broadcast.emit("presence:online", { userId });

    socket.on("club:join", (clubId: string) => {
      socket.join(`club:${clubId}`);
    });
    socket.on("club:leave", (clubId: string) => {
      socket.leave(`club:${clubId}`);
    });

    socket.on(
      "club:message",
      async (payload: { clubId: string; body: string }, ack?: (msg: unknown) => void) => {
        try {
          const member = await prisma.clubMember.findUnique({
            where: { clubId_userId: { clubId: payload.clubId, userId } },
          });
          if (!member) return ack?.({ error: "Not a member" });
          const msg = await prisma.clubMessage.create({
            data: { clubId: payload.clubId, userId, body: payload.body.slice(0, 2000) },
          });
          io!.to(`club:${payload.clubId}`).emit("club:message", msg);
          ack?.(msg);
        } catch (e) {
          ack?.({ error: e instanceof Error ? e.message : "Send failed" });
        }
      },
    );

    socket.on(
      "dm:send",
      async (payload: { toUserId: string; body: string }, ack?: (msg: unknown) => void) => {
        try {
          const to = await prisma.profile.findUnique({ where: { id: payload.toUserId } });
          if (!to?.dmEnabled) return ack?.({ error: "DMs disabled" });
          const msg = await prisma.directMessage.create({
            data: { fromId: userId, toId: payload.toUserId, body: payload.body.slice(0, 2000) },
          });
          io!.to(`user:${payload.toUserId}`).emit("dm:receive", msg);
          ack?.(msg);
        } catch (e) {
          ack?.({ error: e instanceof Error ? e.message : "Send failed" });
        }
      },
    );

    socket.on("disconnect", () => {
      socket.broadcast.emit("presence:offline", { userId });
    });
  });

  return io;
}
