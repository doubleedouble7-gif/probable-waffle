import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/db";
import { requireUser } from "../../../../lib/require-user";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../../../lib/constants";
import { expenseSchema } from "../../../../lib/validators";
import { parseNumber } from "../../../../lib/format";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export default async function EditExpensePage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  const expense = await prisma.expense.findFirst({ where: { id: params.id, userId: user.id } });
  if (!expense) {
    redirect("/dashboard");
  }
  const cars = await prisma.car.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const shops = await prisma.shop.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Edit expense</h2>
      {searchParams.error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error}
        </p>
      )}
      <form className="mt-6 grid gap-4 md:grid-cols-2" action={updateExpenseAction} encType="multipart/form-data">
        <input type="hidden" name="expenseId" value={expense.id} />
        <div className="md:col-span-2">
          <label htmlFor="carId">Car *</label>
          <select id="carId" name="carId" defaultValue={expense.carId} required>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>{car.nickname}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date">Date *</label>
          <input id="date" name="date" type="date" required defaultValue={expense.date.toISOString().slice(0, 10)} />
        </div>
        <div>
          <label htmlFor="category">Category *</label>
          <select id="category" name="category" required defaultValue={expense.category}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="customCategory">Custom category (optional)</label>
          <input id="customCategory" name="customCategory" defaultValue={expense.customCategory ?? ""} />
        </div>
        <div>
          <label htmlFor="title">Title *</label>
          <input id="title" name="title" required defaultValue={expense.title} />
        </div>
        <div>
          <label htmlFor="amount">Amount (RM) *</label>
          <input id="amount" name="amount" type="number" step="0.01" required defaultValue={expense.amount.toString()} />
        </div>
        <div>
          <label htmlFor="odometer">Odometer (km)</label>
          <input id="odometer" name="odometer" type="number" defaultValue={expense.odometer ?? ""} />
        </div>
        <div>
          <label htmlFor="vendor">Vendor / Workshop</label>
          <input id="vendor" name="vendor" defaultValue={expense.vendor ?? ""} />
        </div>
        <div>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod" defaultValue={expense.paymentMethod ?? ""}>
            <option value="">Select</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shopId">Shop (searchable)</label>
          <input
            id="shopId"
            name="shopId"
            list="shop-options"
            placeholder="Type to search shops"
            defaultValue={expense.shopId ?? ""}
          />
          <datalist id="shop-options">
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id} label={shop.name} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} defaultValue={expense.description ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={expense.notes ?? ""} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="receipt">Replace receipt (jpg/png/webp, max 5MB)</label>
          <input id="receipt" name="receipt" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <div className="md:col-span-2 flex gap-3">
          <button type="submit">Save changes</button>
          <button formAction={deleteExpenseAction} className="bg-rose-600 hover:bg-rose-500">Delete expense</button>
        </div>
      </form>
    </div>
  );
}

async function updateExpenseAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = expenseSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/expenses/${formData.get("expenseId")}/edit?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const data = parsed.data;
  const expenseId = String(formData.get("expenseId"));

  let receiptPath: string | null = null;
  let receiptOriginalName: string | null = null;
  let receiptUploadedAt: Date | null = null;

  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    if (receipt.size > 5 * 1024 * 1024) {
      redirect(`/expenses/${expenseId}/edit?error=Receipt%20too%20large%20(max%205MB)`);
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(receipt.type)) {
      redirect(`/expenses/${expenseId}/edit?error=Invalid%20receipt%20format`);
    }
    const buffer = Buffer.from(await receipt.arrayBuffer());
    const filename = `${crypto.randomUUID()}${path.extname(receipt.name)}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    receiptPath = `/uploads/${filename}`;
    receiptOriginalName = receipt.name;
    receiptUploadedAt = new Date();
  }

  await prisma.expense.updateMany({
    where: { id: expenseId, userId: user.id },
    data: {
      carId: data.carId,
      date: new Date(data.date),
      category: data.category as any,
      customCategory: data.customCategory || null,
      title: data.title,
      description: data.description || null,
      amount: parseNumber(data.amount) ?? 0,
      odometer: data.odometer ? Number(data.odometer) : null,
      vendor: data.vendor || null,
      paymentMethod: data.paymentMethod ? (data.paymentMethod as any) : null,
      notes: data.notes || null,
      shopId: data.shopId || null,
      ...(receiptPath
        ? { receiptPath, receiptOriginalName, receiptUploadedAt }
        : {})
    }
  });

  redirect(`/expenses/${expenseId}`);
}

async function deleteExpenseAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const expenseId = String(formData.get("expenseId"));
  await prisma.expense.deleteMany({ where: { id: expenseId, userId: user.id } });
  redirect("/dashboard");
}
