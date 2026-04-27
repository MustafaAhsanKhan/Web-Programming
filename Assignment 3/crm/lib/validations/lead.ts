import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  propertyInterest: z.string().optional(),
  budget: z.number().min(0, "Budget cannot be negative"),
  source: z.enum(["facebook", "website", "walk-in", "referral", "other"]).optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
});

export const updateLeadAdminSchema = createLeadSchema.partial().extend({
  status: z.enum(["New", "Contacted", "In Progress", "Closed"]).optional(),
});

export const updateLeadAgentSchema = z.object({
  status: z.enum(["New", "Contacted", "In Progress", "Closed"]).optional(),
  notes: z.string().optional(),
  followUpDate: z.string().optional().nullable(),
});
