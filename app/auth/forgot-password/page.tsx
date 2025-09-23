"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">Mot de passe oublié</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {sent ? (
              <p className="text-sm text-gray-700">Si un compte existe, un lien a été envoyé.</p>
            ) : (
              <>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                {error ? <p className="text-sm text-red-600">{error}</p> : null}
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white"
                  disabled={isPending}
                  onClick={() => {
                    setError(null)
                    startTransition(async () => {
                      try {
                        const res = await fetch("/api/auth/password/request", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email }),
                        })
                        if (!res.ok) {
                          setError("Erreur")
                          return
                        }
                        setSent(true)
                      } catch (e) {
                        setError("Erreur réseau")
                      }
                    })
                  }}
                >
                  {isPending ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


