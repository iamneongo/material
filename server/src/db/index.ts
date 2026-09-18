import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { config } from "../config.js";
import * as schema from "./schema.js";

if (!config.databaseUrl) throw new Error("DATABASE_URL chưa được cấu hình.");
if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = globalThis.WebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

export const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool, { schema });
