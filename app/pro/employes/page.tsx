"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Calendar, Clock, Phone, Mail, User } from "lucide-react"

const employees = [
  {
    id: 1,
    name: "SOUSSOU HAMICHE",
    email: "soussou@pavana.dz",
    phone: "+213 555 123 456",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Coiffeur Senior",
    services: ["Coupe", "Coloration", "Brushing"],
    workDays: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    restDays: ["Dimanche"],
    workHours: "09:00 - 18:00",
    status: "Actif",
    joinDate: "15 mars 2023",
    totalClients: 156,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Amina Khelifi",
    email: "amina.k@pavana.dz",
    phone: "+213 555 789 012",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Esthéticienne",
    services: ["Soin visage", "Épilation", "Manucure"],
    workDays: ["Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    restDays: ["Lundi", "Dimanche"],
    workHours: "10:00 - 17:00",
    status: "Actif",
    joinDate: "22 juin 2023",
    totalClients: 89,
    rating: 4.9,
  },
  {
    id: 3,
    name: "Karim Benali",
    email: "karim.b@pavana.dz",
    phone: "+213 555 345 678",
    avatar: "/placeholder.svg?height=40&width=40",
    role: "Barbier",
    services: ["Coupe homme", "Barbe", "Rasage"],
    workDays: ["Lundi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    restDays: ["Mardi", "Dimanche"],
    workHours: "09:00 - 19:00",
    status: "En congé",
    joinDate: "10 janvier 2024",
    totalClients: 67,
    rating: 4.7,
  },
]

const services = [
  "Coupe",
  "Coloration",
  "Brushing",
  "Soin visage",
  "Épilation",
  "Manucure",
  "Pédicure",
  "Coupe homme",
  "Barbe",
  "Rasage",
  "Massage",
]

const workDays = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    setIsEditDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16"> */}
            {/* <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">PLANITY</h1>
              <div className="hidden md:flex items-center space-x-6 ml-8">
                <a href="/pro/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </a>
                <a href="/pro/agenda" className="text-gray-600 hover:text-gray-900">
                  Agenda
                </a>
                <a href="/pro/services" className="text-gray-600 hover:text-gray-900">
                  Services
                </a>
                <a href="/pro/clients" className="text-gray-600 hover:text-gray-900">
                  Clients
                </a>
                <a href="/pro/employes" className="text-gray-900 font-medium">
                  Employés
                </a>
              </div> */}
            {/* </div> */}
            {/* <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Je suis un professionnel de beauté
              </Button>
              <Button variant="default" size="sm" className="bg-black text-white hover:bg-gray-800">
                Mon compte
              </Button>
            </div> */}
          {/* </div>
        </div>
      </div> */}

      <div>
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des employés</h1>
          <p className="text-gray-600">Gérez votre équipe, leurs services et leurs horaires de travail.</p>
        </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="h-4 w-4 mr-2" />
                Nouvel employé
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel employé</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom complet</Label>
                    <Input id="name" placeholder="Nom de l'employé" />
                  </div>
                  <div>
                    <Label htmlFor="role">Poste</Label>
                    <Input id="role" placeholder="Ex: Coiffeur, Esthéticienne" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@exemple.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input id="phone" placeholder="+213 555 123 456" />
                  </div>
                </div>
                <div>
                  <Label>Services proposés</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {services.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox id={service} />
                        <Label htmlFor={service} className="text-sm">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Jours de travail</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {workDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox id={day} />
                        <Label htmlFor={day} className="text-sm">
                          {day}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Heure de début</Label>
                    <Input id="startTime" type="time" defaultValue="09:00" />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Heure de fin</Label>
                    <Input id="endTime" type="time" defaultValue="18:00" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-black text-white hover:bg-gray-800">Ajouter l'employé</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>
        </header>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

        </div>

        {/* Employees Grid */}
        <div className="grid gap-6">
          {filteredEmployees.map((employee) => (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Employee Info */}
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={employee.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        <Badge variant={employee.status === "Actif" ? "default" : "secondary"}>{employee.status}</Badge>
                      </div>
                      <p className="text-gray-600 mb-1">{employee.role}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {employee.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {employee.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services & Schedule */}
                  <div className="flex-1 lg:max-w-md">
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Services</h4>
                      <div className="flex flex-wrap gap-1">
                        {employee.services.map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Clock className="h-4 w-4" />
                          Horaires
                        </div>
                        <p className="font-medium">{employee.workHours}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Calendar className="h-4 w-4" />
                          Repos
                        </div>
                        <p className="font-medium">{employee.restDays.join(", ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{employee.totalClients}</div>
                      <div className="text-sm text-gray-500">Clients</div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-500">★</span>
                        <span className="text-sm font-medium">{employee.rating}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'employé</DialogTitle>
            </DialogHeader>
            {selectedEmployee && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nom complet</Label>
                    <Input id="edit-name" defaultValue={selectedEmployee.name} />
                  </div>
                  <div>
                    <Label htmlFor="edit-role">Poste</Label>
                    <Input id="edit-role" defaultValue={selectedEmployee.role} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" defaultValue={selectedEmployee.email} />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Téléphone</Label>
                    <Input id="edit-phone" defaultValue={selectedEmployee.phone} />
                  </div>
                </div>
                <div>
                  <Label>Services proposés</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {services.map((service) => (
                      <div key={service} className="flex items-center space-x-2">
                        <Checkbox id={`edit-${service}`} defaultChecked={selectedEmployee.services.includes(service)} />
                        <Label htmlFor={`edit-${service}`} className="text-sm">
                          {service}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select defaultValue={selectedEmployee.status}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="En congé">En congé</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button className="bg-black text-white hover:bg-gray-800">Sauvegarder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
