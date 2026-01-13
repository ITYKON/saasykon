import { prisma } from "@/lib/prisma"

const ASCII_ACCENT_REGEX = /[\u0300-\u036f]/g
const NON_ALNUM_REGEX = /[^a-z0-9]+/g
const HYPHEN_COLLAPSE_REGEX = /-+/g

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

export function slugifySalonName(name: string): string {
  if (!name) return ""
  return name
    .normalize("NFD")
    .replace(ASCII_ACCENT_REGEX, "")
    .toLowerCase()
    .replace(NON_ALNUM_REGEX, "-")
    .replace(HYPHEN_COLLAPSE_REGEX, "-")
    .replace(/^-|-$/g, "")
}

export function buildBaseSlug(name: string | null | undefined, city?: string | null): string {
  const nameSlug = slugifySalonName(name ?? "")
  const citySlug = slugifySalonName(city ?? "")
  
  if (!nameSlug) return "salon" // Fallback

  const segments = [nameSlug, citySlug].filter((segment, index, arr) => segment && arr.indexOf(segment) === index)
  return segments.join("-")
}

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

// Pour compatibilité backward si nécessaire, mais on essaie de passer par la DB maintenant
export function extractSalonId(slugOrId: string): string {
  // Cette fonction n'est plus vraiment pertinente pour les slugs DB,
  // mais on la garde pour ne pas casser le code existant qui attendait 'slug--UUID'
  if (!slugOrId) return slugOrId
  if (slugOrId.includes("--")) {
    const parts = slugOrId.split("--")
    return parts[parts.length - 1] || slugOrId
  }
  return slugOrId
}

// Fonction utilitaire pour migrer ou récupérer le slug
export function buildSalonSlug(name: string, id: string, city?: string | null): string {
    // Cette fonction est utilisée par le frontend actuellement pour générer les liens
    // Dans le futur, on devrait utiliser directement le slug de la DB passé dans l'objet salon
    // Pour l'instant on retourne l'ID si on ne peut pas faire mieux, ou l'ancien format
    // Mais l'idéal est de ne plus l'utiliser.
    return id // On retourne l'ID par défaut si pas de slug dispo dans le contexte appelant
}


