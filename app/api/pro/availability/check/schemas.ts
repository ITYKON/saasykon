import { z } from "zod";

export const availabilitySchema = z.object({
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  employee_id: z.string().uuid().nullable().optional(),
});
