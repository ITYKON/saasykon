"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
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

  function update<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) {
      toast({ title: "Consentement requis", description: "Veuillez accepter la politique de confidentialité." });
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      toast({ title: "Demande envoyée", description: "Nous vous recontactons très vite pour activer votre compte Pro." });
      setForm({ companyName: "", firstName: "", lastName: "", email: "", phone: "", city: "", businessType: "", consent: false });
    } catch (err) {
      toast({ title: "Une erreur est survenue", description: "Merci de réessayer plus tard." });
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
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">La plateforme n°1 pour gérer votre salon ou institut</h1>
            <p className="text-muted-foreground">Réservations en ligne, agenda intelligent, rappels automatiques et outils marketing pour développer votre activité.</p>
            <div className="flex gap-3 pt-2">
              <Link href="/pro/abonnement">
                <Button size="lg">Découvrir les offres</Button>
              </Link>
              <Link href="#contact">
                <Button variant="secondary" size="lg">Être recontacté</Button>
              </Link>
            </div>
          </div>
          <Card className="md:ml-auto">
            <CardHeader>
              <CardTitle>Demandez une démonstration</CardTitle>
              <CardDescription>Parlez-nous de votre établissement. Un expert vous rappelle.</CardDescription>
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
                    <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
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
                        <SelectItem value="coiffure">Coiffure</SelectItem>
                        <SelectItem value="barbier">Barbier</SelectItem>
                        <SelectItem value="beaute">Institut de beauté</SelectItem>
                        <SelectItem value="manucure">Manucure</SelectItem>
                        <SelectItem value="spa">Spa / Bien-être</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox id="consent" checked={form.consent} onCheckedChange={(v) => update("consent", Boolean(v))} />
                  <Label htmlFor="consent" className="text-sm font-normal text-muted-foreground">
                    J'accepte d'être contacté·e et la politique de confidentialité.
                  </Label>
                </div>
                <Button type="submit" disabled={submitting}>{submitting ? "Envoi..." : "Être recontacté·e"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="w-full bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-10 sm:grid-cols-3">
          <Metric label="utilisateurs" value="14 Millions" />
          <Metric label="professionnels" value="+50 000" />
          <Metric label="des rendez-vous en ligne" value="50%" />
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold">Exaucez trois vœux d'un seul coup.</h2>
            <ul className="space-y-6">
              <li>
                <StepItem number="01" title="Plateforme de réservation" description="Offrez la réservation en ligne 24/7, synchronisée avec votre agenda et vos réseaux sociaux." />
              </li>
              <li>
                <StepItem number="02" title="Agenda connecté" description="Planifiez en un clin d'œil, assignez des prestations et gérez vos équipes." />
              </li>
              <li>
                <StepItem number="03" title="Gestion de caisse" description="Suivez ventes, remises, TVA et rapports détaillés." />
              </li>
            </ul>
            <div>
              <Link href="/pro/abonnement"><Button variant="outline">Voir les fonctionnalités</Button></Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
            <Image src="/modern-hair-salon-interior-with-styling-chairs.jpg" alt="Aperçu" fill className="object-cover" />
          </div>
        </div>
      </section>

      <Alternating
        image="/elegant-beauty-salon-interior-with-warm-lighting-a.jpg"
        title="Oh joie ! L'agenda se remplit tout seul"
        description="Recevez des réservations directement depuis le web, Google et Instagram, avec confirmation automatique."
        cta="Voir comment"
        href="/pro/agenda"
      />
      <Alternating
        reversed
        image="/modern-spa-interior-marseille.jpg"
        title="50% d'appels en moins au salon"
        description="Rappels SMS et emails, confirmation automatique, listes d'attente et politiques d'annulation réduisent les appels et les no-shows."
        cta="Réduire les no-shows"
        href="/pro/reservations"
      />
      <Alternating
        image="/modern-hair-salon-interior-with-stylish-people-getting-ha.jpg"
        title="Des clients qui reviennent au rendez-vous"
        description="Campagnes marketing, avis, cartes cadeaux et fidélité intégrée boostent votre récurrence."
        cta="Booster la fidélité"
        href="/pro/clients"
      />

      <section className="w-full">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
            <Image src="/professional-hair-washing-station-in-salon.jpg" alt="Caisse" fill className="object-cover" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">En parfaite harmonie avec vos ventes</h3>
            <p className="text-muted-foreground">Une caisse fluide reliée à vos rendez-vous, produits et statistiques. Factures, remises, taxes et rapports exportables.</p>
            <Link href="/pro/statistiques"><Button>Voir les rapports</Button></Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-muted/30">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-background">
            <Image src="/calendar" alt="" fill className="hidden" />
            <div className="flex h-full items-center justify-center rounded-lg border p-6">
              <div className="w-full max-w-sm">
                <div className="mb-3 text-sm font-medium text-muted-foreground">Exemple d'interface</div>
                <div className="rounded-md border p-4">
                  <div className="mb-2 text-lg font-semibold">Agenda</div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <span className="rounded bg-muted px-2 py-1 text-center">09:00</span>
                    <span className="rounded bg-muted px-2 py-1 text-center">10:30</span>
                    <span className="rounded bg-muted px-2 py-1 text-center">12:00</span>
                    <span className="rounded bg-muted px-2 py-1 text-center">14:00</span>
                    <span className="rounded bg-muted px-2 py-1 text-center">15:30</span>
                    <span className="rounded bg-muted px-2 py-1 text-center">17:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Enchantez vos clients. Un jeu d'enfant.</h3>
            <p className="text-muted-foreground">Des interfaces claires pour vos équipes et vos clients, sur web et mobile. Tout est pensé pour aller vite et bien.</p>
            <Link href="#contact"><Button variant="outline">Demander une démo</Button></Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-semibold">Rejoignez nous les professionnels du bien-être.</h3>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="bg-background text-foreground">
              <CardHeader>
                <CardTitle>Vous êtes prêt ?</CardTitle>
                <CardDescription>Créez votre compte professionnel et commencez en quelques minutes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/register"><Button size="lg">Créer mon compte Pro</Button></Link>
              </CardContent>
            </Card>
            <Card className="bg-background text-foreground">
              <CardHeader>
                <CardTitle>Parlez avec un expert</CardTitle>
                <CardDescription>Nos équipes vous accompagnent pour une mise en place aux petits soins.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="#contact"><Button variant="secondary" size="lg">Être rappelé·e</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h3 className="mb-6 text-center text-2xl font-semibold">Les questions fréquentes</h3>
          <Accordion type="single" collapsible>
            <AccordionItem value="q1">
              <AccordionTrigger>Combien de temps pour être opérationnel ?</AccordionTrigger>
              <AccordionContent>La prise en main est immédiate. La plupart des établissements ouvrent leurs réservations en moins de 48h.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>Puis-je importer mes clients et mes rendez-vous ?</AccordionTrigger>
              <AccordionContent>Oui, nos équipes vous assistent pour importer vos données depuis votre ancien logiciel.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>Y a-t-il un engagement ?</AccordionTrigger>
              <AccordionContent>Les offres sont sans engagement. Arrêtez quand vous voulez.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="w-full bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <div className="text-4xl font-semibold tracking-tight">14 000 000</div>
          <p className="mt-2 text-muted-foreground">de réservations créées l'an dernier via notre réseau beauté en France.</p>
          <div className="mt-6 flex justify-center"><Link href="#contact"><Button size="lg">Commencer maintenant</Button></Link></div>
        </div>
      </section>

      <section className="w-full">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 max-w-2xl">
            <h3 className="text-2xl font-semibold">Plus de 50 000 professionnels ont transformé leurs rdv avec notre solution.</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg",
              "/modern-hair-salon-interior-styling-chairs.jpg",
              "/modern-beauty-salon-with-stylish-people-getting-ha.jpg",
              "/traditional-barbershop-vintage-chairs-mirrors.jpg",
            ].map((src, idx) => (
              <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                <Image src={src} alt="client" fill className="object-cover" />
              </div>
            ))}
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


