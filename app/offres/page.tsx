"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Rocket, Gift, ArrowRight, Users, Calendar, BarChart3, MessageSquare, Instagram, Mail } from "lucide-react";

type PlanFeature = {
  feature_code: string;
  value: string | null;
};

type Plan = {
  id: number;
  code: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: string;
  trial_days: number | null;
  is_active: boolean;
  features: PlanFeature[];
};

export default function OffresPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/public/plans");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Erreur lors du chargement des plans:", error);
      // Utiliser des données par défaut si l'API échoue
      setPlans(getDefaultPlans());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultPlans(): Plan[] {
    return [
      {
        id: 1,
        code: "decouverte",
        name: "Gratuit",
        price_cents: 0,
        currency: "DA",
        billing_interval: "month",
        trial_days: 0,
        is_active: true,
        features: [
          { feature_code: "directory listing", value: null },
          { feature_code: "public page", value: null },
          { feature_code: "manual booking", value: null },
          { feature_code: "employee accounts", value: null },
          { feature_code: "calendar sync", value: null },
          { feature_code: "statistics", value: null },
        ],
      },
      {
        id: 2,
        code: "starter",
        name: "Starter",
        price_cents: 2500,
        currency: "DA",
        billing_interval: "month",
        trial_days: 14,
        is_active: true,
        features: [
          { feature_code: "directory listing", value: null },
          { feature_code: "public page", value: null },
          { feature_code: "full booking management", value: null },
          { feature_code: "email reminders", value: null },
          { feature_code: "employee accounts", value: null },
          { feature_code: "basic statistics", value: null },
          { feature_code: "priority support", value: null },
        ],
      },
      {
        id: 3,
        code: "pro",
        name: "Pro",
        price_cents: 4500,
        currency: "DA",
        billing_interval: "month",
        trial_days: 14,
        is_active: true,
        features: [
          { feature_code: "all starter features", value: null },
          { feature_code: "employee accounts", value: null },
          { feature_code: "absence management", value: null },
          { feature_code: "variable hours", value: null },
          { feature_code: "crm basic", value: null },
          { feature_code: "social integration", value: null },
          { feature_code: "promo campaigns", value: null },
        ],
      },
      {
        id: 4,
        code: "business",
        name: "Business",
        price_cents: 10000,
        currency: "DA",
        billing_interval: "month",
        trial_days: 30,
        is_active: true,
        features: [
          { feature_code: "all pro features", value: null },
          { feature_code: "multi salon", value: null },
          { feature_code: "employee accounts", value: null },
          { feature_code: "advanced dashboards", value: null },
          { feature_code: "dedicated support", value: null },
          { feature_code: "custom training", value: null },
          { feature_code: "api integration", value: null },
          { feature_code: "accounting tools", value: null },
        ],
      },
    ];
  }

  function getPlanIcon(code: string) {
    switch (code) {
      case "decouverte":
        return { icon: Gift, color: "bg-green-100 text-green-800", gradient: "from-green-400 to-green-600" };
      case "starter":
        return { icon: Rocket, color: "bg-blue-100 text-blue-800", gradient: "from-blue-400 to-blue-600" };
      case "pro":
        return { icon: Star, color: "bg-purple-100 text-purple-800", gradient: "from-purple-400 to-purple-600" };
      case "business":
        return { icon: Crown, color: "bg-yellow-100 text-yellow-800", gradient: "from-yellow-400 to-yellow-600" };
      default:
        return { icon: Gift, color: "bg-gray-100 text-gray-800", gradient: "from-gray-400 to-gray-600" };
    }
  }

  function formatPrice(amount: number) {
    return new Intl.NumberFormat("fr-DZ").format(amount);
  }

  function formatFeatureName(feature: PlanFeature) {
    const translations: { [key: string]: string } = {
      // Avec underscores (format BDD)
      "directory_listing": "Profil sur l'annuaire",
      "public_page": "Page publique",
      "manual_booking": "Gestion manuelle des RDV",
      "employee_accounts": "Comptes employés",
      "calendar_sync": "Synchronisation calendrier",
      "statistics": "Statistiques",
      "full_booking_management": "Gestion complète des réservations",
      "email_reminders": "Rappels par email",
      "basic_statistics": "Statistiques de base",
      "priority_support": "Support prioritaire",
      "all_starter_features": "Toutes les fonctionnalités Starter",
      "absence_management": "Gestion des absences",
      "variable_hours": "Horaires variables",
      "crm_basic": "CRM simplifié",
      "social_integration": "Intégration réseaux sociaux",
      "promo_campaigns": "Campagnes promotionnelles",
      "all_pro_features": "Toutes les fonctionnalités Pro",
      "multi_salon": "Multi-salons",
      "advanced_dashboards": "Tableaux de bord avancés",
      "dedicated_support": "Support dédié",
      "custom_training": "Formation personnalisée",
      "api_integration": "Intégration API",
      "accounting_tools": "Outils de comptabilité",
      // Avec espaces (format fallback)
      "directory listing": "Profil sur l'annuaire",
      "public page": "Page publique",
      "manual booking": "Gestion manuelle des RDV",
      "employee accounts": "Comptes employés",
      "calendar sync": "Synchronisation calendrier",
      "full booking management": "Gestion complète des réservations",
      "email reminders": "Rappels par email",
      "basic statistics": "Statistiques de base",
      "priority support": "Support prioritaire",
      "all starter features": "Toutes les fonctionnalités Starter",
      "absence management": "Gestion des absences",
      "variable hours": "Horaires variables",
      "crm basic": "CRM simplifié",
      "social integration": "Intégration réseaux sociaux",
      "promo campaigns": "Campagnes promotionnelles",
      "all pro features": "Toutes les fonctionnalités Pro",
      "multi salon": "Multi-salons",
      "advanced dashboards": "Tableaux de bord avancés",
      "dedicated support": "Support dédié",
      "custom training": "Formation personnalisée",
      "api integration": "Intégration API",
      "accounting tools": "Outils de comptabilité",
    };
    
    // Gérer aussi les valeurs (ex: "1", "2", "5", "unlimited")
    const translated = translations[feature.feature_code] || feature.feature_code.replace(/_/g, " ");
    
    // Si la feature a une valeur numérique, l'ajouter
    if (feature.value && feature.value !== "true" && feature.value !== "false") {
      if (feature.feature_code === "employee_accounts") {
        return feature.value === "unlimited" ? "Employés illimités" : `${feature.value} compte${parseInt(feature.value) > 1 ? "s" : ""} employé${parseInt(feature.value) > 1 ? "s" : ""}`;
      }
      if (feature.feature_code === "multi_salon" && feature.value === "unlimited") {
        return "Multi-salons illimités";
      }
    }
    
    return translated;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">


      {/* Hero Section - Minimal */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Découvrez nos offres
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            {/* Optimisez la gestion de votre salon de coiffure avec nos solutions tout-en-un.
            <br /> */}
            Choisissez la formule qui correspond le mieux à vos besoins et faites passer votre entreprise au niveau supérieur.
          </p>
          {/* <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-700">Gestion simplifiée</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-700">Support dédié</span>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-700">Évolutif</span>
            </div>
          </div> */}
        </div>
        <div className="max-w-7xl mx-auto">
          {/* Vide - pas de hero dans le design fourni */}
        </div>
      </section>

      {/* Pricing Cards - Design minimaliste */}
      <section className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const { icon: Icon, color } = getPlanIcon(plan.code);
              const isPopular = plan.code === "pro";
              const isFree = plan.price_cents === 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                    isPopular ? "border-2 border-purple-500" : "border border-gray-200"
                  }`}
                >
                  {/* Icon */}
                  <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-full ${color} flex items-center justify-center`}>
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-6">
                    <div className="text-5xl font-bold text-black mb-1">
                      {isFree ? "Gratuit" : formatPrice(plan.price_cents)}
                      {!isFree && <span className="text-xl font-normal text-gray-600 ml-1">DA</span>}
                    </div>
                    <div className="text-sm text-gray-500">par mois</div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{formatFeatureName(feature)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Link href="/auth/pro" className="block">
                    <Button
                      className={`w-full rounded-lg ${
                        isPopular
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : isFree
                            ? "bg-white border border-black text-black hover:bg-gray-50"
                            : "bg-black text-white hover:bg-gray-800"
                      }`}
                    >
                      Choisir ce plan
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Toutes les fonctionnalités pour développer votre activité
            </h2>
            <p className="text-xl text-gray-600">
              Des outils professionnels pour gérer votre salon en toute simplicité
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Gestion des rendez-vous</CardTitle>
                <CardDescription>
                  Agenda intelligent, réservations en ligne 24/7, rappels automatiques pour réduire les absences
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Gestion d'équipe</CardTitle>
                <CardDescription>
                  Gérez vos employés, leurs horaires, absences et performances depuis une seule interface
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Statistiques & Rapports</CardTitle>
                <CardDescription>
                  Suivez votre chiffre d'affaires, vos clients fidèles et l'évolution de votre activité
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle>Communication client</CardTitle>
                <CardDescription>
                  Rappels SMS/Email automatiques, campagnes promotionnelles et fidélisation client
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Instagram className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle>Intégration réseaux sociaux</CardTitle>
                <CardDescription>
                  Connectez Instagram et Facebook pour recevoir des réservations directement depuis vos réseaux
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Marketing automation</CardTitle>
                <CardDescription>
                  Campagnes email automatisées, promotions ciblées et outils pour booster votre visibilité
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Prêt à digitaliser votre salon ?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Rejoignez des centaines de professionnels qui nous font confiance pour gérer leur activité
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/pro">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/pro#contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                Demander une démo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm">
            © 2025 YOKA. Tous droits réservés. | <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link> | <Link href="/cgv" className="hover:text-white">CGV</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
