// Note: generateUniqueSlug has been moved to lib/salon-slug-server.ts to avoid Prisma in client components

const ASCII_ACCENT_REGEX = /[\u0300-\u036f]/g
const NON_ALNUM_REGEX = /[^a-z0-9]+/g
const HYPHEN_COLLAPSE_REGEX = /-+/g

// Liste de mots réservés pour éviter les conflits avec les routes existantes
export const RESERVED_SLUGS = [
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


