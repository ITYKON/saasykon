"use client"

import { useState, useTransition, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token") || ""
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null)

  // Vérifier la validité du token au chargement de la page
  useEffect(() => {
    if (!token) {
      setError("Lien de réinitialisation invalide ou expiré")
      setIsTokenValid(false)
      return
    }

    const verifyToken = async () => {
      try {
        // Inclure les credentials pour s'assurer que les cookies sont envoyés
        const res = await fetch(`/api/auth/password/verify-token?token=${encodeURIComponent(token)}`, {
          credentials: 'include' // Important pour envoyer les cookies
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || "Token invalide ou expiré")
        }
        
        setIsTokenValid(true)
      } catch (err) {
        console.error('Erreur lors de la vérification du token:', err)
        setError(err instanceof Error ? err.message : "Le lien de réinitialisation est invalide ou a expiré")
        setIsTokenValid(false)
      }
    }

    // Déconnecter l'utilisateur temporairement pour éviter les conflits
    const logout = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      } catch (err) {
        console.error('Erreur lors de la déconnexion temporaire:', err)
      }
    }

    logout().then(verifyToken)
  }, [token])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validation des champs
    if (!password || !confirmPassword) {
      setError("Veuillez remplir tous les champs")
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Une erreur est survenue lors de la réinitialisation')
        }

        setSuccess(true)
        // Redirection automatique après 3 secondes
        setTimeout(() => {
          // Forcer un rechargement complet de la page de connexion
          window.location.href = "/auth/login"
        }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      }
    })
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Réinitialiser mon mot de passe</h2>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-black hover:bg-gray-800 text-white h-12"
                    disabled={isPending || !password || !confirmPassword}
                  >
                    {isPending ? "En cours..." : "Réinitialiser mon mot de passe"}
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      href="/auth/login" 
                      className="text-sm text-gray-600 hover:text-gray-900 inline-block mt-4"
                      onClick={(e) => {
                        e.preventDefault()
                        router.push('/auth/login')
                      }}
                    >
                      Retour à la connexion
                    </Link>
                  </div>
                </div>
              </form>

              {success && (
                <div className="text-center py-8">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Mot de passe mis à jour !</h3>
                  <p className="text-sm text-gray-500 mb-6">Redirection vers la page de connexion...</p>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      // Forcer un rechargement complet de la page de connexion
                      window.location.href = "/auth/login";
                    }} 
                    className="w-full bg-black hover:bg-gray-800 text-white"
                  >
                    Se connecter
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Image (same as forgot-password) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8F4F0] items-center justify-center p-12">
        <div className="relative w-full h-full max-w-2xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 bg-gradient-to-br from-pink-100 to-amber-100 rounded-full opacity-70"></div>
          </div>
          <div className="relative z-10">
            <div className="w-64 h-64 mx-auto bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center">
              <div className="w-48 h-48 bg-gradient-to-br from-pink-200 to-amber-200 rounded-full flex items-center justify-center">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-pink-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
