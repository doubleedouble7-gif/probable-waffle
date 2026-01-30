export const EXPENSE_CATEGORIES = [
  "SERVICE",
  "TYRE",
  "BRAKE",
  "BATTERY",
  "ACCESSORIES",
  "REPAIR",
  "PETROL",
  "TOL",
  "PARKING",
  "ROADTAX",
  "INSURANCE",
  "WASH_DETAILING",
  "OTHER"
] as const;

export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "EWALLET"] as const;

export const REMINDER_TYPES = ["SERVICE", "BATTERY", "ROADTAX", "INSURANCE"] as const;

export const REMINDER_METHODS = ["DATE", "ODOMETER", "BOTH"] as const;
