import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./db";

const SESSION_COOKIE = "cartrack_session";
const SESSION_TTL_DAYS = 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

function signToken(token: string) {
  const secret = getSessionSecret();
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

export async function createSession(userId: string) {
  const rawToken = crypto.randomUUID();
  const token = signToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function getSessionUser() {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (!rawToken) return null;
  const token = signToken(rawToken);

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
  if (rawToken) {
    const token = signToken(rawToken);
    await prisma.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}
