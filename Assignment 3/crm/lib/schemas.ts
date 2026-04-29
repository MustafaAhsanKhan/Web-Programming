import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "agent"]).optional().default("agent"),
});

export const leadCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone number is required"),
  propertyInterest: z.string().optional(),
  budget: z.number().min(0, "Budget cannot be negative"),
  score: z.number().min(1).max(3),
  source: z.enum(["facebook", "website", "walk-in", "referral", "other"]).optional(),
});

export const leadUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  propertyInterest: z.string().optional(),
  budget: z.number().min(0).optional(),
  score: z.number().min(1).max(3).optional(),
  status: z.enum(["New", "Contacted", "In Progress", "Closed"]).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().datetime().or(z.date()).optional(),
  source: z.enum(["facebook", "website", "walk-in", "referral", "other"]).optional(),
});

export const leadAssignSchema = z.object({
  agentId: z.string().nullable().optional(),
});

export const leadFollowupSchema = z.object({
  followUpDate: z.string().min(1, "Follow-up date is required"),
});
