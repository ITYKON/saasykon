"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, MapPin, Clock, Phone, Star, Upload, X, Plus, Edit2, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BusinessProfile {
  publicName: string
  description: string
  email: string
  phone: string
  website: string
  address: {
    line1: string
    line2: string
    postalCode: string
    city: string
    country: string
  }
  photos: string[]
  horaires: {
    [key: string]: {
      ouvert: boolean
      debut: string
      fin: string
    }
  }
}

export default function ProfilInstitutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<BusinessProfile>({
    publicName: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: {
      line1: '',
      line2: '',
      postalCode: '',
      city: '',
      country: 'France',
    },
    photos: [],
    horaires: {
      lundi: { ouvert: false, debut: '09:00', fin: '18:00' },
      mardi: { ouvert: false, debut: '09:00', fin: '18:00' },
      mercredi: { ouvert: false, debut: '09:00', fin: '18:00' },
      jeudi: { ouvert: false, debut: '09:00', fin: '18:00' },
      vendredi: { ouvert: false, debut: '09:00', fin: '18:00' },
      samedi: { ouvert: false, debut: '09:00', fin: '18:00' },
      dimanche: { ouvert: false, debut: '09:00', fin: '18:00' },
    },
  })

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await fetch('/api/pro/business/profile')
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du profil')
        }
        const data = await response.json()
        const business = data.business
        const primaryLocation = business.business_locations?.[0] || {}

        const horaires: BusinessProfile['horaires'] = {
          lundi: { ouvert: false, debut: '09:00', fin: '18:00' },
          mardi: { ouvert: false, debut: '09:00', fin: '18:00' },
          mercredi: { ouvert: false, debut: '09:00', fin: '18:00' },
          jeudi: { ouvert: false, debut: '09:00', fin: '18:00' },
          vendredi: { ouvert: false, debut: '09:00', fin: '18:00' },
          samedi: { ouvert: false, debut: '09:00', fin: '18:00' },
          dimanche: { ouvert: false, debut: '09:00', fin: '18:00' },
        }

        if (business.working_hours) {
          const dayMap: Record<number, string> = {
            0: 'dimanche',
            1: 'lundi',
            2: 'mardi',
            3: 'mercredi',
            4: 'jeudi',
            5: 'vendredi',
            6: 'samedi',
          }

          business.working_hours.forEach((wh: any) => {
            const dayName = dayMap[wh.weekday]
            if (dayName) {
              horaires[dayName as keyof typeof horaires] = {
                ouvert: wh.is_open,
                debut: wh.start_time || '09:00',
                fin: wh.end_time || '18:00',
              }
            }
          })
        }

        setFormData({
          publicName: business.public_name || '',
          description: business.description || '',
          email: business.email || '',
          phone: business.phone || '',
          website: business.website || '',
          address: {
            line1: primaryLocation.address_line1 || '',
            line2: primaryLocation.address_line2 || '',
            postalCode: primaryLocation.postal_code || '',
            city: primaryLocation.city_name || '',
            country: primaryLocation.country_name || 'France',
          },
          photos: business.business_media?.map((media: any) => media.url) || [],
          horaires,
        })
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les informations du profil',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch('/api/pro/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicName: formData.publicName,
          description: formData.description,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          workingHours: formData.horaires,
          photos: formData.photos,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil')
      }

      toast({
        title: 'Succès',
        description: 'Votre profil a été mis à jour avec succès',
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour du profil',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleHoraireChange = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      horaires: {
        ...prev.horaires,
        [day]: {
          ...prev.horaires[day as keyof typeof prev.horaires],
          [field]: value,
        },
      },
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Ici, vous devriez implémenter la logique de téléchargement des fichiers
    // Pour l'instant, nous allons simplement simuler un téléchargement réussi
    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file))
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos],
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profil de l'institut</h1>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </div>

      <Tabs defaultValue="informations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="horaires">Horaires</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit2 className="h-5 w-5" />
                  Informations générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publicName">Nom de l'établissement</Label>
                  <Input
                    id="publicName"
                    name="publicName"
                    value={formData.publicName}
                    onChange={handleInputChange}
                    placeholder="Nom de votre institut"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez votre établissement"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="contact@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.exemple.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address.line1">Adresse</Label>
                  <Input
                    id="address.line1"
                    name="address.line1"
                    value={formData.address.line1}
                    onChange={handleInputChange}
                    placeholder="123 rue de l'exemple"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.line2">Complément d'adresse</Label>
                  <Input
                    id="address.line2"
                    name="address.line2"
                    value={formData.address.line2}
                    onChange={handleInputChange}
                    placeholder="Bâtiment, étage, etc."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.postalCode">Code postal</Label>
                    <Input
                      id="address.postalCode"
                      name="address.postalCode"
                      value={formData.address.postalCode}
                      onChange={handleInputChange}
                      placeholder="75000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address.city">Ville</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      placeholder="Paris"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address.country">Pays</Label>
                  <Input
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="France"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Galerie photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Ajouter des photos</span>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
                {Object.entries(formData.horaires).map(([day, horaire]) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Switch
                        id={`${day}-active`}
                        checked={horaire.ouvert}
                        onCheckedChange={(checked) =>
                          handleHoraireChange(day, 'ouvert', checked)
                        }
                      />
                      <Label htmlFor={`${day}-active`} className="capitalize">
                        {day}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={horaire.debut}
                        onChange={(e) =>
                          handleHoraireChange(day, 'debut', e.target.value)
                        }
                        disabled={!horaire.ouvert}
                        className="w-28"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={horaire.fin}
                        onChange={(e) =>
                          handleHoraireChange(day, 'fin', e.target.value)
                        }
                        disabled={!horaire.ouvert}
                        className="w-28"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parametres" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de réservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Activer les réservations en ligne</Label>
                    <p className="text-sm text-muted-foreground">
                      Permettre aux clients de prendre rendez-vous en ligne
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmation automatique</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmer automatiquement les rendez-vous
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Paiement en ligne</Label>
                    <p className="text-sm text-muted-foreground">
                      Accepter les paiements en ligne
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Nouvelle réservation</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir une notification pour chaque nouvelle réservation
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rappel de rendez-vous</Label>
                    <p className="text-sm text-muted-foreground">
                      Envoyer un rappel aux clients avant le rendez-vous
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Newsletter</Label>
                    <p className="text-sm text-muted-foreground">
                      Recevoir des actualités et des conseils
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" className="mr-2">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer les paramètres'
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
