import type { UserRole } from "../db/schema.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: { id: string; name: string; email: string; role: UserRole; image?: string | null };
    }
  }
}

export {};
