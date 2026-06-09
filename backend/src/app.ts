import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config";
import { errorHandler, notFound } from "./middleware/error";

import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profile";
import habitsRoutes from "./routes/habits";
import checkinsRoutes from "./routes/checkins";
import creditsRoutes from "./routes/credits";
import shieldsRoutes from "./routes/shields";
import badgesRoutes from "./routes/badges";
import clubsRoutes from "./routes/clubs";
import dmsRoutes from "./routes/dms";
import friendsRoutes from "./routes/friends";
import mentorshipRoutes from "./routes/mentorship";
import leaderboardsRoutes from "./routes/leaderboards";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (config.corsOrigins.includes(origin) || config.corsOrigins.includes("*")) {
          return cb(null, true);
        }
        cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    max: 240,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 30 });

  app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api", apiLimiter);
  app.use("/api/profile", profileRoutes);
  app.use("/api/habits", habitsRoutes);
  app.use("/api/checkins", checkinsRoutes);
  app.use("/api/credits", creditsRoutes);
  app.use("/api/shields", shieldsRoutes);
  app.use("/api/badges", badgesRoutes);
  app.use("/api/clubs", clubsRoutes);
  app.use("/api/dms", dmsRoutes);
  app.use("/api/friends", friendsRoutes);
  app.use("/api/mentorship", mentorshipRoutes);
  app.use("/api/leaderboards", leaderboardsRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
