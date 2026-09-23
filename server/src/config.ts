import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const sourceDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(sourceDir, "../../.env") });
dotenv.config({ path: resolve(sourceDir, "../.env"), override: true });

function numberFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalStringFromEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function booleanFromEnv(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export const config = {
  port: numberFromEnv(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.BETTER_AUTH_SECRET,
  authUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  appScheme: process.env.APP_SCHEME ?? "materialapp",
  googleClientId: optionalStringFromEnv(process.env.GOOGLE_CLIENT_ID),
  googleClientSecret: optionalStringFromEnv(process.env.GOOGLE_CLIENT_SECRET),
  googleHostedDomain: optionalStringFromEnv(process.env.GOOGLE_HOSTED_DOMAIN),
  googleAuthAllowSignUp: booleanFromEnv(process.env.GOOGLE_AUTH_ALLOW_SIGN_UP),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:8081")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
};

export function requireServerConfig() {
  const missing = [
    !config.databaseUrl && "DATABASE_URL",
    !config.authSecret && "BETTER_AUTH_SECRET",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường: ${missing.join(", ")}`);
  }
}
