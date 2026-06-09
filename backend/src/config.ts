import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: required("DATABASE_URL", "postgresql://localhost/consitrack"),
  jwtSecret: required("JWT_SECRET", "dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? "30d",
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
  },
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  ai: {
    apiKey: process.env.LOVABLE_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "google/gemini-2.5-flash",
    gatewayUrl: "https://ai.gateway.lovable.dev/v1/chat/completions",
  },
};
