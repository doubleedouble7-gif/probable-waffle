import nodemailer from "nodemailer";
import { prisma } from "../lib/db";
import { getReminderStatus } from "../lib/reminders";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  throw new Error("Missing SMTP configuration in environment");
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

async function main() {
  const reminders = await prisma.reminderRule.findMany({
    where: {
      isActive: true,
      type: { in: ["ROADTAX", "INSURANCE"] }
    },
    include: {
      user: true,
      car: true
    }
  });

  const expenses = await prisma.expense.groupBy({
    by: ["carId"],
    where: { odometer: { not: null } },
    _max: { odometer: true }
  });
  const odometerMap = new Map(expenses.map((entry) => [entry.carId, entry._max.odometer]));

  const remindersByUser = new Map<string, typeof reminders>();
  for (const reminder of reminders) {
    const currentOdometer = odometerMap.get(reminder.carId) ?? reminder.lastDoneOdometer;
    const status = getReminderStatus({
      method: reminder.method,
      nextDueDate: reminder.nextDueDate,
      nextDueOdometer: reminder.nextDueOdometer,
      currentOdometer: currentOdometer ?? null,
      notifyBeforeDays: reminder.notifyBeforeDays,
      notifyBeforeKm: reminder.notifyBeforeKm
    });

    if (status === "ok") continue;

    const list = remindersByUser.get(reminder.userId) ?? [];
    list.push(reminder);
    remindersByUser.set(reminder.userId, list);
  }

  for (const [userId, userReminders] of remindersByUser.entries()) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;

    const lines = userReminders.map((reminder) => {
      return `• ${reminder.title} (${reminder.type}) for ${reminder.car.nickname} - next due ${reminder.nextDueDate?.toISOString().slice(0, 10) ?? "N/A"}`;
    });

    const message = `Hello ${user.name ?? "there"},\n\nHere are your upcoming/overdue reminders:\n${lines.join("\n")}\n\nVisit your dashboard for details.`;

    await transporter.sendMail({
      from: SMTP_FROM,
      to: user.email,
      subject: "Car Spend MY: Roadtax & Insurance reminders",
      text: message
    });

    console.log(`Sent reminder email to ${user.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
