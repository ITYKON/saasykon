"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">


          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6 pt-10">
              <CardTitle className="text-2xl font-semibold">Vous avez déjà utilisé YOKA ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Votre email"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe *</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      const res = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email, password }),
                      })
                      if (!res.ok) {
                        const data = await res.json().catch(() => ({}))
                        setError(data.error || "Impossible de se connecter")
                        return
                      }
                      //  CORRECTION : Attendre 1000ms + router.push pour éviter le bug Next.js
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      router.push("/");
                    } catch (e) {
                      setError("Erreur réseau")
                    }
                  })
                }}
              >
                {isPending ? "Connexion..." : "Se connecter"}
              </Button>

              <div className="text-center">
                <span className="text-gray-500">OU</span>
              </div>

              <div className="text-center">
                <p className="text-gray-600 mb-4">Nouveau sur YOKA ?</p>
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href="/auth/register">Créer mon compte</Link>
                </Button>
              </div>

              <div className="text-center">
                <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-black">
                  Mot de passe oublié ?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:block flex-1 relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/elegant-beauty-salon-interior-with-warm-lighting-a.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
      </div>
    </div>
  )
}