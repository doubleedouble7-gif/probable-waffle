import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1).max(80).optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const carSchema = z.object({
  nickname: z.string().min(1),
  plateNumber: z.string().optional().or(z.literal("")),
  make: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  year: z.string().optional().or(z.literal(""))
});

export const shopSchema = z.object({
  name: z.string().min(1),
  categoryTags: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  lat: z.string().optional().or(z.literal("")),
  lng: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal(""))
});

export const expenseSchema = z.object({
  carId: z.string().min(1),
  date: z.string().min(1),
  category: z.string().min(1),
  customCategory: z.string().optional().or(z.literal("")),
  title: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  amount: z.string().min(1),
  odometer: z.string().optional().or(z.literal("")),
  vendor: z.string().optional().or(z.literal("")),
  paymentMethod: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  shopId: z.string().optional().or(z.literal(""))
});

export const reminderSchema = z.object({
  carId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  method: z.string().min(1),
  intervalDays: z.string().optional().or(z.literal("")),
  intervalKm: z.string().optional().or(z.literal("")),
  lastDoneDate: z.string().optional().or(z.literal("")),
  lastDoneOdometer: z.string().optional().or(z.literal("")),
  notifyBeforeDays: z.string().optional().or(z.literal("")),
  notifyBeforeKm: z.string().optional().or(z.literal("")),
  provider: z.string().optional().or(z.literal("")),
  policyNumber: z.string().optional().or(z.literal("")),
  estimatedCost: z.string().optional().or(z.literal("")),
  renewalLink: z.string().optional().or(z.literal("")),
  isActive: z.string().optional().or(z.literal(""))
});
