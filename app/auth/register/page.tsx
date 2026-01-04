"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  const [showConsentError, setShowConsentError] = useState(false)
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
                                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="consent" 
                      checked={formData.acceptTerms} 
                      onCheckedChange={(v) => {
                        setFormData({ ...formData, acceptTerms: Boolean(v) });
                        if (v) setShowConsentError(false);
                      }} 
                    />
               <Label
                 htmlFor="consent"
                 className="text-sm font-normal text-muted-foreground"
               >
                 <span className="inline">
                   J'accepte les conditions d'utilisation, la{" "}
                   <Link
                     href="/a-propos/mentions-legales"
                     className="text-primary underline hover:text-primary/80"
                   >
                     politique de confidentialité
                   </Link>
                   .
                 </span>
                </Label>

                  </div>
                  {showConsentError && (
                    <p className="text-sm text-red-500">Veuillez accepter les conditions générales.</p>
                  )}
                </div>

              {/* {showConsentError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    <span className="font-medium">Veuillez accepter les conditions d'utilisation pour continuer.</span>
                  </div>
                </div>
              )} */}
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={isPending}
                onClick={() => {
                  setError(null)
                  
                  // Vérifier si l'utilisateur a accepté les conditions
                  if (!formData.acceptTerms) {
                    setShowConsentError(true);
                    return;
                  }
                  
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
                        try {
                          const data = await res.json();
                          console.log('Réponse d\'erreur du serveur:', data);
                          
                          // Afficher le message d'erreur du serveur s'il existe
                          if (data && data.error) {
                            setError(data.error);
                          } else {
                            // Gestion spécifique des codes d'erreur
                            switch(res.status) {
                              case 400:
                                setError("Données invalides. Vérifiez les informations saisies.");
                                break;
                              case 409:
                                setError("Cette adresse email est déjà utilisée. Si c'est la vôtre, veuillez vous connecter ou utiliser la fonction 'Mot de passe oublié'.");
                                break;
                              case 500:
                                setError("Erreur interne du serveur. Veuillez réessayer plus tard.");
                                break;
                              default:
                                setError("Une erreur est survenue lors de la création du compte.");
                            }
                          }
                          
                          console.error(`Erreur ${res.status}`);
                        } catch (e) {
                          console.error('Erreur inattendue:', e);
                          setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
                        }
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
