import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Nom trop court"),
  // Optional explicit code; if not provided we derive it from name
  code: z.string().min(2).optional(),
  // Array of permission codes (must correspond to permissions.code)
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  id: z.number(),
  name: z.string().min(2).optional(),
  code: z.string().min(2).optional(),
  permissions: z.array(z.string()).optional(),
});
