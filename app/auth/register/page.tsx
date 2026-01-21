"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PhoneInput } from "@/components/ui/phone-input"
import { isValidPhoneNumber } from "react-phone-number-input"
import { toast } from "sonner"

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
  const [isPending] = useTransition()
  const [showConsentError, setShowConsentError] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const validateName = (name: string, type: 'first_name' | 'last_name') => {
    if (!name || name.trim() === '') {
      return type === 'first_name' 
        ? 'Le prénom est obligatoire' 
        : 'Le nom est obligatoire';
    }
    if (name.length < 2) {
      return type === 'first_name' 
        ? 'Le prénom doit contenir au moins 2 caractères' 
        : 'Le nom doit contenir au moins 2 caractères';
    }
    return null;
  };

  const getNextError = () => {
    // Vérification de l'ordre des champs selon l'ordre du formulaire
    if (!formData.first_name.trim()) {
      setFirstNameError('Le prénom est obligatoire');
      return true;
    } else if (formData.first_name.trim().length < 2) {
      setFirstNameError('Le prénom doit contenir au moins 2 caractères');
      return true;
    }
    
    if (!formData.last_name.trim()) {
      setLastNameError('Le nom est obligatoire');
      return true;
    } else if (formData.last_name.trim().length < 2) {
      setLastNameError('Le nom doit contenir au moins 2 caractères');
      return true;
    }
    
    if (!formData.phone) {
      setPhoneError('Le numéro de téléphone est obligatoire');
      return true;
    } else if (!isValidPhoneNumber(formData.phone)) {
      setPhoneError('Numéro de téléphone invalide');
      return true;
    }
    
    if (!formData.email.trim()) {
      setEmailError('L\'email est obligatoire');
      return true;
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setEmailError('Veuillez entrer une adresse email valide');
      return true;
    }
    
    if (!formData.password) {
      setError('Le mot de passe est obligatoire');
      return true;
    } else if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return true;
    }
    
    if (!formData.acceptTerms) {
      setShowConsentError(true);
      return true;
    }
    
    return false; // Aucune erreur trouvée
  };

  const validatePhone = (phone: string) => {
    if (!phone || phone.trim() === '') return 'Le numéro de téléphone est obligatoire';
    if (!isValidPhoneNumber(phone)) return 'Numéro de téléphone invalide';
    return null;
  };

  const validatePassword = (password: string) => {
    if (!password || password.trim() === '') return 'Le mot de passe est obligatoire';
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères';
    return null;
  };

  const checkEmail = async (email: string) => {
    if (!email.trim()) return;
    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.exists) {
        setEmailError("Cet email est déjà utilisé.");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de l'email:", error);
    }
  };

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
                    <Label htmlFor="first_name">Prénom *</Label>
                    <div className="space-y-1">
                      <Input
                        id="first_name"
                        required
                        value={formData.first_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, first_name: value });
                          setFirstNameError(validateName(value, 'first_name'));
                        }}
                        className="mt-1"
                        placeholder="Votre prénom"
                      />
                      {firstNameError && (
                        <p className="text-sm text-red-500">{firstNameError}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="last_name">Nom *</Label>
                    <div className="space-y-1">
                      <Input
                        id="last_name"
                        required
                        value={formData.last_name}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, last_name: value });
                          setLastNameError(validateName(value, 'last_name'));
                        }}
                        className="mt-1"
                        placeholder="Votre nom"
                      />
                      {lastNameError && (
                        <p className="text-sm text-red-500">{lastNameError}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="space-y-1">
                    <Label htmlFor="phone">Téléphone portable *</Label>
                    <PhoneInput
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(value) => {
                        setFormData({ ...formData, phone: value || '' });
                        if (value) {
                          setPhoneError(validatePhone(value));
                        } else {
                          setPhoneError('Le numéro de téléphone est requis');
                        }
                      }}
                      defaultCountry="DZ"
                      placeholder="Entrez votre numéro..."
                      className={cn("mt-1", phoneError && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {phoneError && (
                      <p className="text-sm text-red-500">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError(null); // Clear error on change
                    }}
                    onBlur={(e) => checkEmail(e.target.value)}
                    className="mt-1"
                    placeholder="Email"
                  />
                  {emailError && (
                    <p className="text-sm text-red-500 mt-1">{emailError}</p>
                  )}
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
                                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-1">
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

                {error && (
                  <div className="p-2 mb-2 text-sm text-red-700  ">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                      </svg>
                      <span className="font-medium">{error}</span>
                    </div>
                  </div>
                )}
              <Button
                className="w-full bg-black hover:bg-gray-800 text-white"
                disabled={isPending || isSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  setError(null);
                  
                  // Réinitialisation des erreurs
                  setError(null);
                  setFirstNameError(null);
                  setLastNameError(null);
                  setPhoneError(null);
                  setEmailError(null);
                  setShowConsentError(false);
                  
                  // Vérification des erreurs une par une
                  if (getNextError()) {
                    return;
                  }
                  
                  
                  // Vérification de l'email existant
                  try {
                    const emailCheckRes = await fetch("/api/auth/check-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: formData.email }),
                    });
                    
                    if (!emailCheckRes.ok) {
                      throw new Error("Erreur lors de la vérification de l'email");
                    }
                    
                    const emailData = await emailCheckRes.json();
                    if (emailData.exists) {
                      setEmailError("Cet email est déjà utilisé.");
                      return;
                    }
                    
                    // Si tout est valide, soumettre le formulaire
                    setIsSubmitting(true);
                    
                    // Préparer les données pour l'inscription
                    const userData = {
                      email: formData.email.trim(),
                      password: formData.password,
                      first_name: formData.first_name.trim(),
                      last_name: formData.last_name.trim(),
                      phone: formData.phone,
                    };
                    
                    // Envoyer la requête d'inscription
                    const registerRes = await fetch("/api/auth/register", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(userData),
                    });
                    
                    if (!registerRes.ok) {
                      const errorData = await registerRes.json();
                      throw new Error(errorData.message || "Erreur lors de l'inscription");
                    }
                    
                    // Redirection après inscription réussie
                    router.push("/auth/login");
                    toast.success("Inscription réussie !");
                    
                  } catch (error) {
                    console.error("Erreur lors de l'inscription:", error);
                    
                    // Gestion des erreurs spécifiques
                    if (error instanceof Error) {
                      setError(error.message);
                    } else if (typeof error === 'object' && error !== null && 'error' in error) {
                      // Gestion des erreurs de l'API
                      const apiError = error as { error: string };
                      setError(apiError.error);
                    } else {
                      setError("Une erreur est survenue. Veuillez réessayer.");
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
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
