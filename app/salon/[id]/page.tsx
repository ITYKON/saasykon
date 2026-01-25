"use client"

import { useMemo } from "react"
import { extractSalonId } from "@/lib/salon-slug"
import SalonPublicPage from "@/components/salon-public-page"

export default function SalonPage({ params }: { params: { id: string } }) {
  const businessId = useMemo(() => extractSalonId(params.id), [params.id])
  
  return <SalonPublicPage salonId={businessId} />
}
