import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL chưa được cấu hình trong .env");
}

// Node 22+ có sẵn global WebSocket — dùng driver serverless (Pool) để hỗ trợ
// transaction (Better Auth cần), chạy qua WebSocket tới Neon pooler.
if (typeof globalThis.WebSocket !== "undefined") {
  neonConfig.webSocketConstructor =
    globalThis.WebSocket as unknown as typeof neonConfig.webSocketConstructor;
}

const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool, { schema });

export { schema };
