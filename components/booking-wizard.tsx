"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ChevronLeft, Star } from "lucide-react"
import Link from "next/link"

interface BookingWizardProps {
  salon: any
  onClose: () => void
}

export default function BookingWizard({ salon, onClose }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")

  const steps = ["Prestation sélectionnée", "Choix de la date & heure", "Identification"]

  const timeSlots = ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]

  const weekDays = [
    { day: "mardi", date: "17 sept", available: true },
    { day: "mercredi", date: "18 sept", available: true },
    { day: "jeudi", date: "19 sept", available: true },
    { day: "vendredi", date: "20 sept", available: false },
    { day: "samedi", date: "21 sept", available: true },
    { day: "dimanche", date: "22 sept", available: false },
    { day: "lundi", date: "23 sept", available: true },
  ]

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">COUPE 2,200 DA</h3>
            <p className="text-sm text-gray-600">30min - avec SOUSOU HAMICHE</p>
          </div>
          <Button variant="link" className="text-blue-600 p-0">
            Supprimer
          </Button>
        </div>
        <Button variant="outline" size="sm" className="mt-3 bg-transparent">
          Ajouter une prestation à la suite
        </Button>
      </div>

      <div>
        <h3 className="font-semibold mb-4">2. Choix de la date & heure</h3>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day, index) => (
            <button
              key={index}
              className={`p-2 text-center rounded-lg border ${
                day.available
                  ? "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                  : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!day.available}
            >
              <div className="text-xs font-medium">{day.day}</div>
              <div className="text-xs">{day.date}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <Button
              key={time}
              variant="outline"
              size="sm"
              className="text-sm bg-transparent"
              onClick={() => {
                setSelectedTime(time)
                setCurrentStep(2)
              }}
            >
              {time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">2. Date et heure sélectionnées</h3>
        <div className="flex justify-between items-center">
          <span>samedi 20 septembre 2025 à 10:30</span>
          <Button variant="link" className="text-blue-600 p-0">
            Modifier
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">3. Identification</h3>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-4">Nouveau sur Planity ?</p>
            <Button className="w-full bg-gray-100 text-black hover:bg-gray-200">Créer mon compte</Button>
          </div>

          <div className="text-center">
            <span className="text-gray-500">OU</span>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium mb-4">Vous avez déjà utilisé Planity ?</p>
            <Button className="w-full bg-black text-white hover:bg-gray-800">Se connecter</Button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="phone">Téléphone portable *</Label>
          <div className="flex mt-1">
            <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
              <span className="text-sm">🇩🇿</span>
            </div>
            <Input id="phone" type="tel" className="rounded-l-none" placeholder="Entrez votre numéro..." />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" className="mt-1" placeholder="Email" />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe *</Label>
          <Input id="password" type="password" className="mt-1" placeholder="Mot de passe" />
        </div>
      </div>

      <Button className="w-full bg-black text-white hover:bg-gray-800">Créer mon compte</Button>

      <div className="text-xs text-gray-500 leading-relaxed">
        Mes informations sont traitées par Planity, consultez notre{" "}
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

      <Button variant="outline" className="w-full bg-transparent">
        Se connecter
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black tracking-wide">
              PLANITY
            </Link>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">
                    {currentStep === 1 && "1. Prestation sélectionnée"}
                    {currentStep === 2 && "2. Date et heure sélectionnées"}
                    {currentStep === 3 && "3. Identification"}
                  </CardTitle>
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Retour
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Salon Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">{salon.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{salon.address}</p>

                <div className="text-center mb-4">
                  <div className="text-2xl font-bold">{salon.ratings.overall}</div>
                  <div className="flex justify-center mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">{salon.reviewCount} clients ont donné leur avis</p>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Accueil</span>
                    <span className="font-medium">{salon.ratings.welcome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Propreté</span>
                    <span className="font-medium">{salon.ratings.cleanliness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cadre & Ambiance</span>
                    <span className="font-medium">{salon.ratings.atmosphere}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Qualité</span>
                    <span className="font-medium">{salon.ratings.quality}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hours */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Horaires d'ouverture</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(salon.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="font-medium">{day}</span>
                      <span className={hours === "Fermé" ? "text-red-600" : "text-gray-600"}>{hours}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
