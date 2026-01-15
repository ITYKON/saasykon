import { z } from "zod";

export const assignSchema = z.object({
  email: z.string().email(),
  roleCode: z.string().min(2),
  business_id: z.string().uuid().optional(),
});

export const unassignSchema = z.object({
  email: z.string().email(),
  roleCode: z.string().min(2),
  business_id: z.string().uuid(),
});
