import { z } from "zod";

export const salonSchema = z.object({
  legal_name: z.string().min(2, "Le nom légal est requis (2 caractères min)"),
  public_name: z.string().min(2, "Le nom public est requis (2 caractères min)"),
  description: z.string().nullable().optional(),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  website: z.string().nullable().optional(),
  vat_number: z.string().nullable().optional(),
  category_code: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  cover_url: z.string().nullable().optional(),
  location: z.string().min(1, "La wilaya est requise"), 
  status: z.string().nullable().optional(),
});
