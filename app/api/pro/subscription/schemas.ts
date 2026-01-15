import { z } from "zod";

export const createSubscriptionSchema = z.object({
  plan_id: z.number().int().positive(),
});

export const updateSubscriptionSchema = z.object({
  action: z.enum(["cancel", "resume"]),
});
