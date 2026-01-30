import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/db";
import { requireUser } from "../../../lib/require-user";
import { formatCurrency, formatDate } from "../../../lib/format";

export default async function ExpenseDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const expense = await prisma.expense.findFirst({
    where: { id: params.id, userId: user.id },
    include: { car: true, shop: true }
  });

  if (!expense) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">{expense.title}</h2>
          <Link href={`/expenses/${expense.id}/edit`} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Edit</Link>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Car</dt>
            <dd className="font-medium">{expense.car.nickname}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Date</dt>
            <dd className="font-medium">{formatDate(expense.date)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Category</dt>
            <dd className="font-medium">{expense.category}{expense.customCategory ? ` • ${expense.customCategory}` : ""}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Amount</dt>
            <dd className="font-medium">{formatCurrency(expense.amount.toString())}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Odometer</dt>
            <dd className="font-medium">{expense.odometer ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Vendor / Workshop</dt>
            <dd className="font-medium">{expense.vendor ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Payment Method</dt>
            <dd className="font-medium">{expense.paymentMethod ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Shop</dt>
            <dd className="font-medium">{expense.shop?.name ?? "-"}</dd>
            {expense.shop?.googleMapsUrl && (
              <a className="text-sm text-slate-600 underline" href={expense.shop.googleMapsUrl} target="_blank" rel="noreferrer">
                Open in Maps
              </a>
            )}
          </div>
        </dl>
        <div className="mt-6 grid gap-2">
          <p className="text-sm text-slate-500">Description</p>
          <p>{expense.description ?? "-"}</p>
          <p className="text-sm text-slate-500">Notes</p>
          <p>{expense.notes ?? "-"}</p>
        </div>
        {expense.receiptPath && (
          <div className="mt-6">
            <a className="text-sm text-slate-600 underline" href={`/receipts/${expense.id}`}>
              View receipt ({expense.receiptOriginalName})
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
