import { prisma } from "../../lib/db";
import { requireUser } from "../../lib/require-user";
import { formatCurrency } from "../../lib/format";
import { format } from "date-fns";

export default async function ReportsPage() {
  const user = await requireUser();

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    include: { car: true }
  });

  const overallTotal = expenses.reduce((acc, item) => acc + Number(item.amount), 0);

  const totalsByCarMonth = new Map<string, Map<string, number>>();
  const totalsByCarCategory = new Map<string, Map<string, number>>();

  for (const expense of expenses) {
    const monthKey = format(expense.date, "yyyy-MM");
    const carMonth = totalsByCarMonth.get(expense.car.nickname) ?? new Map<string, number>();
    carMonth.set(monthKey, (carMonth.get(monthKey) ?? 0) + Number(expense.amount));
    totalsByCarMonth.set(expense.car.nickname, carMonth);

    const carCategory = totalsByCarCategory.get(expense.car.nickname) ?? new Map<string, number>();
    carCategory.set(expense.category, (carCategory.get(expense.category) ?? 0) + Number(expense.amount));
    totalsByCarCategory.set(expense.car.nickname, carCategory);
  }

  return (
    <div className="grid gap-8">
      <section className="card">
        <h2 className="text-xl font-semibold">Overall totals</h2>
        <p className="mt-3 text-2xl font-semibold">{formatCurrency(overallTotal)}</p>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Monthly totals per car</h2>
        <div className="mt-4 grid gap-4">
          {[...totalsByCarMonth.entries()].map(([car, months]) => (
            <div key={car} className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium">{car}</p>
              <ul className="mt-2 grid gap-2 text-sm text-slate-600">
                {[...months.entries()].map(([month, total]) => (
                  <li key={month} className="flex items-center justify-between">
                    <span>{month}</span>
                    <span>{formatCurrency(total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {totalsByCarMonth.size === 0 && <p className="text-sm text-slate-500">No expenses yet.</p>}
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Totals by category per car</h2>
        <div className="mt-4 grid gap-4">
          {[...totalsByCarCategory.entries()].map(([car, categories]) => (
            <div key={car} className="rounded-lg border border-slate-200 p-4">
              <p className="font-medium">{car}</p>
              <ul className="mt-2 grid gap-2 text-sm text-slate-600">
                {[...categories.entries()].map(([category, total]) => (
                  <li key={category} className="flex items-center justify-between">
                    <span>{category}</span>
                    <span>{formatCurrency(total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {totalsByCarCategory.size === 0 && <p className="text-sm text-slate-500">No expenses yet.</p>}
        </div>
      </section>
    </div>
  );
}
