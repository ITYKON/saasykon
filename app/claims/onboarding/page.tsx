"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Upload, Camera, CheckCircle2, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ClaimOnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [claimData, setClaimData] = useState<any>(null)
  const [step, setStep] = useState<"welcome" | "password" | "documents" | "complete">("welcome")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rcNumber, setRcNumber] = useState("")
  const [rcDocumentUrl, setRcDocumentUrl] = useState("")
  const [idDocumentFrontUrl, setIdDocumentFrontUrl] = useState("")
  const [idDocumentBackUrl, setIdDocumentBackUrl] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)

  const [cameraFor, setCameraFor] = useState<"rc_doc" | "id_front" | "id_back" | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!token) {
      toast({
        title: "Token manquant",
        description: "Le lien de revendication est invalide.",
        variant: "destructive",
      })
      router.push("/claims")
      return
    }

    // Vérifier si nous avons déjà des données de revendication dans l'URL
    const claimDataParam = searchParams.get('claimData')
    if (claimDataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(claimDataParam))
        setClaimData(data.claim)
        setStep("password") // Toujours afficher le formulaire de mot de passe en premier
        setLoading(false)
      } catch (error) {
        console.error("Erreur lors du parsing des données de revendication:", error)
        fetchClaimData()
      }
    } else {
      fetchClaimData()
    }
  }, [token])

  const fetchClaimData = async () => {
    try {
      // Ajout d'un en-tête pour éviter les boucles de redirection
      const response = await fetch(`/api/claims/verify?token=${encodeURIComponent(token!)}`, {
        headers: {
          'x-from-redirect': 'true'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Erreur lors de la vérification du token")
      }
      
      const data = await response.json()
      
      if (!data || !data.claim) {
        throw new Error("Données de revendication invalides")
      }

      setClaimData(data.claim)
      
      // Gestion du flux en fonction du statut de la revendication et du mot de passe
      if (data.claim.status === 'approved') {
        // Si la revendication est déjà approuvée, on vérifie si l'utilisateur a un mot de passe
        if (data.claim.user.has_password) {
          if (data.claim.documents_submitted) {
            // Tout est complété, on montre l'écran de complétion
            setStep("complete")
          } else {
            // Documents manquants, on passe à l'étape des documents
            setStep("documents")
          }
        } else {
          // Pas de mot de passe, on commence par là
          setStep("password")
        }
      } else {
        // Pour les autres statuts, on suit le flux normal
        if (data.claim.user.has_password) {
          setStep("documents")
        } else {
          setStep("password")
        }
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données",
        variant: "destructive",
      })
      router.push("/claims")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File, type: "rc_doc" | "id_front" | "id_back") => {
    setUploading(type)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch("/api/uploads/onboarding", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      const url = data?.url

      if (type === "rc_doc") {
        setRcDocumentUrl(url)
      } else if (type === "id_front") {
        setIdDocumentFrontUrl(url)
      } else if (type === "id_back") {
        setIdDocumentBackUrl(url)
      }

      toast({
        title: "Document téléversé",
        description: "Votre document a été enregistré avec succès.",
      })
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de téléverser le document",
        variant: "destructive",
      })
    } finally {
      setUploading(null)
    }
  }

  const startCamera = async (type: "rc_doc" | "id_front" | "id_back") => {
    setCameraFor(type)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'accéder à la caméra",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraFor(null)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !cameraFor) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" })
          await handleUpload(file, cameraFor)
          stopCamera()
        }
      }, "image/jpeg", 0.9)
    }
  }

  const handlePasswordSubmit = async () => {
    if (password.length < 8) {
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/claims/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: password,
          complete_now: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement du mot de passe")
      }

      toast({
        title: "Mot de passe enregistré",
        description: "Votre mot de passe a été enregistré avec succès.",
      })
      
      setStep("documents")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le mot de passe",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (completeNow: boolean) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/claims/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          // Ne pas renvoyer le mot de passe car il a déjà été enregistré
          rc_number: rcNumber,
          rc_document_url: rcDocumentUrl,
          id_document_front_url: idDocumentFrontUrl,
          id_document_back_url: idDocumentBackUrl,
          complete_now: completeNow,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la soumission")
      }

      if (data.ok && completeNow && data.has_all_documents) {
        // Redirect to dashboard
        toast({
          title: "Documents soumis",
          description: "Vos documents sont en cours de vérification.",
        })
        router.push("/pro/dashboard")
      } else if (data.ok && !completeNow) {
        // Save for later
        toast({
          title: "Documents enregistrés",
          description: "Vous pouvez compléter plus tard depuis votre tableau de bord.",
        })
        router.push("/pro/dashboard")
      } else {
        setStep("complete")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de soumettre les documents",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  if (!claimData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Données introuvables</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasAllDocuments = rcDocumentUrl && idDocumentFrontUrl && idDocumentBackUrl
  const daysRemaining = claimData.days_remaining || 0

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bienvenue {claimData.full_name} !</h1>
          <p className="mt-2 text-gray-600">
            Complétez votre revendication pour l'établissement <strong>{claimData.business.public_name}</strong>
          </p>
          {daysRemaining > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="inline h-4 w-4 mr-2" />
                Il vous reste <strong>{daysRemaining} jour{daysRemaining > 1 ? "s" : ""}</strong> pour soumettre vos documents
              </p>
            </div>
          )}
        </div>

        {/* Password Step */}
        {step === "password" && (
          <Card>
            <CardHeader>
              <CardTitle>Créer votre mot de passe</CardTitle>
              <CardDescription>Choisissez un mot de passe sécurisé pour votre compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                />
              </div>
              <Button onClick={handlePasswordSubmit} className="w-full" disabled={!password || !confirmPassword}>
                Continuer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documents Step */}
        {step === "documents" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Téléverser vos documents</CardTitle>
                <CardDescription>
                  Pour vérifier votre identité et votre établissement, nous avons besoin de ces documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pièce d'identité recto */}
                <div>
                  <Label>Pièce d'identité (Recto) *</Label>
                  <div className="mt-2 flex gap-4">
                    {idDocumentFrontUrl ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <Image src={idDocumentFrontUrl} alt="Recto" fill className="object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => setIdDocumentFrontUrl("")}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(file, "id_front")
                          }}
                          disabled={uploading === "id_front"}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startCamera("id_front")}
                          disabled={!!cameraFor}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Prendre une photo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pièce d'identité verso */}
                <div>
                  <Label>Pièce d'identité (Verso) *</Label>
                  <div className="mt-2 flex gap-4">
                    {idDocumentBackUrl ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                        <Image src={idDocumentBackUrl} alt="Verso" fill className="object-cover" />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={() => setIdDocumentBackUrl("")}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload(file, "id_back")
                          }}
                          disabled={uploading === "id_back"}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startCamera("id_back")}
                          disabled={!!cameraFor}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Prendre une photo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registre de commerce */}
                <div>
                  <Label>Registre de commerce *</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      type="text"
                      placeholder="Numéro de registre de commerce"
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                    />
                    <div className="flex gap-4">
                      {rcDocumentUrl ? (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <Image src={rcDocumentUrl} alt="RC" fill className="object-cover" />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => setRcDocumentUrl("")}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(file, "rc_doc")
                            }}
                            disabled={uploading === "rc_doc"}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startCamera("rc_doc")}
                            disabled={!!cameraFor}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Prendre une photo
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Camera view */}
                {cameraFor && (
                  <Card>
                    <CardContent className="pt-6">
                      <video ref={videoRef} autoPlay className="w-full rounded-lg" />
                      <div className="mt-4 flex gap-2">
                        <Button onClick={capturePhoto} className="flex-1">
                          Prendre la photo
                        </Button>
                        <Button variant="outline" onClick={stopCamera}>
                          Annuler
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={() => handleComplete(false)}
                    variant="outline"
                    disabled={submitting}
                    className="flex-1"
                  >
                    Enregistrer pour plus tard
                  </Button>
                  <Button
                    onClick={() => handleComplete(true)}
                    disabled={!hasAllDocuments || submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      "Terminer maintenant"
                    )}
                  </Button>
                </div>

                {!hasAllDocuments && (
                  <p className="text-sm text-gray-500 text-center">
                    * Tous les documents sont requis pour terminer la revendication
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && (
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Documents soumis !</h2>
              <p className="text-gray-600 mb-6">
                Vos documents sont en cours de vérification. Vous serez notifié une fois la vérification terminée.
              </p>
              <Button onClick={() => router.push("/pro/dashboard")}>
                Aller au tableau de bord
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

