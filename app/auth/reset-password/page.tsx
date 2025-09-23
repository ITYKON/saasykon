"use client"

import { useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">Réinitialiser le mot de passe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {done ? (
              <>
                <p className="text-sm text-gray-700">Mot de passe mis à jour.</p>
                <Button className="w-full" onClick={() => router.push("/auth/login")}>
                  Se connecter
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                </div>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  disabled={isPending}
                  onClick={() => {
                    setError(null)
                    startTransition(async () => {
                      try {
                        const res = await fetch("/api/auth/password/reset", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token, password }),
                        })
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}))
                          setError(data.error || "Erreur")
                          return
                        }
                        setDone(true)
                      } catch (e) {
                        setError("Erreur réseau")
                      }
                    })
                  }}
                >
                  {isPending ? "Mise à jour..." : "Mettre à jour"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


