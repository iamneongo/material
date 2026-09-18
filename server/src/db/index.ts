import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "../config.js";
import * as schema from "./schema.js";

if (!config.databaseUrl) throw new Error("DATABASE_URL chưa được cấu hình.");
const databaseHost = new URL(config.databaseUrl).hostname;
const usesLocalDatabase = databaseHost === "localhost" || databaseHost === "127.0.0.1";

// A Docker-hosted API can reach Neon directly over TLS. The serverless driver
// uses WebSocket transport, which is unavailable from this Dokploy runtime.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: usesLocalDatabase ? undefined : { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });
