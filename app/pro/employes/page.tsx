"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Calendar, Clock, Phone, Mail, User, Eye } from "lucide-react"

// Chargé dynamiquement depuis l'API
type UIEmployee = {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar?: string | null
  role: string
  services: string[]
  workDays: string[]
  restDays: string[]
  workHours: string
  status: string
  totalClients?: number
  rating?: number
}

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
  const [items, setItems] = useState<UIEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [editStatus, setEditStatus] = useState<string>("Actif")
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [viewEmployee, setViewEmployee] = useState<UIEmployee | null>(null)
  // Add modal states
  const [addDays, setAddDays] = useState<Set<string>>(new Set())
  const [addStart, setAddStart] = useState<string>("09:00")
  const [addEnd, setAddEnd] = useState<string>("18:00")
  // Edit modal states
  const [editDays, setEditDays] = useState<Set<string>>(new Set())
  const [editStart, setEditStart] = useState<string>("09:00")
  const [editEnd, setEditEnd] = useState<string>("18:00")

  function fmt(val: string | Date): string {
    let d: Date
    if (typeof val === "string") {
      const s = val.trim()
      if (s.includes("T")) {
        d = new Date(s)
      } else {
        const base = s.length === 5 ? `${s}:00` : s
        d = new Date(`1970-01-01T${base}Z`)
      }
    } else {
      d = new Date(val)
    }
    if (isNaN(d.getTime())) return ""
    return d.toISOString().substring(11, 16)
  }

  function weekdayName(n: number): string {
    return ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][n]
  }

  async function loadEmployees() {
    setLoading(true)
    try {
      const bidMatch = document.cookie.match(/(?:^|; )business_id=([^;]+)/)
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : ""
      const q = new URLSearchParams()
      if (businessId) q.set("business_id", businessId)
      q.set("include", "roles,services,hours")
      q.set("limit", "200")
      const res = await fetch(`/api/pro/employees?${q.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement")
      const list = Array.isArray(data?.items) ? data.items : []
      const out: UIEmployee[] = list.map((emp: any) => {
        const servicesNames: string[] = (emp.employee_services || []).map((x: any) => x.services?.name).filter(Boolean)
        const hours = (emp.working_hours || [])
        let minStart: string | null = null
        let maxEnd: string | null = null
        const workDaysNames: string[] = []
        for (const h of hours) {
          try {
            const wd = Number(h.weekday)
            workDaysNames.push(weekdayName(wd))
            const st = fmt(h.start_time)
            const en = fmt(h.end_time)
            if (!minStart || st < minStart) minStart = st
            if (!maxEnd || en > maxEnd) maxEnd = en
          } catch {}
        }
        const workSet = new Set(workDaysNames)
        const rest = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi","Dimanche"].filter((d) => !workSet.has(d))
        const role = (emp.employee_roles?.[0]?.role as string) || ""
        return {
          id: emp.id,
          name: emp.full_name,
          email: emp.email || null,
          phone: emp.phone || null,
          avatar: null,
          role,
          services: servicesNames,
          workDays: Array.from(workSet),
          restDays: rest,
          workHours: minStart && maxEnd ? `${minStart} - ${maxEnd}` : "",
          status: emp.is_active ? "Actif" : "Inactif",
        }
      })
      setItems(out)
    } catch (e) {
      // ignore for now
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  useEffect(() => {
    if (isEditDialogOpen && selectedEmployee) {
      setEditStatus(selectedEmployee.status || "Actif")
      setEditDays(new Set(selectedEmployee.workDays || []))
      const parts = (selectedEmployee.workHours || "").split(" - ")
      setEditStart(parts[0] || "09:00")
      setEditEnd(parts[1] || "18:00")
    }
  }, [isEditDialogOpen, selectedEmployee])

  useEffect(() => {
    if (isAddDialogOpen) {
      setAddDays(new Set())
      setAddStart("09:00")
      setAddEnd("18:00")
    }
  }, [isAddDialogOpen])

  async function handleAddEmployee() {
    const nameEl = document.getElementById("name") as HTMLInputElement | null
    const emailEl = document.getElementById("email") as HTMLInputElement | null
    const phoneEl = document.getElementById("phone") as HTMLInputElement | null
    // times come from controlled state
    const roleEl = document.getElementById("role") as HTMLInputElement | null

    const full_name = nameEl?.value?.trim() || ""
    const email = emailEl?.value?.trim() || ""
    const phone = phoneEl?.value?.trim() || ""
    const start_time = addStart || "09:00"
    const end_time = addEnd || "18:00"

    if (!full_name) {
      alert("Nom complet requis")
      return
    }

    try {
      const bidMatch = document.cookie.match(/(?:^|; )business_id=([^;]+)/)
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : ""
      const q = businessId ? `?business_id=${encodeURIComponent(businessId)}` : ""
      // 1) Create employee
      const createRes = await fetch(`/api/pro/employees${q}` , {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email: email || undefined, phone: phone || undefined }),
      })
      const created = await createRes.json()
      if (!createRes.ok) throw new Error(created?.error || "Erreur de création")

      const empId: string = created.id

      // Services non affectés à ce stade (ignorés à la création)

      // Gather working days checkboxes -> map to weekday indexes
      const selectedDays = Array.from(addDays)
      const dayIndex: Record<string, number> = {
        "Lundi": 1,
        "Mardi": 2,
        "Mercredi": 3,
        "Jeudi": 4,
        "Vendredi": 5,
        "Samedi": 6,
        "Dimanche": 0,
      }
      const hours = selectedDays.map((d) => ({ weekday: dayIndex[d], start_time, end_time, breaks: [] }))
      if (hours.length) {
        const hrsPut = await fetch(`/api/pro/employees/${empId}/hours`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours }),
        })
        if (!hrsPut.ok) {
          const j = await hrsPut.json().catch(() => ({}))
          throw new Error(j?.error || "Échec de l'enregistrement des horaires")
        }
      }

      // Optional: store role as an internal label if provided
      const roleVal = roleEl?.value?.trim()
      if (roleVal) {
        await fetch(`/api/pro/employees/${empId}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: [roleVal] }),
        }).catch(() => {})
      }

      alert("Employé ajouté")
      setIsAddDialogOpen(false)
      await loadEmployees()
    } catch (e: any) {
      alert(e?.message || "Impossible d'ajouter l'employé")
    }
  }

  const filteredEmployees = items
    .filter((e) => e.status === "Actif")
    .filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.role.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    setIsEditDialogOpen(true)
  }

  const handleViewEmployee = (employee: UIEmployee) => {
    setViewEmployee(employee)
    setIsViewDialogOpen(true)
  }

  async function handleDeleteEmployee(id: string) {
    if (!confirm("Supprimer cet employé ?")) return
    try {
      const res = await fetch(`/api/pro/employees/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Suppression impossible")
      await loadEmployees()
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la suppression")
    }
  }

  async function handleSaveEdit() {
    if (!selectedEmployee?.id) return
    const nameEl = document.getElementById("edit-name") as HTMLInputElement | null
    const emailEl = document.getElementById("edit-email") as HTMLInputElement | null
    const phoneEl = document.getElementById("edit-phone") as HTMLInputElement | null
    const roleEl = document.getElementById("edit-role") as HTMLInputElement | null
    // times come from controlled state

    const full_name = nameEl?.value?.trim() || ""
    const email = emailEl?.value?.trim() || ""
    const phone = phoneEl?.value?.trim() || ""
    const roleVal = roleEl?.value?.trim() || ""
    const start_time = editStart || "09:00"
    const end_time = editEnd || "18:00"

    if (!full_name) {
      alert("Nom complet requis")
      return
    }

    try {
      const is_active = editStatus === "Actif"
      const res = await fetch(`/api/pro/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email: email || undefined, phone: phone || undefined, is_active }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Mise à jour impossible")

      if (roleVal) {
        await fetch(`/api/pro/employees/${selectedEmployee.id}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: [roleVal] }),
        }).catch(() => {})
      } else {
        // vide => retire les rôles
        await fetch(`/api/pro/employees/${selectedEmployee.id}/roles`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roles: [] }),
        }).catch(() => {})
      }

      // Pas d'affectation de services dans la modale Modifier

      const selectedDays = Array.from(editDays)
      const dayIndex: Record<string, number> = { "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6, "Dimanche": 0 }
      const hours = selectedDays.map((d) => ({ weekday: dayIndex[d], start_time, end_time, breaks: [] }))
      {
        const hrsPut = await fetch(`/api/pro/employees/${selectedEmployee.id}/hours`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours }),
        })
        if (!hrsPut.ok) {
          const j = await hrsPut.json().catch(() => ({}))
          throw new Error(j?.error || "Échec de l'enregistrement des horaires")
        }
      }

      setIsEditDialogOpen(false)
      await loadEmployees()
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la mise à jour")
    }
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
                {/* Services non affectés à l'ajout */}
                <div>
                  <Label>Jours de travail</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {workDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox id={day} checked={addDays.has(day)} onCheckedChange={(v) => {
                          const next = new Set(addDays)
                          if (v) next.add(day); else next.delete(day)
                          setAddDays(next)
                        }} />
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
                    <Input id="startTime" type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Heure de fin</Label>
                    <Input id="endTime" type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="bg-black text-white hover:bg-gray-800" onClick={handleAddEmployee}>Ajouter l'employé</Button>
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
                          Jours de travail
                        </div>
                        <p className="font-medium">{employee.workDays.join(", ")}</p>
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
                      <Button variant="outline" size="sm" onClick={() => handleViewEmployee(employee)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditEmployee(employee)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View Employee Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails de l'employé</DialogTitle>
            </DialogHeader>
            {viewEmployee && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nom complet</Label>
                    <div className="mt-1 font-medium">{viewEmployee.name}</div>
                  </div>
                  <div>
                    <Label>Poste</Label>
                    <div className="mt-1">{viewEmployee.role || "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1">{viewEmployee.email || "-"}</div>
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <div className="mt-1">{viewEmployee.phone || "-"}</div>
                  </div>
                </div>
                <div>
                  <Label>Services proposés</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewEmployee.services.length ? viewEmployee.services.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    )) : <div>-</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horaires</Label>
                    <div className="mt-1">{viewEmployee.workHours || "-"}</div>
                  </div>
                  <div>
                    <Label>Repos</Label>
                    <div className="mt-1">{viewEmployee.restDays.join(", ") || "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Statut</Label>
                    <div className="mt-1">{viewEmployee.status}</div>
                  </div>
                  <div>
                    <Label>ID</Label>
                    <div className="mt-1 text-xs text-gray-500 break-all">{viewEmployee.id}</div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Fermer</Button>
            </div>
          </DialogContent>
        </Dialog>

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
                {/* Services non modifiés ici */}
                <div>
                  <Label>Jours de travail</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {workDays.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox id={`edit-day-${day}`} checked={editDays.has(day)} onCheckedChange={(v) => {
                          const next = new Set(editDays)
                          if (v) next.add(day); else next.delete(day)
                          setEditDays(next)
                        }} />
                        <Label htmlFor={`edit-day-${day}`} className="text-sm">{day}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startTime">Heure de début</Label>
                    <Input id="edit-startTime" type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="edit-endTime">Heure de fin</Label>
                    <Input id="edit-endTime" type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
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
              <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSaveEdit}>Sauvegarder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
