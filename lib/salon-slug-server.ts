import { prisma } from "./prisma"
import { buildBaseSlug } from "./salon-slug"

// Liste de mots réservés pour éviter les conflits avec les routes existantes
const RESERVED_SLUGS = [
  "admin",
  "api",
  "auth",
  "login",
  "register",
  "onboarding",
  "dashboard",
  "settings",
  "profile",
  "search",
  "salon", // Legacy route
  "pro",
  "professionnels",
  "about",
  "a-propos",
  "contact",
  "offres",
  "conditions",
  "privacy",
  "mentions-legales",
  "sitemap",
  "robots",
  "claim",
  "claims",
  "public",
  "assets",
  "images",
  "favicon",
  "manifest",
  "_next",
]

/**
 * Génère un slug unique pour un salon.
 * Vérifie l'existence dans la DB et incrémente si nécessaire (-2, -3, etc.).
 * Vérifie aussi les slugs réservés.
 */
export async function generateUniqueSlug(name: string, city: string | null | undefined, businessId?: string): Promise<string> {
  let baseSlug = buildBaseSlug(name, city)
  let candidateSlug = baseSlug

  // Si le slug est réservé, on ajoute un suffixe "salon"
  if (RESERVED_SLUGS.includes(candidateSlug)) {
    candidateSlug = `${candidateSlug}-salon`
  }

  // Vérification de base
  if (candidateSlug.length < 3) {
    candidateSlug = `${candidateSlug}-kamiz` // Fallback si trop court
  }

  let attempt = 1
  const maxAttempts = 100 // Safety break

  while (attempt <= maxAttempts) {
    const existing = await prisma.businesses.findUnique({
      where: { slug: candidateSlug },
      select: { id: true }
    })

    // Si pas de collision, ou si c'est le même business (mise à jour), c'est bon
    if (!existing || (businessId && existing.id === businessId)) {
      return candidateSlug
    }

    // Collision : on incrémente
    attempt++
    candidateSlug = `${baseSlug}-${attempt}`
  }

  // Fallback ultime avec timestamp si trop de collisions
  return `${baseSlug}-${Date.now()}`
}
