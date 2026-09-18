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

export const config = {
  port: numberFromEnv(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,
  authSecret: process.env.BETTER_AUTH_SECRET,
  authUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  appScheme: process.env.APP_SCHEME ?? "materialapp",
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
