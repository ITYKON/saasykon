"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [emailError, setEmailError] = useState<string | null>(null)

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setEmailError(null)

    if (!email) {
      setEmailError("Merci de saisir votre adresse email")
      return
    }

    if (!validateEmail(email)) {
      setEmailError("Veuillez entrer une adresse email valide")
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/password/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || "Une erreur est survenue")
          return
        }
        setSent(true)
      } catch (e) {
        setError("Erreur réseau. Veuillez réessayer.")
      }
    })
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side with form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h1>
            <p className="text-gray-600">
              {sent 
                ? "Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe."
                : "Entrez votre adresse email pour recevoir un lien de réinitialisation."}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  className={`w-full ${emailError ? 'border-red-500' : ''}`}
                  placeholder="votre@email.com"
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-2.5 text-base"
                disabled={isPending}
              >
                {isPending ? "Envoi en cours..." : "Réinitialiser mon mot de passe"}
              </Button>

              <div className="text-center mt-4">
                <Link 
                  href="/auth/login" 
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
                <p>Un email a été envoyé à {email} avec les instructions pour réinitialiser votre mot de passe.</p>
              </div>
              <p className="text-sm text-gray-600">
                Vous n'avez pas reçu d'email ? Vérifiez votre dossier spam ou{' '}
                <button 
                  onClick={() => setSent(false)}
                  className="text-black hover:underline"
                >
                  réessayer
                </button>
              </p>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Nouveau sur YKON ?{' '}
              <Link href="/auth/register" className="text-black font-medium hover:underline">
                Créer mon compte
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side with image */}
      <div className="hidden md:block md:w-1/2 bg-gray-100">
        <div className="h-full w-full bg-cover bg-center" 
             style={{ backgroundImage: 'url("/images/auth-bg.jpg")' }}>
          {/* You can add an overlay here if needed */}
        </div>
      </div>
    </div>
  )
}


