"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    acceptTerms: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-bold text-black tracking-wide">
              YOKA
            </Link>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-xl font-semibold">Nouveau sur YOKA ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="mt-1"
                      placeholder="Votre prénom"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="mt-1"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone portable *</Label>
                  <div className="flex mt-1">
                    <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                      <span className="text-sm">🇩🇿</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-l-none"
                      placeholder="Entrez votre numéro..."
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">J'accepte les CGU de YOKA</p>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                    placeholder="Email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mot de passe"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={isPending}
                onClick={() => {
                  setError(null)
                  startTransition(async () => {
                    try {
                      const res = await fetch("/api/auth/register", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          first_name: formData.first_name || undefined,
                          last_name: formData.last_name || undefined,
                          phone: formData.phone || undefined,
                          email: formData.email,
                          password: formData.password,
                        }),
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        setError(data.error || "Impossible de créer le compte")
                        return
                      }
                      router.push("/client/dashboard")
                    } catch (e) {
                      setError("Erreur réseau")
                    }
                  })
                }}
              >
                {isPending ? "Création..." : "Créer mon compte"}
              </Button>

              <div className="text-xs text-gray-500 leading-relaxed">
                Mes informations sont traitées par YOKA, consultez notre{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Politique de Confidentialité
                </Link>{" "}
                et nos{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Conditions d'Utilisations
                </Link>{" "}
                de Google.
              </div>

              <div className="text-center">
                <span className="text-gray-500">OU</span>
              </div>

              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/auth/login">Se connecter</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/modern-beauty-salon-with-professional-hairstylist-.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>
    </div>
  )
}
