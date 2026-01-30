import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../lib/db";
import { requireUser } from "../../lib/require-user";
import { reminderSchema } from "../../lib/validators";
import { REMINDER_METHODS, REMINDER_TYPES } from "../../lib/constants";
import { computeNextDueDate, computeNextDueOdometer, getReminderStatus } from "../../lib/reminders";
import { formatDate, formatCurrency, parseNumber } from "../../lib/format";

const presets = [
  { title: "Engine oil", type: "SERVICE", method: "BOTH", intervalDays: 180, intervalKm: 5000 },
  { title: "Battery", type: "BATTERY", method: "DATE", intervalDays: 730 },
  { title: "Roadtax renewal", type: "ROADTAX", method: "DATE", intervalDays: 365, notifyBeforeDays: 30 },
  { title: "Insurance renewal", type: "INSURANCE", method: "DATE", intervalDays: 365, notifyBeforeDays: 30 }
];

export default async function RemindersPage({ searchParams }: { searchParams: { edit?: string; error?: string } }) {
  const user = await requireUser();
  const cars = await prisma.car.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const reminders = await prisma.reminderRule.findMany({ where: { userId: user.id }, include: { car: true }, orderBy: { createdAt: "desc" } });

  const latestOdometerByCar = await prisma.expense.groupBy({
    by: ["carId"],
    where: { userId: user.id, odometer: { not: null } },
    _max: { odometer: true }
  });
  const odometerMap = new Map(latestOdometerByCar.map((entry) => [entry.carId, entry._max.odometer]));

  const editReminder = searchParams.edit
    ? reminders.find((reminder) => reminder.id === searchParams.edit)
    : null;

  return (
    <div className="grid gap-8">
      <section className="card">
        <h2 className="text-xl font-semibold">Create reminder</h2>
        {searchParams.error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {searchParams.error}
          </p>
        )}
        <form className="mt-6 grid gap-4 md:grid-cols-2" action={saveReminderAction}>
          <input type="hidden" name="reminderId" value={editReminder?.id ?? ""} />
          <div className="md:col-span-2">
            <label htmlFor="carId">Car *</label>
            <select id="carId" name="carId" required defaultValue={editReminder?.carId ?? cars[0]?.id}>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>{car.nickname}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="type">Type *</label>
            <select id="type" name="type" required defaultValue={editReminder?.type ?? "SERVICE"}>
              {REMINDER_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="method">Method *</label>
            <select id="method" name="method" required defaultValue={editReminder?.method ?? "DATE"}>
              {REMINDER_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="title">Title *</label>
            <input id="title" name="title" required defaultValue={editReminder?.title ?? ""} />
          </div>
          <div>
            <label htmlFor="intervalDays">Interval days</label>
            <input id="intervalDays" name="intervalDays" type="number" defaultValue={editReminder?.intervalDays ?? ""} />
          </div>
          <div>
            <label htmlFor="intervalKm">Interval km</label>
            <input id="intervalKm" name="intervalKm" type="number" defaultValue={editReminder?.intervalKm ?? ""} />
          </div>
          <div>
            <label htmlFor="lastDoneDate">Last done date</label>
            <input id="lastDoneDate" name="lastDoneDate" type="date" defaultValue={editReminder?.lastDoneDate ? editReminder.lastDoneDate.toISOString().slice(0, 10) : ""} />
          </div>
          <div>
            <label htmlFor="lastDoneOdometer">Last done odometer</label>
            <input id="lastDoneOdometer" name="lastDoneOdometer" type="number" defaultValue={editReminder?.lastDoneOdometer ?? ""} />
          </div>
          <div>
            <label htmlFor="notifyBeforeDays">Notify before days</label>
            <input id="notifyBeforeDays" name="notifyBeforeDays" type="number" defaultValue={editReminder?.notifyBeforeDays ?? 7} />
          </div>
          <div>
            <label htmlFor="notifyBeforeKm">Notify before km</label>
            <input id="notifyBeforeKm" name="notifyBeforeKm" type="number" defaultValue={editReminder?.notifyBeforeKm ?? 300} />
          </div>
          <div>
            <label htmlFor="provider">Provider</label>
            <input id="provider" name="provider" defaultValue={editReminder?.provider ?? ""} />
          </div>
          <div>
            <label htmlFor="policyNumber">Policy number</label>
            <input id="policyNumber" name="policyNumber" defaultValue={editReminder?.policyNumber ?? ""} />
          </div>
          <div>
            <label htmlFor="estimatedCost">Estimated cost (RM)</label>
            <input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={editReminder?.estimatedCost?.toString() ?? ""} />
          </div>
          <div>
            <label htmlFor="renewalLink">Renewal link</label>
            <input id="renewalLink" name="renewalLink" defaultValue={editReminder?.renewalLink ?? ""} />
          </div>
          <div>
            <label htmlFor="isActive">Active</label>
            <select id="isActive" name="isActive" defaultValue={editReminder?.isActive ? "true" : "false"}>
              <option value="true">Active</option>
              <option value="false">Paused</option>
            </select>
          </div>
          <div className="md:col-span-2 flex gap-3">
            <button type="submit">{editReminder ? "Update" : "Create"} reminder</button>
            {editReminder && (
              <Link href="/reminders" className="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel edit</Link>
            )}
          </div>
        </form>
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <h3 className="font-semibold">Presets</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            {presets.map((preset) => (
              <p key={preset.title}>{preset.title}: {preset.intervalKm ?? ""} km / {preset.intervalDays ?? ""} days</p>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold">Your reminders</h2>
        <div className="mt-4 grid gap-3">
          {reminders.length === 0 && <p className="text-sm text-slate-500">No reminders yet.</p>}
          {reminders.map((reminder) => {
            const currentOdometer = odometerMap.get(reminder.carId) ?? reminder.lastDoneOdometer;
            const status = getReminderStatus({
              method: reminder.method,
              nextDueDate: reminder.nextDueDate,
              nextDueOdometer: reminder.nextDueOdometer,
              currentOdometer: currentOdometer ?? null,
              notifyBeforeDays: reminder.notifyBeforeDays,
              notifyBeforeKm: reminder.notifyBeforeKm
            });
            return (
              <div key={reminder.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-slate-500">{reminder.car.nickname} • {reminder.type} • {reminder.method}</p>
                  </div>
                  <span className={`badge ${status === "overdue" ? "badge-overdue" : status === "dueSoon" ? "badge-warn" : "badge-ok"}`}>
                    {status === "overdue" ? "Overdue" : status === "dueSoon" ? "Due Soon" : "OK"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <p>Next due date: {formatDate(reminder.nextDueDate)}</p>
                  <p>Next due odometer: {reminder.nextDueOdometer ?? "-"} km</p>
                  <p>Estimated cost: {reminder.estimatedCost ? formatCurrency(reminder.estimatedCost.toString()) : "-"}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={markDoneAction}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <button type="submit">Mark done</button>
                  </form>
                  <Link href={`/reminders?edit=${reminder.id}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm">Edit</Link>
                  <form action={deleteReminderAction}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <button type="submit" className="bg-rose-600 hover:bg-rose-500">Delete</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

async function saveReminderAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const payload = Object.fromEntries(formData.entries());
  const parsed = reminderSchema.safeParse(payload);
  if (!parsed.success) {
    redirect(`/reminders?error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }
  const data = parsed.data;

  const intervalDays = data.intervalDays ? Number(data.intervalDays) : null;
  const intervalKm = data.intervalKm ? Number(data.intervalKm) : null;
  const lastDoneDate = data.lastDoneDate ? new Date(data.lastDoneDate) : null;
  const lastDoneOdometer = data.lastDoneOdometer ? Number(data.lastDoneOdometer) : null;
  const nextDueDate = computeNextDueDate(lastDoneDate, intervalDays);
  const nextDueOdometer = computeNextDueOdometer(lastDoneOdometer, intervalKm);
  const reminderId = String(formData.get("reminderId") || "");

  const baseData = {
    userId: user.id,
    carId: data.carId,
    type: data.type as any,
    title: data.title,
    method: data.method as any,
    intervalDays,
    intervalKm,
    lastDoneDate,
    lastDoneOdometer,
    nextDueDate,
    nextDueOdometer,
    notifyBeforeDays: data.notifyBeforeDays ? Number(data.notifyBeforeDays) : 7,
    notifyBeforeKm: data.notifyBeforeKm ? Number(data.notifyBeforeKm) : 300,
    provider: data.provider || null,
    policyNumber: data.policyNumber || null,
    estimatedCost: parseNumber(data.estimatedCost) ?? null,
    renewalLink: data.renewalLink || null,
    isActive: data.isActive === "false" ? false : true
  };

  if (reminderId) {
    await prisma.reminderRule.updateMany({ where: { id: reminderId, userId: user.id }, data: baseData });
  } else {
    await prisma.reminderRule.create({ data: baseData });
  }

  redirect("/reminders");
}

async function markDoneAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId"));
  const reminder = await prisma.reminderRule.findFirst({ where: { id: reminderId, userId: user.id } });
  if (!reminder) {
    redirect("/reminders");
  }

  const latestOdometer = await prisma.expense.findFirst({
    where: { userId: user.id, carId: reminder.carId, odometer: { not: null } },
    orderBy: { odometer: "desc" }
  });
  const lastDoneDate = new Date();
  const lastDoneOdometer = reminder.method === "ODOMETER" || reminder.method === "BOTH"
    ? (latestOdometer?.odometer ?? reminder.lastDoneOdometer)
    : reminder.lastDoneOdometer;

  const nextDueDate = computeNextDueDate(lastDoneDate, reminder.intervalDays);
  const nextDueOdometer = computeNextDueOdometer(lastDoneOdometer ?? null, reminder.intervalKm);

  await prisma.reminderRule.updateMany({
    where: { id: reminderId, userId: user.id },
    data: {
      lastDoneDate,
      lastDoneOdometer: lastDoneOdometer ?? null,
      nextDueDate,
      nextDueOdometer
    }
  });

  redirect("/reminders");
}

async function deleteReminderAction(formData: FormData) {
  "use server";
  const user = await requireUser();
  const reminderId = String(formData.get("reminderId"));
  await prisma.reminderRule.deleteMany({ where: { id: reminderId, userId: user.id } });
  redirect("/reminders");
}
