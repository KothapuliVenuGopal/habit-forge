import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../config";

export interface JwtPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString("base64url");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate(): Date {
  // crude parse for "30d" / "7d" / "12h"
  const m = config.refreshExpiresIn.match(/^(\d+)([dhm])$/);
  const n = m ? parseInt(m[1], 10) : 30;
  const unit = m?.[2] ?? "d";
  const mult = unit === "d" ? 86400000 : unit === "h" ? 3600000 : 60000;
  return new Date(Date.now() + n * mult);
}
