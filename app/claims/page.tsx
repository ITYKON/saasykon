"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import Link from "next/link"

function ClaimPageContent() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  
  const businessId = searchParams.get("business_id")
  const businessName = searchParams.get("business_name") || ""
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (!businessId) {
      toast({
        title: "Erreur",
        description: "ID de l'établissement manquant. Veuillez accéder à cette page depuis la page de l'établissement.",
        variant: "destructive",
      })
    }
  }, [businessId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!businessId) {
      toast({
        title: "Erreur",
        description: "ID de l'établissement manquant",
        variant: "destructive",
      })
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          business_id: businessId,
          business_name: businessName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la revendication")
      }

      toast({
        title: "Demande créée avec succès",
        description: "Un email de confirmation a été envoyé à votre adresse email.",
      })

      // Reset form
      setFormData({
        full_name: "",
        email: "",
        phone: "",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4 font-semibold">ID de l'établissement manquant</p>
            <p className="text-sm text-gray-600 mb-4">
              Veuillez accéder à cette page depuis la page de l'établissement que vous souhaitez revendiquer.
            </p>
            <Link href="/">
              <Button variant="outline">Retour à l'accueil</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Revendiquer mon établissement
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Remplissez le formulaire pour revendiquer votre établissement sur YOKA
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Formulaire de revendication</CardTitle>
            <CardDescription>
              Vous recevrez un email avec un lien pour compléter votre demande
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
              {businessId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-blue-900 font-semibold">Établissement à revendiquer</Label>
                  <p className="text-sm text-blue-700 mt-1">{businessName || businessId}</p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer la demande"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  )
}
