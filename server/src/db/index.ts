import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../config.js";
import * as schema from "./schema.js";

if (!config.databaseUrl) throw new Error("DATABASE_URL chưa được cấu hình.");
const databaseConnection = new URL(config.databaseUrl);
const databaseHost = databaseConnection.hostname;
const usesLocalDatabase = databaseHost === "localhost" || databaseHost === "127.0.0.1";
const disablesSsl = databaseConnection.searchParams.get("sslmode") === "disable";

// A Docker-hosted API can reach Neon directly over TLS. The serverless driver
// uses WebSocket transport, which is unavailable from this Dokploy runtime.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  // Dokploy's service network is private and PostgreSQL does not terminate TLS
  // there. Public providers such as Neon continue to use TLS by default.
  ssl: usesLocalDatabase || disablesSsl ? undefined : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
