import { randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, asc, count, eq, ne, or } from "drizzle-orm";
import { db } from "../db/index.js";
import { account, orders, session, user, type UserRole } from "../db/schema.js";
import { config } from "../config.js";
import { logActivity } from "./activity-service.js";
import { sendEmail } from "./email-service.js";

type Actor = { id: string; name: string; email: string };
type MemberRole = Extract<UserRole, "admin" | "site" | "accountant">;
type MemberInput = { name?: string; email?: string; role?: MemberRole };

const memberRoles: MemberRole[] = ["admin", "site", "accountant"];
const roleNames: Record<MemberRole, string> = {
  admin: "Quản trị",
  site: "Bộ phận thi công",
  accountant: "Kế toán",
};

function normalizeEmail(email?: string) {
  const value = email?.trim().toLowerCase();
  if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Email thành viên không hợp lệ.");
  return value;
}

function normalizeRole(role?: string): MemberRole {
  if (!role || !memberRoles.includes(role as MemberRole)) throw new Error("Vai trò thành viên không hợp lệ.");
  return role as MemberRole;
}

function temporaryPassword() {
  return `Mm${randomBytes(9).toString("base64url")}!`;
}

export async function listMembers() {
  return db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }).from(user)
    .where(or(eq(user.role, "admin"), eq(user.role, "site"), eq(user.role, "accountant")))
    .orderBy(asc(user.name));
}

export async function inviteMember(actor: Actor, input: MemberInput) {
  const name = input.name?.trim();
  if (!name) throw new Error("Tên thành viên là bắt buộc.");
  const email = normalizeEmail(input.email);
  const role = normalizeRole(input.role);
  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  const now = new Date();
  const id = randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name,
      email,
      emailVerified: true,
      image: null,
      role,
      createdAt: now,
      updatedAt: now,
    });
    await tx.insert(account).values({
      id: randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity(tx, {
      actorId: actor.id,
      actorName: actor.name,
      action: "member.invited",
      entityType: "member",
      summary: `${actor.name} mời ${name} (${roleNames[role]}) vào hệ thống.`,
    });
  });

  const emailResult = await sendMemberInviteEmail({ name, email, role, password, actorName: actor.name });
  return { id, name, email, role, temporaryPassword: password, emailSent: emailResult.sent, emailWarning: emailResult.sent ? null : emailResult.reason };
}

export async function updateMember(actor: Actor, id: string, input: MemberInput) {
  if (id === actor.id && input.role && input.role !== "admin") throw new Error("Admin không thể tự hạ quyền của chính mình.");
  const name = input.name?.trim();
  if (!name) throw new Error("Tên thành viên là bắt buộc.");
  const email = normalizeEmail(input.email);
  const role = normalizeRole(input.role);
  await db.update(user).set({ name, email, role, updatedAt: new Date() }).where(eq(user.id, id));
  await logActivity(db, {
    actorId: actor.id,
    actorName: actor.name,
    action: "member.updated",
    entityType: "member",
    summary: `${actor.name} cập nhật thành viên ${name} (${roleNames[role]}).`,
  });
}

export async function deleteMember(actor: Actor, id: string) {
  if (id === actor.id) throw new Error("Admin không thể tự xóa tài khoản của chính mình.");
  const [target] = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role }).from(user)
    .where(and(eq(user.id, id), ne(user.role, "supplier")));
  if (!target) throw new Error("Không tìm thấy thành viên.");
  const [[created], [approved]] = await Promise.all([
    db.select({ value: count() }).from(orders).where(eq(orders.createdById, id)),
    db.select({ value: count() }).from(orders).where(eq(orders.approvedById, id)),
  ]);
  if (Number(created.value) > 0 || Number(approved.value) > 0) {
    throw new Error("Không thể xóa thành viên đã phát sinh hoặc duyệt đơn. Hãy đổi vai trò/quản lý quyền thay vì xóa.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(session).where(eq(session.userId, id));
    await tx.delete(account).where(eq(account.userId, id));
    await tx.delete(user).where(eq(user.id, id));
    await logActivity(tx, {
      actorId: actor.id,
      actorName: actor.name,
      action: "member.deleted",
      entityType: "member",
      summary: `${actor.name} xóa thành viên ${target.name}.`,
    });
  });
}

async function sendMemberInviteEmail({ name, email, role, password, actorName }: { name: string; email: string; role: MemberRole; password: string; actorName: string }) {
  const subject = "Bạn được mời vào Material App";
  const loginUrl = config.appUrl;
  const text = [
    `Xin chào ${name},`,
    `${actorName} đã mời bạn vào Material App với vai trò ${roleNames[role]}.`,
    `Email đăng nhập: ${email}`,
    `Mật khẩu tạm: ${password}`,
    `Đăng nhập tại: ${loginUrl}`,
    "Vui lòng đổi mật khẩu sau khi đăng nhập nếu quy trình nội bộ yêu cầu.",
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Bạn được mời vào Material App</h2>
      <p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
      <p><strong>${escapeHtml(actorName)}</strong> đã mời bạn vào hệ thống với vai trò <strong>${roleNames[role]}</strong>.</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}<br/><strong>Mật khẩu tạm:</strong> ${escapeHtml(password)}</p>
      <p><a href="${escapeHtml(loginUrl)}">Mở ứng dụng / backend</a></p>
      <p style="color:#6b7280">Nếu bạn không liên quan đến hệ thống này, vui lòng bỏ qua email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject, text, html });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
}
