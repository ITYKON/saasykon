import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import SalonPublicPage from "@/components/salon-public-page"

// Force duplicate dynamic behavior for this page
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { slug: string } }) {
  // 1. Try to find business by slug
  const business = await prisma.businesses.findUnique({
    where: { slug: params.slug },
    select: { id: true }
  })

  // 2. If found, render the client component with the ID
  if (business) {
    return <SalonPublicPage salonId={business.id} />
  }

  // 3. Optional: Fallback for UUIDs passed as slugs (legacy support)
  // If the slug looks like a UUID, we could check it. 
  // But strictly speaking, the user wanted slugs.
  // If we want to support existing UUID links hitting this route (if any):
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(params.slug)) {
      const businessById = await prisma.businesses.findUnique({
          where: { id: params.slug },
          select: { id: true }
      });
      if (businessById) {
          return <SalonPublicPage salonId={businessById.id} />
      }
  }

  // 4. Not found
  notFound()
}
