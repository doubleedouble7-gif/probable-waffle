import { redirect } from "next/navigation";
import { prisma } from "../../../lib/db";
import { requireUser } from "../../../lib/require-user";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../../lib/constants";
import { expenseSchema } from "../../../lib/validators";
import { parseNumber } from "../../../lib/format";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export default async function NewExpensePage({ searchParams }: { searchParams: { error?: string } }) {
  const user = await requireUser();
  const cars = await prisma.car.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const shops = await prisma.shop.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } });

  if (cars.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold">Add your first car</h2>
        <p className="mt-2 text-sm text-slate-600">You need a car before adding expenses.</p>
        <div className="mt-4">
          <a href="/cars" className="rounded-md bg-slate-900 px-4 py-2 text-white">Go to cars</a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold">Add expense</h2>
      {searchParams.error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {searchParams.error}
        </p>
      )}
      <form className="mt-6 grid gap-4 md:grid-cols-2" action={createExpenseAction} encType="multipart/form-data">
        <div className="md:col-span-2">
          <label htmlFor="carId">Car *</label>
          <select id="carId" name="carId" required>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>{car.nickname}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date">Date *</label>
          <input id="date" name="date" type="date" required />
        </div>
        <div>
          <label htmlFor="category">Category *</label>
          <select id="category" name="category" required>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="customCategory">Custom category (optional)</label>
          <input id="customCategory" name="customCategory" placeholder="e.g. Toll pass" />
        </div>
        <div>
          <label htmlFor="title">Title *</label>
          <input id="title" name="title" required />
        </div>
        <div>
          <label htmlFor="amount">Amount (RM) *</label>
          <input id="amount" name="amount" type="number" step="0.01" required />
        </div>
        <div>
          <label htmlFor="odometer">Odometer (km)</label>
          <input id="odometer" name="odometer" type="number" />
        </div>
        <div>
          <label htmlFor="vendor">Vendor / Workshop</label>
          <input id="vendor" name="vendor" />
        </div>
        <div>
          <label htmlFor="paymentMethod">Payment Method</label>
          <select id="paymentMethod" name="paymentMethod">
            <option value="">Select</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="shopId">Shop (searchable)</label>
          <input id="shopId" name="shopId" list="shop-options" placeholder="Type to search shops" />
          <datalist id="shop-options">
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id} label={shop.name} />
            ))}
          </datalist>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows={3} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="receipt">Receipt (jpg/png/webp, max 5MB)</label>
          <input id="receipt" name="receipt" type="file" accept="image/png,image/jpeg,image/webp" />
        </div>
        <details className="md:col-span-2 rounded-md border border-slate-200 p-4">
          <summary className="cursor-pointer font-medium">Add new shop</summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="newShopName">Shop name</label>
              <input id="newShopName" name="newShopName" />
            </div>
            <div>
              <label htmlFor="newShopTags">Category tags</label>
              <input id="newShopTags" name="newShopTags" placeholder="Service, Tyre" />
            </div>
            <div>
              <label htmlFor="newShopAddress">Address</label>
              <input id="newShopAddress" name="newShopAddress" />
            </div>
            <div>
              <label htmlFor="newShopMaps">Google Maps URL</label>
              <input id="newShopMaps" name="newShopMaps" />
            </div>
          </div>
        </details>
        <div className="md:col-span-2">
          <button type="submit">Save expense</button>
        </div>
      </form>
    </div>
  );
}

async function createExpenseAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = expenseSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/expenses/new?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }

  const data = parsed.data;
  let shopId = data.shopId || null;

  const newShopName = String(formData.get("newShopName") || "").trim();
  if (newShopName) {
    const shop = await prisma.shop.create({
      data: {
        userId: user.id,
        name: newShopName,
        categoryTags: String(formData.get("newShopTags") || "") || null,
        address: String(formData.get("newShopAddress") || "") || null,
        googleMapsUrl: String(formData.get("newShopMaps") || "") || null
      }
    });
    shopId = shop.id;
  }

  let receiptPath: string | null = null;
  let receiptOriginalName: string | null = null;
  let receiptUploadedAt: Date | null = null;

  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    if (receipt.size > 5 * 1024 * 1024) {
      redirect("/expenses/new?error=Receipt%20too%20large%20(max%205MB)");
    }
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(receipt.type)) {
      redirect("/expenses/new?error=Invalid%20receipt%20format");
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

  await prisma.expense.create({
    data: {
      userId: user.id,
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
      shopId,
      receiptPath,
      receiptOriginalName,
      receiptUploadedAt
    }
  });

  redirect("/dashboard");
}
