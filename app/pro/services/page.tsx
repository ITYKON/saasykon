import { Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProServices() {
  const services = [
    {
      id: 1,
      name: "COUPE + COIFFAGE",
      category: "Coiffure",
      duration: 30,
      price: 200,
      description: "Coupe personnalisée avec coiffage",
      active: true,
    },
    {
      id: 2,
      name: "BRUSHING",
      category: "Coiffure",
      duration: 45,
      price: 150,
      description: "Brushing professionnel",
      active: true,
    },
    {
      id: 3,
      name: "SHAMPOING",
      category: "Soins",
      duration: 10,
      price: 50,
      description: "Shampoing avec massage du cuir chevelu",
      active: true,
    },
    {
      id: 4,
      name: "MASQUE",
      category: "Soins",
      duration: 20,
      price: 100,
      description: "Masque nourrissant pour cheveux",
      active: true,
    },
    {
      id: 5,
      name: "COLORATION",
      category: "Coloration",
      duration: 120,
      price: 800,
      description: "Coloration complète avec soins",
      active: true,
    },
    {
      id: 6,
      name: "MÈCHES",
      category: "Coloration",
      duration: 90,
      price: 600,
      description: "Mèches avec technique au choix",
      active: false,
    },
  ]

  const categories = ["Coiffure", "Soins", "Coloration"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-black">Mes services</h1>
        <Button className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">{services.filter((s) => s.active).length}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Services actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Prix moyen</p>
                <p className="text-lg font-bold text-black">
                  {Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length)} DA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Durée moyenne</p>
                <p className="text-lg font-bold text-black">
                  {Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length)}min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">{categories.length}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Catégories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services by Category */}
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-black flex items-center justify-between">
              {category}
              <Badge variant="outline">
                {services.filter((s) => s.category === category).length} service
                {services.filter((s) => s.category === category).length > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services
                .filter((service) => service.category === category)
                .map((service) => (
                  <div
                    key={service.id}
                    className={`border rounded-lg p-4 ${
                      service.active ? "border-gray-200" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${service.active ? "text-black" : "text-gray-500"}`}>
                          {service.name}
                        </h3>
                        <p className={`text-sm ${service.active ? "text-gray-600" : "text-gray-400"}`}>
                          {service.description}
                        </p>
                      </div>
                      <Badge
                        variant={service.active ? "default" : "secondary"}
                        className={service.active ? "bg-green-100 text-green-800" : ""}
                      >
                        {service.active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration}min
                      </div>
                      <div className="text-lg font-bold text-black">{service.price} DA</div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Service Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-black">Ajouter un nouveau service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceName">Nom du service</Label>
              <Input id="serviceName" placeholder="Ex: COUPE + BRUSHING" />
            </div>
            <div>
              <Label htmlFor="serviceCategory">Catégorie</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="serviceDuration">Durée (minutes)</Label>
              <Input id="serviceDuration" type="number" placeholder="30" />
            </div>
            <div>
              <Label htmlFor="servicePrice">Prix (DA)</Label>
              <Input id="servicePrice" type="number" placeholder="200" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="serviceDescription">Description</Label>
              <Textarea id="serviceDescription" placeholder="Description du service..." rows={3} />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button className="bg-black text-white hover:bg-gray-800">Ajouter le service</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
