import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Check, Crown, Star, Zap, Calendar, CreditCard, ArrowRight, AlertCircle } from "lucide-react"

export default function AbonnementPage() {
  const currentPlan = {
    name: "Pro",
    price: "49€",
    period: "mois",
    renewalDate: "15 octobre 2025",
    daysLeft: 23,
    features: [
      "Agenda illimité",
      "Jusqu'à 5 employés",
      "Statistiques avancées",
      "Support prioritaire",
      "Galerie photos (50 images)",
      "Notifications SMS",
    ],
    usage: {
      employees: { current: 3, max: 5 },
      photos: { current: 32, max: 50 },
      bookings: { current: 847, max: "Illimité" },
    },
  }

  const plans = [
    {
      name: "Basic",
      price: "19€",
      period: "mois",
      description: "Parfait pour débuter",
      features: ["Agenda de base", "1 employé", "Statistiques simples", "Support email", "Galerie photos (10 images)"],
      color: "bg-gray-100",
      textColor: "text-gray-900",
      current: false,
    },
    {
      name: "Pro",
      price: "49€",
      period: "mois",
      description: "Le plus populaire",
      features: [
        "Agenda illimité",
        "Jusqu'à 5 employés",
        "Statistiques avancées",
        "Support prioritaire",
        "Galerie photos (50 images)",
        "Notifications SMS",
      ],
      color: "bg-black",
      textColor: "text-white",
      current: true,
      popular: true,
    },
    {
      name: "Premium",
      price: "99€",
      period: "mois",
      description: "Pour les grandes structures",
      features: [
        "Tout du Pro +",
        "Employés illimités",
        "Multi-établissements",
        "API personnalisée",
        "Galerie illimitée",
        "Manager dédié",
      ],
      color: "bg-gradient-to-r from-yellow-400 to-yellow-600",
      textColor: "text-black",
      current: false,
      premium: true,
    },
  ]

  return (
    <div>
      <div className="min-h-screen bg-gray-50">
              <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
          <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Abonnement</h1>
          <p className="text-gray-600">Gérez votre abonnement et découvrez nos offres</p>
        </div>
        </div>
        </div>
        </header>

        {/* Current Subscription Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Abonnement {currentPlan.name}
                  </CardTitle>
                  <CardDescription>Votre offre actuelle</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{currentPlan.price}</span>
                  <span className="text-gray-500">/{currentPlan.period}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Renouvellement le {currentPlan.renewalDate}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Jours restants</span>
                    <span className="font-medium">{currentPlan.daysLeft} jours</span>
                  </div>
                  <Progress value={(currentPlan.daysLeft / 30) * 100} className="h-2" />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {currentPlan.usage.employees.current}/{currentPlan.usage.employees.max}
                    </div>
                    <div className="text-sm text-gray-600">Employés</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      {currentPlan.usage.photos.current}/{currentPlan.usage.photos.max}
                    </div>
                    <div className="text-sm text-gray-600">Photos</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{currentPlan.usage.bookings.current}</div>
                    <div className="text-sm text-gray-600">Réservations ce mois</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Facturation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Prochaine facture</span>
                <span className="font-medium">{currentPlan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{currentPlan.renewalDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Méthode</span>
                <span className="font-medium">•••• 4242</span>
              </div>
              <Button variant="outline" className="w-full bg-transparent">
                Gérer la facturation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade Notice */}
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-1">Passez au Premium et économisez 20%</h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Débloquez toutes les fonctionnalités avancées et gérez plusieurs établissements.
                </p>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  Découvrir Premium
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Plans */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tous nos plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative ${plan.current ? "ring-2 ring-black" : ""}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-black text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Populaire
                    </Badge>
                  </div>
                )}
                {plan.premium && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}

                <CardHeader className={`${plan.color} ${plan.textColor} rounded-t-lg`}>
                  <CardTitle className="text-center">
                    <div className="text-2xl font-bold">{plan.name}</div>
                    <div className="text-3xl font-bold mt-2">
                      {plan.price}
                      <span className="text-lg font-normal">/{plan.period}</span>
                    </div>
                  </CardTitle>
                  <CardDescription
                    className={`text-center ${plan.textColor === "text-white" ? "text-gray-200" : "text-gray-600"}`}
                  >
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.current ? (
                    <Button disabled className="w-full">
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${
                        plan.name === "Premium"
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-500 hover:to-yellow-700"
                          : "bg-black hover:bg-gray-800 text-white"
                      }`}
                    >
                      {plan.name === "Basic" ? "Rétrograder" : "Passer au " + plan.name}
                      {plan.name !== "Basic" && <Zap className="h-4 w-4 ml-2" />}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features Included */}
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités incluses dans votre plan Pro</CardTitle>
            <CardDescription>Tout ce que vous pouvez faire avec votre abonnement actuel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentPlan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
