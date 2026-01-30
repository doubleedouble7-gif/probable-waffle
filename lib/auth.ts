import bcrypt from "bcrypt";
import { prisma } from "./db";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(name: string | null, email: string, password: string) {
  const hashed = await hashPassword(password);
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashed
    }
  });
}
