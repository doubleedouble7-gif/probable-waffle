import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { getSessionUser } from "../../../lib/session";
import fs from "fs/promises";
import path from "path";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id }
  });

  if (!expense || !expense.receiptPath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", expense.receiptPath);
  try {
    const file = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename=\"${expense.receiptOriginalName ?? "receipt"}\"`
      }
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
