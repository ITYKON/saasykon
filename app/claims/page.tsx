"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useNotification } from "@/hooks/use-notification"

function ClaimPageContent(): JSX.Element {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const { error: notifyError, success: notifySuccess } = useNotification()
  
  const businessId = searchParams?.get("business_id") ?? null
  const businessName = searchParams?.get("business_name") ?? ""
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    if (!businessId) {
      notifyError({
        title: "ID manquant",
        description: "Veuillez accéder à cette page depuis la page de l'établissement."
      })
    }
  }, [businessId, notifyError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Vérification de l'ID de l'établissement
    if (!businessId) {
      notifyError({
        title: "ID manquant",
        description: "Veuillez réessayer en accédant à la page depuis la fiche de l'établissement."
      })
      return
    }
    
    // Vérification des champs requis
    if (!formData.full_name || !formData.email || !formData.phone) {
      notifyError({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires."
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

      // Afficher la notification de succès
      notifySuccess({
        title: "Demande envoyée",
        description: `Votre demande pour ${businessName} a été traitée avec succès.`,
        duration: 10000
      })

      // Réinitialiser le formulaire
      setFormData({
        full_name: "",
        email: "",
        phone: "",
      })
      
      // Passage à l'écran de succès
      setIsSubmitted(true)
    } catch (error: any) {
      notifyError({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la soumission du formulaire"
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

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Votre demande est confirmée !</h2>
            <p className="text-green-600 mt-2">Nous avons bien reçu votre demande de revendication.</p>
            <div className="mt-4 space-y-2 text-left bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Établissement :</span> {businessName}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Email de confirmation :</span> {formData.email}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Date :</span> {new Date().toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              <p className="text-sm text-gray-600">
                ✅ Votre demande a été transmise avec succès à notre équipe. Nous allons examiner votre demande et vous contacterons sous 24-48h pour la suite du processus.
              </p>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-3">
                <h4 className="font-medium text-blue-800 mb-1">Prochaines étapes :</h4>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  <li>Vérification de votre demande par notre équipe</li>
                  <li>Validation de votre identité</li>
                  <li>Accès à votre espace professionnel</li>
                </ol>
              </div>
              <div className="pt-2">
                <Link href="/">
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Vous pouvez suivre l'avancement de votre demande depuis votre espace personnel.
              </p>
            </div>
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
              <div className="space-y-2">
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
