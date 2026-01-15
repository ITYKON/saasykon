import { z } from "zod";

export const verificationSchema = z.object({
  rc_number: z.string().nullable().optional(),
  rc_document_url: z.string().url().nullable().optional(),
  id_document_front_url: z.string().url().nullable().optional(),
  id_document_back_url: z.string().url().nullable().optional(),
});
