"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Check, Crown, Star, Zap, Calendar, CreditCard, ArrowRight, AlertCircle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export default function AbonnementPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const plansRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [plansRes, subRes] = await Promise.all([
          fetch("/api/public/plans", { cache: "no-store" }),
          fetch("/api/pro/subscription", { cache: "no-store" }),
        ])
        if (!plansRes.ok) throw new Error("Impossible de récupérer les plans")
        if (!subRes.ok && subRes.status !== 404) throw new Error("Impossible de récupérer l'abonnement")
        const plansJson = await plansRes.json()
        const subJson = subRes.status === 404 ? { subscription: null } : await subRes.json()
        if (!cancelled) {
          setPlans(plansJson?.plans || [])
          setSubscription(subJson?.subscription || null)
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erreur")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const currentPlan = useMemo(() => {
    const plan = subscription?.plans
    const name = plan?.name || "—"
    const priceCents = plan?.price_cents ?? 0
    const price = priceCents > 0 ? `${(priceCents / 100).toFixed(0)}€` : "0€"
    const interval = (plan?.billing_interval || "month").toLowerCase()
    const period = interval.startsWith("year") ? "an" : "mois"
    const end = subscription?.current_period_end ? new Date(subscription.current_period_end) : null
    const now = new Date()
    const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0
    const renewalDate = end ? end.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "—"
    const features = (plan?.plan_features || []).map((f: any) => `${f.feature_code}${f.value ? `: ${f.value}` : ""}`)
    return {
      name,
      price,
      period,
      renewalDate,
      daysLeft,
      features,
      usage: {
        employees: { current: 0, max: 0 },
        photos: { current: 0, max: 0 },
        bookings: { current: 0, max: "Illimité" as any },
      },
    }
  }, [subscription])

  const decoratedPlans = useMemo(() => {
    const subPlanId = subscription?.plan_id
    return (plans || []).map((p) => {
      const period = (p.billing_interval || "month").toLowerCase().startsWith("year") ? "an" : "mois"
      const price = `${(p.price_cents / 100).toFixed(0)}€`
      const isCurrent = subPlanId && p.id === subPlanId
      const isPremium = p.code?.toLowerCase()?.includes("premium") || p.price_cents === Math.max(...(plans.map((x:any)=>x.price_cents) || [p.price_cents]))
      const isPopular = p.code?.toLowerCase()?.includes("pro") || (!isPremium && p.price_cents === Math.round(((Math.min(...(plans.map((x:any)=>x.price_cents) || [p.price_cents])) + Math.max(...(plans.map((x:any)=>x.price_cents) || [p.price_cents])))/2)))
      return {
        id: p.id,
        name: p.name,
        price,
        period,
        description: "",
        features: (p.features || p.plan_features || []).map((f: any) => f.value ? `${f.feature_code}: ${f.value}` : f.feature_code),
        color: isPremium ? "bg-gradient-to-r from-yellow-400 to-yellow-600" : (isCurrent ? "bg-black" : "bg-gray-100"),
        textColor: isPremium ? "text-black" : (isCurrent ? "text-white" : "text-gray-900"),
        current: !!isCurrent,
        popular: !!isPopular,
        premium: !!isPremium,
      }
    })
  }, [plans, subscription])

  async function changePlan(planId: number) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/pro/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId }),
      })
      if (!res.ok) throw new Error("Échec de la mise à jour du plan")
      const json = await res.json()
      setSubscription(json.subscription)
    } catch (e: any) {
      setError(e?.message || "Erreur")
    } finally {
      setSaving(false)
    }
  }

  async function toggleCancel(cancel: boolean) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/pro/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: cancel ? "cancel" : "resume" }),
      })
      if (!res.ok) throw new Error("Échec de l'opération")
      const json = await res.json()
      setSubscription(json.subscription)
    } catch (e: any) {
      setError(e?.message || "Erreur")
    } finally {
      setSaving(false)
    }
  }

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
                {subscription ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {subscription.status === "TRIALING" ? "Essai gratuit" : (subscription.cancel_at_period_end ? "Résilie à la fin de période" : "Actif")}
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">Aucun</Badge>
                    <Button size="sm" variant="outline" onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                      Choisir un plan
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!subscription && (
                  <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3">
                    Aucun abonnement actif. Choisissez un plan ci-dessous pour démarrer.
                  </div>
                )}
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
                <span className="font-medium">Non défini</span>
              </div>
              {subscription && (
                subscription.cancel_at_period_end ? (
                  <Button disabled={saving} onClick={() => toggleCancel(false)} variant="outline" className="w-full bg-transparent">
                    Reprendre l'abonnement
                  </Button>
                ) : (
                  <Button disabled={saving} onClick={() => toggleCancel(true)} variant="outline" className="w-full bg-transparent">
                    Annuler à la fin de période
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trial Ending Notice or Generic Upgrade Notice */}
        {subscription?.status === "TRIALING" && currentPlan.daysLeft <= 15 ? (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-1">Votre essai gratuit se termine dans {currentPlan.daysLeft} jour{currentPlan.daysLeft > 1 ? 's' : ''}</h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    Choisissez un plan pour continuer à profiter de toutes les fonctionnalités sans interruption.
                  </p>
                  <Button onClick={() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                    Choisir un plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
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
        )}

        {/* All Plans */}
        <div className="mb-8" ref={plansRef}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tous nos plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {decoratedPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.current ? "ring-2 ring-black" : ""}`}>
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
                <div className="absolute -top-3 right-2">
                  <Badge className="bg-yellow-500 text-black">
                    2 mois offerts
                  </Badge>
                </div>

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
                    {plan.features.map((feature: string, index: number) => (
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
                      disabled={saving || loading}
                      onClick={() => changePlan(plan.id)}
                    >
                      {"Passer au " + plan.name}
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
              {currentPlan.features.map((feature: string, index: number) => (
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
