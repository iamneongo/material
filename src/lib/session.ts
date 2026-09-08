import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/db/schema";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string | null;
};

/** Lấy session hiện tại (null nếu chưa đăng nhập). */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

/** Lấy user hiện tại dưới dạng SessionUser (null nếu chưa đăng nhập). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const u = session.user as unknown as SessionUser;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role ?? "site") as UserRole,
    image: u.image,
  };
}

/** Lấy user hiện tại, redirect về /login nếu chưa đăng nhập. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const u = session.user as unknown as SessionUser;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role ?? "site") as UserRole,
    image: u.image,
  };
}

/** Yêu cầu user có 1 trong các role cho phép, nếu không -> trang chủ. */
export async function requireRole(
  allowed: UserRole[]
): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/");
  }
  return user;
}
