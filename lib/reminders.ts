import { addDays, differenceInCalendarDays } from "date-fns";
import { ReminderMethod } from "@prisma/client";

export function computeNextDueDate(lastDoneDate: Date | null, intervalDays: number | null) {
  if (!lastDoneDate || !intervalDays) return null;
  return addDays(lastDoneDate, intervalDays);
}

export function computeNextDueOdometer(lastDoneOdometer: number | null, intervalKm: number | null) {
  if (!lastDoneOdometer || !intervalKm) return null;
  return lastDoneOdometer + intervalKm;
}

export function getReminderStatus({
  method,
  nextDueDate,
  nextDueOdometer,
  currentOdometer,
  notifyBeforeDays,
  notifyBeforeKm
}: {
  method: ReminderMethod;
  nextDueDate: Date | null;
  nextDueOdometer: number | null;
  currentOdometer: number | null;
  notifyBeforeDays: number;
  notifyBeforeKm: number;
}) {
  let overdue = false;
  let dueSoon = false;

  if (method === "DATE" || method === "BOTH") {
    if (nextDueDate) {
      const daysLeft = differenceInCalendarDays(nextDueDate, new Date());
      if (daysLeft < 0) {
        overdue = true;
      } else if (daysLeft <= notifyBeforeDays) {
        dueSoon = true;
      }
    }
  }

  if (method === "ODOMETER" || method === "BOTH") {
    if (nextDueOdometer && currentOdometer) {
      const kmLeft = nextDueOdometer - currentOdometer;
      if (kmLeft < 0) {
        overdue = true;
      } else if (kmLeft <= notifyBeforeKm) {
        dueSoon = true;
      }
    }
  }

  if (overdue) return "overdue";
  if (dueSoon) return "dueSoon";
  return "ok";
}
