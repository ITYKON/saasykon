const ASCII_ACCENT_REGEX = /[\u0300-\u036f]/g
const NON_ALNUM_REGEX = /[^a-z0-9]+/g
const HYPHEN_COLLAPSE_REGEX = /-+/g

const SLUG_SEPARATOR = "--"

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

export function buildSalonSlug(name: string | null | undefined, id: string, city?: string | null): string {
  const nameSlug = slugifySalonName(name ?? "")
  const citySlug = slugifySalonName(city ?? "")
  const segments = [nameSlug, citySlug].filter((segment, index, arr) => segment && arr.indexOf(segment) === index)
  const base = segments.join("-")
  if (!base) return id
  return `${base}${SLUG_SEPARATOR}${id}`
}

export function extractSalonId(slugOrId: string): string {
  if (!slugOrId) return slugOrId
  if (slugOrId.includes(SLUG_SEPARATOR)) {
    const parts = slugOrId.split(SLUG_SEPARATOR)
    const last = parts[parts.length - 1]
    return last || slugOrId
  }
  return slugOrId
}

