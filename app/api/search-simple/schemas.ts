import { z } from "zod";

export const searchSimpleSchema = z.object({
  q: z.string().optional().default(""),
  location: z.string().optional().default(""),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});
