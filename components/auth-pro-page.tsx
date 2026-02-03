"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type City = {
  id: number;
  name: string;
  wilaya_number: number;
};

type LeadFormState = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  consent: boolean;
};

export default function AuthProLanding() {
  const [submitting, setSubmitting] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  
  const scrollToSelect = () => {
    if (selectRef.current) {
      selectRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  const [form, setForm] = useState<LeadFormState>({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    businessType: "",
    consent: false,
  });
  
  const router = useRouter();
  const [showConsentError, setShowConsentError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          setCities(data);
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    fetchCities();
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    update(field, value);
    if (value && value.length < 4) {
      field === 'firstName' 
        ? setFirstNameError('Le prénom doit contenir au moins 4 caractères')
        : setLastNameError('Le nom doit contenir au moins 4 caractères');
    } else {
      field === 'firstName' 
        ? setFirstNameError('')
        : setLastNameError('');
    }
  };

  const handleEmailChange = (value: string) => {
    update("email", value);
    if (emailError) setEmailError('');
    if (value) {
      if (!value.includes('@')) {
        setEmailError('Veuillez inclure un @ dans l\'adresse email');
      } else if (!value.includes('.')) {
        setEmailError('Veuillez inclure un domaine valide (ex: exemple@gmail.com)');
      } else if (!validateEmail(value)) {
        setEmailError('Veuillez entrer une adresse email valide avec une extension (ex: .com, .fr)');
      } else {
        setEmailError('');
      }
    } else {
      setEmailError('');
    }
  };

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    let hasError = false;
    
    if (form.firstName.length < 4) {
      setFirstNameError('Le prénom doit contenir au moins 4 caractères');
      hasError = true;
    }
    
    if (form.lastName.length < 4) {
      setLastNameError('Le nom doit contenir au moins 4 caractères');
      hasError = true;
    }
    
    if (!validateEmail(form.email)) {
      setEmailError('Veuillez entrer une adresse email valide avec une extension (ex: .com, .fr)');
      hasError = true;
    }
    
    if (hasError) return;
    
    if (!form.consent) {
      setShowConsentError(true);
      return;
    }
    
    setShowConsentError(false);
    setSubmitting(true);
    
    try {
      const payload = {
        business_name: form.companyName,
        owner_first_name: form.firstName,
        owner_last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        activity_type: form.businessType || null,
        location: form.city || null,
        notes: null as string | null,
      };
      
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data?.error?.includes("email")) {
          setEmailError(data.error);
          return;
        }
        const msg = data?.error || `Erreur API (${res.status})`;
        throw new Error(msg);
      }
      
      setForm({ 
        companyName: "", 
        firstName: "", 
        lastName: "", 
        email: "", 
        phone: "", 
        city: "", 
        businessType: "", 
        consent: false 
      });
      setIsSuccess(true);
      
      if (typeof window !== "undefined") {
        window.location.hash = "contact";
      }
    } catch (err: any) {
      toast.error("Impossible d'envoyer votre demande", { 
        description: err?.message || "Merci de réessayer plus tard." 
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col">
      <section className="w-full border-b bg-background">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
          <div className="space-y-5">
            <span className="inline-block rounded-full bg-muted px-3 py-1 text-xs">Solution Pro</span>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Gérez votre institut en toute simplicité</h1>
            <p className="text-muted-foreground">Un outil complet pour gérer vos rendez-vous, votre planning, vos clients et votre communication.
Créez votre compte gratuitement et commencez dès maintenant.</p>
            <div className="flex gap-3 pt-2">
              <Link href="/offres">
                <Button size="lg">Découvrir les offres</Button>
              </Link>
            </div>
          </div>
          <Card className="md:ml-auto">
            <CardHeader>
              <CardTitle>Créer votre compte et rejoignez nous</CardTitle>
              <CardDescription>Renseignez vos informations pour démarrer. Votre compte sera prêt en quelques secondes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4" id="contact">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <div className="space-y-2">
                      <Input 
                        id="firstName" 
                        value={form.firstName} 
                        onChange={(e) => handleNameChange('firstName', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value && e.target.value.length < 4) {
                            setFirstNameError('Le prénom doit contenir au moins 4 caractères');
                          } else {
                            setFirstNameError('');
                          }
                        }}
                        className={firstNameError ? 'border-red-500' : ''}
                        required 
                      />
                      {firstNameError && (
                        <p className="text-sm text-red-500 font-medium">{firstNameError}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <div className="space-y-2">
                      <Input 
                        id="lastName" 
                        value={form.lastName} 
                        onChange={(e) => handleNameChange('lastName', e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value && e.target.value.length < 4) {
                            setLastNameError('Le nom doit contenir au moins 4 caractères');
                          } else {
                            setLastNameError('');
                          }
                        }}
                        className={lastNameError ? 'border-red-500' : ''}
                        required 
                      />
                      {lastNameError && (
                        <p className="text-sm text-red-500 font-medium">{lastNameError}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom du salon / institut</Label>
                  <Input id="companyName" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={form.email} 
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={(e) => {
                          if (e.target.value && !validateEmail(e.target.value)) {
                            setEmailError('Veuillez entrer une adresse email valide');
                          } else {
                            setEmailError('');
                          }
                        }}
                        className={emailError ? 'border-red-500' : ''}
                        required 
                      />
                      {emailError && (
                        <p className="text-sm text-red-500 font-medium">{emailError}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <PhoneInput
                        value={form.phone}
                        onChange={(value) => update("phone", value)}
                        defaultCountry="DZ"
                        required
                        className={form.phone && !isValidPhoneNumber(form.phone) ? "border-red-500 rounded-lg" : ""}
                      />
                      {form.phone && !isValidPhoneNumber(form.phone) && (
                        <p className="text-sm text-red-500 font-medium">Format invalide</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Type d'activité</Label>
                    <Select value={form.businessType} onValueChange={(v) => update("businessType", v)} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" align="start" avoidCollisions={false} className="rounded-xl shadow-xl border-border/50" sideOffset={5}>
                        <SelectItem value="beaute">Institut de beauté</SelectItem>
                      </SelectContent>
                    </Select>
                    <input 
                      type="text" 
                      className="h-px w-px opacity-0 absolute bottom-0 left-0 -z-10 pointer-events-none" 
                      tabIndex={-1}
                      value={form.businessType}
                      onChange={() => {}}
                      required
                    />
                  </div>
                  <div className="space-y-2" ref={selectRef}>
                    <Label htmlFor="city">Wilaya</Label>
                    <div className="relative">
                      <Select 
                        value={form.city} 
                        onValueChange={(v) => update("city", v)}
                        onOpenChange={(open) => open && scrollToSelect()}
                        required
                      >
                        <SelectTrigger className="w-full h-12 px-4 text-base border-2 border-gray-200 hover:border-primary transition-colors rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary">
                          <SelectValue placeholder="Sélectionner une wilaya" />
                        </SelectTrigger>
                        <SelectContent 
                          position="popper"
                          side="bottom"
                          align="start"
                          sideOffset={5}
                          avoidCollisions={false}
                          className="w-[var(--radix-select-trigger-width)] max-h-[300px] rounded-xl shadow-xl border border-gray-100 bg-white overflow-hidden mt-1"
                        >
                          <div className="sticky top-0 z-10 bg-white p-2 border-b border-gray-100">
                            <div className="relative">
                              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="search"
                                placeholder="Rechercher une wilaya..."
                                className="w-full pl-8 py-2 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="max-h-[250px] overflow-y-auto">
                            {cities
                              .filter(city => {
                                const searchTermLower = searchTerm.toLowerCase();
                                const wilayaNumber = city.wilaya_number.toString().padStart(2, '0');
                                const cityNameLower = city.name.toLowerCase();
                                
                                if (wilayaNumber.startsWith(searchTerm)) {
                                  return true;
                                }
                                
                                if (cityNameLower.includes(searchTermLower)) {
                                  return true;
                                }
                                
                                const fullText = `${wilayaNumber} - ${cityNameLower}`;
                                return fullText.includes(searchTermLower);
                              })
                              .map((city: City) => (
                                <SelectItem 
                                  key={city.id} 
                                  value={`${city.wilaya_number.toString().padStart(2, '0')} - ${city.name}`}
                                  className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                                >
                                  {city.wilaya_number.toString().padStart(2, '0')} - {city.name}
                                </SelectItem>
                              ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <input 
                        id="city-hidden"
                        name="city"
                        type="text" 
                        className="sr-only" 
                        value={form.city}
                        onChange={() => {}}
                        required
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-1">
                    <Checkbox 
                      id="consent" 
                      checked={form.consent} 
                      onCheckedChange={(v) => {
                        update("consent", Boolean(v));
                        if (v) setShowConsentError(false);
                      }} 
                    />
                    <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">
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
                <Button type="submit" disabled={submitting}>{submitting ? "Envoi..." : "S’inscrire"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <Dialog open={isSuccess} onOpenChange={setIsSuccess}>
        <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden border-0 shadow-lg">
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="rounded-full bg-green-50 p-3">
              <Check className="h-6 w-6 text-green-600" strokeWidth={3} />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">Merci !</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-normal">
                Votre demande a bien été enregistrée.<br/>
                Un expert YOKA vous recontactera dans les plus brefs délais !
              </DialogDescription>
            </div>
          </div>
          <div className="px-8 pb-8 flex justify-center">
            <Button type="button" className="w-full h-9 text-sm font-medium shadow-sm transition-all" onClick={() => router.push("/")}>
              J'ai compris
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <section className="w-full bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
          <Metric label="des rendez-vous en ligne" value="60%" />
          <Metric label="plus de clients récurrents" value="2.5x" />
          <Metric label="de revenus par client avec la réservation en ligne" value="18%" />
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Tout ce dont vous avez besoin, réuni en une seule plateforme.</h2>
            <ul className="space-y-6">
              <li>
                <StepItem number="01" title="Plateforme de réservation" description="Offrez la réservation en ligne 24/7, synchronisée avec votre agenda et vos réseaux sociaux." />
              </li>
              <li>
                <StepItem number="02" title="Agenda connecté" description="Planifiez en un clin d'œil, assignez des prestations et gérez vos équipes." />
              </li>
              <li>
                <StepItem number="03" title="Page vitrine professionnelle" description="Présentez vos services, horaires, tarifs et photos sur une page professionnelle optimisée pour attirer plus de clients." />
              </li>
            </ul>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            <Image src="/modern-hair-salon-interior-with-styling-chairs.jpg" alt="Aperçu" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h3 className="mb-6 text-center text-2xl font-semibold">Les questions fréquentes</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="q1">
              <AccordionTrigger>Qui peut s’inscrire sur YOKA ?</AccordionTrigger>
              <AccordionContent>Tous les salons de coiffure, instituts de beauté et établissements de bien-être peuvent créer un compte pour gérer leurs réservations et leur activité.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Comment mes clients peuvent-ils réserver ?</AccordionTrigger>
              <AccordionContent>Une fois votre compte créé, vous recevez un lien unique et une page professionnelle où vos clients peuvent réserver en ligne 24/7.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Puis-je gérer mon agenda depuis mon téléphone ?</AccordionTrigger>
              <AccordionContent>Oui ! L’interface YOKA est responsive et accessible depuis ordinateur, tablette ou smartphone.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
              <AccordionContent>Oui. Toutes vos informations et celles de vos clients sont sécurisées et conformes aux normes de confidentialité.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger>Puis-je annuler ou modifier une réservation ?</AccordionTrigger>
              <AccordionContent>Oui. Vous pouvez gérer, annuler ou reprogrammer toutes vos réservations directement depuis votre agenda YOKA.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="w-full bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-semibold">Rejoignez nous les professionnels du bien-être.</h3>
          </div>
          <div className="flex justify-center items-center">
            <Card className="bg-background text-foreground">
              <CardContent className="flex justify-center items-center">
                <Link href="#contact">
                  <Button className="bg-white text-black hover:bg-white hover:text-black" size="lg">
                    Commencer maintenant!
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric(props: { value: string; label: string }) {
  return (
    <div className="rounded-lg border bg-background p-6 text-center">
      <div className="text-2xl font-semibold">{props.value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{props.label}</div>
    </div>
  );
}

function StepItem(props: { number: string; title: string; description: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4">
      <div className="text-sm text-muted-foreground">{props.number}</div>
      <div>
        <div className="font-medium">{props.title}</div>
        <p className="text-sm text-muted-foreground">{props.description}</p>
      </div>
    </div>
  );
}

function Alternating(props: { image: string; title: string; description: string; cta: string; href: string; reversed?: boolean }) {
  const { image, title, description, cta, href, reversed } = props;
  return (
    <section className="w-full bg-foreground text-background">
      <div className={`mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2 ${reversed ? "md:[&>div:nth-child(1)]:order-2" : ""}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-background">
          <Image src={image} alt="visuel" fill className="object-cover" />
        </div>
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="text-background/80 md:max-w-[46ch]">{description}</p>
          <Link href={href}><Button variant="secondary">{cta}</Button></Link>
        </div>
      </div>
    </section>
  );
}