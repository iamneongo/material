import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config } from "./config.js";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

export const auth = betterAuth({
  baseURL: config.authUrl,
  secret: config.authSecret,
  trustedOrigins: [
    ...config.corsOrigins,
    `${config.appScheme}://`,
    `${config.appScheme}://*`,
    // Expo Go uses an exp:// origin in both LAN and tunnel development.
    "exp://",
    "exp://**",
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
  }),
  emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 6 },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "site", input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  plugins: [expo()],
});
