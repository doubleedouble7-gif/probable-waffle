import Link from "next/link";
import { prisma } from "../../lib/db";
import { requireUser } from "../../lib/require-user";
import { formatCurrency, formatDate } from "../../lib/format";
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from "../../lib/constants";
import { getReminderStatus } from "../../lib/reminders";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: {
    car?: string;
    search?: string;
    category?: string;
    payment?: string;
    from?: string;
    to?: string;
    sort?: string;
  };
}) {
  const user = await requireUser();
  const cars = await prisma.car.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });

  const filters: any = { userId: user.id };
  if (searchParams.car) filters.carId = searchParams.car;
  if (searchParams.category) filters.category = searchParams.category;
  if (searchParams.payment) filters.paymentMethod = searchParams.payment;
  if (searchParams.search) {
    filters.OR = [
      { title: { contains: searchParams.search, mode: "insensitive" } },
      { vendor: { contains: searchParams.search, mode: "insensitive" } },
      { notes: { contains: searchParams.search, mode: "insensitive" } }
    ];
  }
  if (searchParams.from || searchParams.to) {
    filters.date = {};
    if (searchParams.from) filters.date.gte = new Date(searchParams.from);
    if (searchParams.to) filters.date.lte = new Date(searchParams.to);
  }

  const orderBy = (() => {
    if (searchParams.sort === "oldest") return { date: "asc" };
    if (searchParams.sort === "amount") return { amount: "desc" };
    return { date: "desc" };
  })();

  const expenses = await prisma.expense.findMany({
    where: filters,
    include: { car: true, shop: true },
    orderBy
  });

  const reminders = await prisma.reminderRule.findMany({
    where: { userId: user.id, isActive: true },
    include: { car: true }
  });

  const latestOdometerByCar = await prisma.expense.groupBy({
    by: ["carId"],
    where: { userId: user.id, odometer: { not: null } },
    _max: { odometer: true }
  });
  const odometerMap = new Map(latestOdometerByCar.map((entry) => [entry.carId, entry._max.odometer]));

  const reminderRows = reminders.map((reminder) => {
    const currentOdometer = odometerMap.get(reminder.carId) ?? reminder.lastDoneOdometer;
    const status = getReminderStatus({
      method: reminder.method,
      nextDueDate: reminder.nextDueDate,
      nextDueOdometer: reminder.nextDueOdometer,
      currentOdometer: currentOdometer ?? null,
      notifyBeforeDays: reminder.notifyBeforeDays,
      notifyBeforeKm: reminder.notifyBeforeKm
    });
    return { reminder, status };
  });

  return (
    <div className="grid gap-8">
      <section className="card">
        <h2 className="text-xl font-semibold">Upcoming & Overdue Reminders</h2>
        <div className="mt-4 grid gap-3">
          {reminderRows.length === 0 && <p className="text-sm text-slate-500">No active reminders yet.</p>}
          {reminderRows.map(({ reminder, status }) => (
            <div key={reminder.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="font-medium">{reminder.title}</p>
                <p className="text-sm text-slate-500">
                  {reminder.car.nickname} • Next due {formatDate(reminder.nextDueDate)} {reminder.nextDueOdometer ? `• ${reminder.nextDueOdometer} km` : ""}
                </p>
              </div>
              <span className={`badge ${status === "overdue" ? "badge-overdue" : status === "dueSoon" ? "badge-warn" : "badge-ok"}`}>
                {status === "overdue" ? "Overdue" : status === "dueSoon" ? "Due Soon" : "OK"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Expenses</h2>
          <Link href="/expenses/new" className="rounded-md bg-slate-900 px-4 py-2 text-white">Add expense</Link>
        </div>
        <form className="mt-6 grid gap-3 md:grid-cols-4">
          <select name="car" defaultValue={searchParams.car ?? ""}>
            <option value="">All cars</option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>{car.nickname}</option>
            ))}
          </select>
          <input name="search" placeholder="Search title/vendor/notes" defaultValue={searchParams.search ?? ""} />
          <select name="category" defaultValue={searchParams.category ?? ""}>
            <option value="">All categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select name="payment" defaultValue={searchParams.payment ?? ""}>
            <option value="">All payments</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
          <input name="from" type="date" defaultValue={searchParams.from ?? ""} />
          <input name="to" type="date" defaultValue={searchParams.to ?? ""} />
          <select name="sort" defaultValue={searchParams.sort ?? ""}>
            <option value="">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="amount">Highest amount</option>
          </select>
          <button type="submit">Apply filters</button>
        </form>

        <div className="mt-6 grid gap-3">
          {expenses.length === 0 && <p className="text-sm text-slate-500">No expenses yet.</p>}
          {expenses.map((expense) => (
            <div key={expense.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{expense.title}</p>
                <p className="text-sm text-slate-500">
                  {expense.car.nickname} • {expense.category} • {formatDate(expense.date)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold">{formatCurrency(expense.amount.toString())}</span>
                <Link className="text-sm text-slate-600 underline" href={`/expenses/${expense.id}`}>View</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
