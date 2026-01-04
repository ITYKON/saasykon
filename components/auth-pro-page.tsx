"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PhoneInput } from "@/components/ui/phone-input";

type LeadFormState = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCountry: string;
  city: string;
  businessType: string;
  consent: boolean;
};

export default function AuthProLanding() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<LeadFormState>({
    companyName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCountry: "+33",
    city: "",
    businessType: "",
    consent: false,
  });
  const [showConsentError, setShowConsentError] = useState(false);

  // (ligne supprimée, déjà dans le state)
  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        const msg = data?.error || `Erreur API (${res.status})`;
        throw new Error(msg);
      }
      setForm({ companyName: "", firstName: "", lastName: "", email: "", phone: "", phoneCountry: "+33", city: "", businessType: "", consent: false });
      toast.success("Merci !", { description: "Un expert vous contactera sous 24h." });
      // Option: navigate to a confirmation section instead of page
      if (typeof window !== "undefined") {
        window.location.hash = "contact";
      }
    } catch (err: any) {
      toast.error("Impossible d'envoyer votre demande", { description: err?.message || "Merci de réessayer plus tard." });
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
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyName">Nom du salon / institut</Label>
                  <Input id="companyName" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <PhoneInput
                      value={form.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => update("phone", e.target.value)}
                      country={form.phoneCountry}
                      onCountryChange={(v: string) => update("phoneCountry", v)}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Type d'activité</Label>
                    <Select value={form.businessType} onValueChange={(v) => update("businessType", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                       
                        <SelectItem value="beaute">Institut de beauté</SelectItem>
                      
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id="consent" 
                      checked={form.consent} 
                      onCheckedChange={(v) => {
                        update("consent", Boolean(v));
                        if (v) setShowConsentError(false);
                      }} 
                    />
                    <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">
                      J’accepte les conditions d’utilisation et la <Link href="/a-propos/mentions-legales" className="underline hover:text-primary">politique de confidentialité</Link>.
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
            {/* <div>
              <Link href="/pro/abonnement"><Button variant="outline">Voir les fonctionnalités</Button></Link>
            </div> */}
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
              <AccordionContent>Tous les salons de coiffure, instituts de beautéet établissements de bien-être peuvent créer un compte pour gérer leurs réservations et leur activité.</AccordionContent>
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
                <Button className="bg-white text-black hover:bg-white hover:text-black"
                   size="lg">Commencer maintenant!</Button>
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
              <Footer />
      </div>
    </section>
  );
}


