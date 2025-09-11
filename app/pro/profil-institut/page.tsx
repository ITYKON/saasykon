"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, MapPin, Clock, Phone, Star, Upload, X, Plus, Edit2 } from "lucide-react"

export default function ProfilInstitutPage() {
  const [photos, setPhotos] = useState([
    "/elegant-beauty-salon-interior-with-warm-lighting-a.jpg",
    "/modern-beauty-salon-with-professional-hairstylist-.jpg",
    "/modern-beauty-salon-with-stylish-people-getting-ha.jpg",
  ])

  const [horaires, setHoraires] = useState({
    lundi: { ouvert: true, debut: "09:00", fin: "18:00" },
    mardi: { ouvert: true, debut: "09:00", fin: "18:00" },
    mercredi: { ouvert: true, debut: "09:00", fin: "18:00" },
    jeudi: { ouvert: true, debut: "09:00", fin: "18:00" },
    vendredi: { ouvert: true, debut: "09:00", fin: "18:00" },
    samedi: { ouvert: true, debut: "09:00", fin: "16:00" },
    dimanche: { ouvert: false, debut: "", fin: "" },
  })

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const updateHoraire = (jour: string, field: string, value: any) => {
    setHoraires((prev) => ({
      ...prev,
      [jour]: { ...prev[jour], [field]: value },
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration du profil</h1>
            <p className="text-gray-600 mt-1">Personnalisez l'apparence de votre institut</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Aperçu</Button>
            <Button className="bg-black hover:bg-gray-800">Sauvegarder</Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="informations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="horaires">Horaires</TabsTrigger>
            <TabsTrigger value="parametres">Paramètres</TabsTrigger>
          </TabsList>

          {/* Onglet Informations */}
          <TabsContent value="informations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informations générales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit2 className="h-5 w-5" />
                    Informations générales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nom">Nom de l'institut</Label>
                    <Input id="nom" defaultValue="PAVANA" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre institut..."
                      className="mt-1 min-h-[100px]"
                      defaultValue="Salon de coiffure moderne situé au cœur d'Hydra, offrant des services de qualité dans un cadre élégant et professionnel."
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialites">Spécialités</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">Coiffure</Badge>
                      <Badge variant="secondary">Coloration</Badge>
                      <Badge variant="secondary">Brushing</Badge>
                      <Button variant="outline" size="sm" className="h-6 bg-transparent">
                        <Plus className="h-3 w-3 mr-1" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Coordonnées */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Coordonnées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input id="adresse" defaultValue="24 Rue Hadj Ahmed Mohamed, 16000 Hydra" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ville">Ville</Label>
                      <Input id="ville" defaultValue="Hydra" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="codePostal">Code postal</Label>
                      <Input id="codePostal" defaultValue="16000" className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" defaultValue="+213 555 123 456" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="contact@pavana.dz" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="website">Site web</Label>
                    <Input id="website" placeholder="https://..." className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude</Label>
                        <Input id="latitude" defaultValue="36.7538" className="mt-1" />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude</Label>
                        <Input id="longitude" defaultValue="3.0588" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="transport">Transports à proximité</Label>
                      <Textarea
                        id="transport"
                        placeholder="Métro, bus, parking..."
                        className="mt-1"
                        defaultValue="Métro ligne 1 - Station Hydra (5 min à pied)\nParking gratuit disponible"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p>Aperçu de la carte</p>
                      <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                        Configurer la carte
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Photos */}
          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Galerie photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === 0 && <Badge className="absolute top-2 left-2 bg-blue-600">Photo principale</Badge>}
                    </div>
                  ))}

                  {/* Zone d'upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 text-center">
                      Cliquez pour ajouter
                      <br />
                      une photo
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Conseils pour vos photos</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Utilisez des photos de haute qualité (min. 1200x800px)</li>
                    <li>• Montrez l'intérieur de votre salon sous différents angles</li>
                    <li>• Incluez des photos de vos réalisations</li>
                    <li>• Maximum 10 photos recommandé</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Horaires */}
          <TabsContent value="horaires" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horaires d'ouverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(horaires).map(([jour, horaire]) => (
                    <div key={jour} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-20">
                          <span className="font-medium capitalize">{jour}</span>
                        </div>
                        <Switch
                          checked={horaire.ouvert}
                          onCheckedChange={(checked) => updateHoraire(jour, "ouvert", checked)}
                        />
                      </div>

                      {horaire.ouvert ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={horaire.debut}
                            onChange={(e) => updateHoraire(jour, "debut", e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">à</span>
                          <Input
                            type="time"
                            value={horaire.fin}
                            onChange={(e) => updateHoraire(jour, "fin", e.target.value)}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-500">Fermé</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Horaires spéciaux</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Configurez des horaires différents pour les jours fériés ou événements spéciaux.
                  </p>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter des horaires spéciaux
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="parametres" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Paramètres de réservation */}
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres de réservation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Réservation en ligne</Label>
                      <p className="text-sm text-gray-600">Permettre aux clients de réserver en ligne</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Confirmation automatique</Label>
                      <p className="text-sm text-gray-600">Confirmer automatiquement les réservations</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div>
                    <Label htmlFor="delaiAnnulation">Délai d'annulation (heures)</Label>
                    <Select defaultValue="24">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 heures</SelectItem>
                        <SelectItem value="6">6 heures</SelectItem>
                        <SelectItem value="12">12 heures</SelectItem>
                        <SelectItem value="24">24 heures</SelectItem>
                        <SelectItem value="48">48 heures</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="avanceReservation">Réservation à l'avance (jours)</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 jours</SelectItem>
                        <SelectItem value="14">14 jours</SelectItem>
                        <SelectItem value="30">30 jours</SelectItem>
                        <SelectItem value="60">60 jours</SelectItem>
                        <SelectItem value="90">90 jours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Paramètres d'affichage */}
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres d'affichage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Afficher les prix</Label>
                      <p className="text-sm text-gray-600">Montrer les prix sur votre profil public</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Afficher les avis</Label>
                      <p className="text-sm text-gray-600">Permettre l'affichage des avis clients</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Profil vérifié</Label>
                      <p className="text-sm text-gray-600">Badge de vérification sur votre profil</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Star className="h-3 w-3 mr-1" />
                      Vérifié
                    </Badge>
                  </div>

                  <div>
                    <Label htmlFor="langue">Langue par défaut</Label>
                    <Select defaultValue="fr">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications par email</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Nouvelles réservations</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Annulations</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Nouveaux avis</Label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notifications SMS</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Rappels de RDV</Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Confirmations</Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Promotions</Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
