import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword } from "../lib/password";
import {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
} from "../lib/jwt";
import { config } from "../config";
import { validateBody } from "../middleware/validate";
import { HttpError } from "../middleware/error";

const router = Router();

const SignupSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9_]+$/),
  displayName: z.string().trim().min(1).max(60),
});

const LoginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128),
});

async function uniqueUsername(base: string): Promise<string> {
  let candidate = base.toLowerCase().replace(/[^a-z0-9_]/g, "") || `user${crypto.randomUUID().slice(0, 6)}`;
  if (candidate.length < 3) candidate = `user${candidate}`;
  let suffix = 0;
  while (await prisma.profile.findUnique({ where: { username: candidate } })) {
    suffix += 1;
    candidate = `${candidate}${suffix}`;
  }
  return candidate;
}

async function issueTokens(userId: string, email: string) {
  const access = signAccessToken({ sub: userId, email });
  const { token: refresh, hash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hash, expiresAt: refreshExpiryDate() },
  });
  return { access, refresh };
}

router.post("/signup", validateBody(SignupSchema), async (req, res) => {
  const { email, password, username, displayName } = req.body;
  const exists = await prisma.user.findFirst({
    where: { OR: [{ email }, { profile: { username } }] },
  });
  if (exists) throw new HttpError(409, "Email or username already taken");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profile: { create: { username, displayName } },
      roles: { create: { role: "user" } },
    },
  });
  const tokens = await issueTokens(user.id, user.email);
  res.status(201).json({ user: { id: user.id, email: user.email }, ...tokens });
});

router.post("/login", validateBody(LoginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const tokens = await issueTokens(user.id, user.email);
  res.json({ user: { id: user.id, email: user.email }, ...tokens });
});

const RefreshSchema = z.object({ refresh: z.string().min(10) });
router.post("/refresh", validateBody(RefreshSchema), async (req, res) => {
  const tokenHash = hashToken(req.body.refresh);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw new HttpError(401, "Invalid refresh token");
  }
  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new HttpError(401, "User not found");
  // rotate
  await prisma.refreshToken.update({ where: { tokenHash }, data: { revoked: true } });
  const tokens = await issueTokens(user.id, user.email);
  res.json(tokens);
});

router.post("/logout", validateBody(RefreshSchema), async (req, res) => {
  const tokenHash = hashToken(req.body.refresh);
  await prisma.refreshToken
    .update({ where: { tokenHash }, data: { revoked: true } })
    .catch(() => null);
  res.json({ ok: true });
});

// --- Google OAuth ---
function googleClient() {
  if (!config.google.clientId || !config.google.clientSecret) {
    throw new HttpError(500, "Google OAuth not configured");
  }
  return new OAuth2Client(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri,
  );
}

router.get("/google", (_req, res) => {
  const client = googleClient();
  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
  });
  res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  const code = String(req.query.code ?? "");
  if (!code) throw new HttpError(400, "Missing code");
  const client = googleClient();
  const { tokens: gTokens } = await client.getToken(code);
  if (!gTokens.id_token) throw new HttpError(401, "No id_token");
  const ticket = await client.verifyIdToken({
    idToken: gTokens.id_token,
    audience: config.google.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) throw new HttpError(401, "Google payload invalid");

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
  });
  if (!user) {
    const username = await uniqueUsername(payload.email.split("@")[0]);
    user = await prisma.user.create({
      data: {
        email: payload.email,
        googleId: payload.sub,
        emailVerified: true,
        profile: {
          create: {
            username,
            displayName: payload.name ?? username,
            avatarUrl: payload.picture ?? null,
          },
        },
        roles: { create: { role: "user" } },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: payload.sub, emailVerified: true },
    });
  }
  const tokens = await issueTokens(user.id, user.email);
  const url = new URL("/auth/google-callback", config.frontendUrl);
  url.searchParams.set("access", tokens.access);
  url.searchParams.set("refresh", tokens.refresh);
  res.redirect(url.toString());
});

// --- Password reset (token-based; email sending is optional) ---
const ForgotSchema = z.object({ email: z.string().email() });
router.post("/forgot-password", validateBody(ForgotSchema), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (user) {
    const raw = crypto.randomBytes(32).toString("base64url");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    // TODO: send email. For now we log so dev can test.
    console.log(`[reset] ${config.frontendUrl}/reset-password?token=${raw}`);
  }
  res.json({ ok: true });
});

const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(128),
});
router.post("/reset-password", validateBody(ResetSchema), async (req, res) => {
  const tokenHash = hashToken(req.body.token);
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.used || reset.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired token");
  }
  const passwordHash = await hashPassword(req.body.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } }),
  ]);
  res.json({ ok: true });
});

export default router;
