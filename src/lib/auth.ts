import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// URL gốc: ưu tiên env, nếu không có thì tự suy ra từ biến Vercel cung cấp
// (production URL cố định, hoặc URL của deployment hiện tại — kể cả preview).
function resolveBaseURL(): string | undefined {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return undefined; // dev: Better Auth mặc định http://localhost:3000
}

// Các origin được tin cậy (kiểm tra CSRF khi đăng nhập/đăng ký).
const trustedOrigins = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL &&
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
      process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
      "http://localhost:3000",
    ].filter(Boolean) as string[]
  )
);

export const auth = betterAuth({
  baseURL: resolveBaseURL(),
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // MVP demo: không cần xác minh email
    requireEmailVerification: false,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "site",
        // Không cho phép người dùng tự set role khi đăng ký/cập nhật
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 ngày
    updateAge: 60 * 60 * 24, // gia hạn mỗi 1 ngày
  },
});

export type Session = typeof auth.$Infer.Session;
