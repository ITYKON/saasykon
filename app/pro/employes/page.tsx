"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Calendar, Clock, Phone, Mail, User, Eye, Shield } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const ALL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

// Chargé dynamiquement depuis l'API
type UIEmployee = {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar?: string | null
  post: string
  role: string
  services: string[]
  workDays: string[]
  restDays: string[]
  workHours: string
  status: string
  totalClients?: number
  rating?: number
  // Account info
  hasAccount: boolean
  accessLevel?: string
  permissions?: string[]
  lastLoginAt?: string | null
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
  const [timeOff, setTimeOff] = useState<any[]>([])
  const [toStart, setToStart] = useState<string>("")
  const [toEnd, setToEnd] = useState<string>("")
  const [toReason, setToReason] = useState<string>("")
  const [overrides, setOverrides] = useState<any[]>([])
  const [ovDate, setOvDate] = useState<string>("")
  const [ovAvailable, setOvAvailable] = useState<boolean>(false)
  const [ovStart, setOvStart] = useState<string>("")
  const [ovEnd, setOvEnd] = useState<string>("")
  const [showTimeOffForm, setShowTimeOffForm] = useState<boolean>(false)
  const [showOverrideForm, setShowOverrideForm] = useState<boolean>(false)

  // Account management states
  const [proPermissions, setProPermissions] = useState<{ code: string; description?: string }[]>([])
  const [createEmail, setCreateEmail] = useState<string>("")
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([])
  const [employeeAccessRole, setEmployeeAccessRole] = useState<string>("")
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  const [permQuery, setPermQuery] = useState("")
  const [saving, setSaving] = useState(false)

  const employeeRoleOptions = [
    { value: "admin_institut", label: "Admin Institut" },
    { value: "receptionniste", label: "Réceptionniste" },
    { value: "praticienne", label: "Praticienne" },
  ]

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

  function upsertOverrideLocal(entry: { date: string; is_available: boolean; start_time?: string | null; end_time?: string | null }) {
    setOverrides((prev) => {
      const idx = prev.findIndex((o: any) => String(o.date).slice(0,10) === entry.date)
      const clean = { ...entry, start_time: entry.start_time || null, end_time: entry.end_time || null }
      if (idx >= 0) {
        const copy = prev.slice()
        copy[idx] = { ...prev[idx], ...clean }
        return copy
      }
      return [...prev, clean]
    })
  }

  async function handleSaveOverrides() {
    if (!selectedEmployee?.id) return
    setSaving(true)
    try {
      const payload = {
        overrides: overrides.map((o: any) => ({
          date: String(o.date).slice(0,10),
          is_available: !!o.is_available,
          start_time: o.start_time ? String(o.start_time).slice(0,5) : null,
          end_time: o.end_time ? String(o.end_time).slice(0,5) : null,
        }))
      }
      const res = await fetch(`/api/pro/employees/${selectedEmployee.id}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Enregistrement des exceptions échoué")
      alert("Exceptions enregistrées")
    } catch (e: any) {
      alert(e?.message || "Impossible d'enregistrer les exceptions")
    } finally {
      setSaving(false)
    }
  }

  function weekdayName(n: number): string {
    return ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][n]
  }

  async function loadEmployees() {
    setLoading(true)
    try {
      // Fetch employees and accounts in parallel or sequence
      const q = new URLSearchParams()
      q.set("include", "roles,services,hours")
      q.set("limit", "200")
      
      const [empRes, accRes] = await Promise.all([
        fetch(`/api/pro/employees?${q.toString()}`),
        fetch(`/api/pro/employee-accounts`)
      ]);

      const empData = await empRes.json()
      const accData = await accRes.json()

      if (!empRes.ok) throw new Error(empData?.error || "Erreur de chargement des employés")
      if (!accRes.ok) throw new Error(accData?.error || "Erreur de chargement des comptes")

      const list = Array.isArray(empData?.items) ? empData.items : []
      const accountMap = new Map(
        (Array.isArray(accData?.items) ? accData.items : []).map((acc: any) => [acc.id, acc])
      )

      const out: UIEmployee[] = list.map((emp: any) => {
        const servicesNames: string[] = Array.from(new Set((emp.employee_services || []).map((x: any) => x.services?.name).filter(Boolean) as string[]))
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
        
        const account = accountMap.get(emp.id) as any

        return {
          id: emp.id,
          name: emp.full_name,
          email: emp.email || account?.email || null,
          phone: emp.phone || null,
          avatar: null,
          role,
          post: emp.profession_label || "",
          services: servicesNames,
          workDays: Array.from(workSet),
          restDays: rest,
          workHours: minStart && maxEnd ? `${minStart} - ${maxEnd}` : "",
          status: emp.is_active ? "Actif" : "Inactif",
          hasAccount: !!account,
          accessLevel: account?.access_level || null,
          permissions: account?.permissions || [],
          lastLoginAt: account?.last_login_at || null,
        }
      })
      setItems(out)
    } catch (e) {
      console.error("Load error:", e)
      toast.error("Erreur de chargement des données")
    } finally {
      setLoading(false)
    }
  }

  async function loadProPermissions() {
    try {
      const res = await fetch(`/api/pro/pro-permissions`)
      const data = await res.json()
      if (res.ok) setProPermissions(data?.permissions || [])
    } catch {}
  }

  useEffect(() => {
    loadEmployees()
    loadProPermissions()
  }, [])

  useEffect(() => {
    if (isEditDialogOpen && selectedEmployee) {
      setEditStatus(selectedEmployee.status || "Actif")
      setEditDays(new Set(selectedEmployee.workDays || []))
      const parts = (selectedEmployee.workHours || "").split(" - ")
      setEditStart(parts[0] || "09:00")
      setEditEnd(parts[1] || "18:00")
      ;(async () => {
        try {
          const res = await fetch(`/api/pro/employees/${selectedEmployee.id}/time-off`)
          const data = await res.json().catch(() => ({}))
          if (res.ok && Array.isArray(data?.items)) setTimeOff(data.items)
        } catch {}
      })()
      ;(async () => {
        try {
          const now = new Date()
          const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0,10)
          const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()+1, 0)).toISOString().slice(0,10)
          const res = await fetch(`/api/pro/employees/${selectedEmployee.id}/availability?from=${from}&to=${to}`)
          const data = await res.json().catch(() => ({}))
          if (res.ok && Array.isArray(data?.overrides)) setOverrides(data.overrides)
        } catch {}
      })()
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
    const postEl = document.getElementById("post") as HTMLInputElement | null

    const full_name = nameEl?.value?.trim() || ""
    const email = emailEl?.value?.trim() || ""
    const phone = phoneEl?.value?.trim() || ""
    const start_time = addStart || "09:00"
    const end_time = addEnd || "18:00"

    if (!full_name) {
      alert("Nom complet requis")
      return
    }

    // Front guard: avoid obvious duplicates if already loaded
    const nameNorm = full_name.toLowerCase().trim()
    const emailNorm = email.toLowerCase().trim()
    const isDup = items.some(it => {
      const sameName = it.name.toLowerCase().trim() === nameNorm
      const sameEmail = emailNorm && it.email && it.email.toLowerCase().trim() === emailNorm
      return sameName || sameEmail
    })
    if (isDup) {
      alert("Un employé avec ce nom ou cet email existe déjà dans votre liste.")
      return
    }

    setSaving(true)
    try {
      // 1) Create employee
      const createRes = await fetch(`/api/pro/employees` , {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email: email || undefined, phone: phone || undefined, profession_label: postEl?.value?.trim() || undefined }),
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

      // Optional: store role (Permissions level/Access level)
      if (createEmail || employeeAccessRole || selectedPermissionCodes.length > 0) {
        const accPut = await fetch(`/api/pro/employee-accounts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employee_id: empId,
            user_email: createEmail || email || "",
            employee_role: employeeAccessRole,
            permission_codes: selectedPermissionCodes,
          }),
        })
        if (!accPut.ok) {
          const j = await accPut.json().catch(() => ({}))
          console.error("Account creation failed:", j)
          toast.error("L'employé a été créé mais le compte n'a pas pu l'être : " + (j?.error || ""))
        }
      }

      alert("Employé ajouté")
      setIsAddDialogOpen(false)
      // Reset account states
      setCreateEmail("")
      setEmployeeAccessRole("")
      setSelectedPermissionCodes([])
      await loadEmployees()
    } catch (e: any) {
      alert(e?.message || "Impossible d'ajouter l'employé")
    } finally {
      setSaving(false)
    }
  }

  const filteredEmployees = items
    .filter((e) => e.status === "Actif")
    .filter(
      (employee) =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.post.toLowerCase().includes(searchTerm.toLowerCase()),
    )

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee)
    // Normalize DB label to code
    const roleLabel = employee.accessLevel || ""
    let roleCode = roleLabel
    if (roleLabel === "Praticienne") roleCode = "praticienne"
    else if (roleLabel === "Réceptionniste") roleCode = "receptionniste"
    else if (roleLabel === "Admin Institut") roleCode = "admin_institut"
    
    setEmployeeAccessRole(roleCode)
    setSelectedPermissionCodes(employee.permissions || [])
    setIsEditDialogOpen(true)
  }

  const handleViewEmployee = (employee: UIEmployee) => {
    setViewEmployee(employee)
    setIsViewDialogOpen(true)
  }

  // Vérification que la fonction toast est disponible


  async function handleDeleteEmployee(id: string) {

    if (!confirm("Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.")) return
    
    try {
      // 1. D'abord, supprimer le compte employé
      const accountRes = await fetch(`/api/pro/employees/${id}/account`, { 
        method: "DELETE" 
      });
      
      if (!accountRes.ok) {
        const accountData = await accountRes.json().catch(() => ({}));
        throw new Error(accountData?.error || "Erreur lors de la suppression du compte employé");
      }

      // 2. Ensuite, désactiver l'employé
      const employeeRes = await fetch(`/api/pro/employees/${id}`, { 
        method: "DELETE" 
      });
      
      if (!employeeRes.ok) {
        const employeeData = await employeeRes.json().catch(() => ({}));
        throw new Error(employeeData?.error || "Erreur lors de la suppression de l'employé");
      }
      
      // Notification de succès avec Sonner

      toast.success("L'employé et son compte ont été supprimés avec succès")

      
      // Recharger la liste des employés
      await loadEmployees()
      
    } catch (error: any) {
      // Notification d'erreur avec Sonner
      console.error('Erreur lors de la suppression:', error)
      toast.error(error?.message || "Une erreur est survenue lors de la suppression de l'employé")

    }
  }

  async function handleSaveEdit() {
    if (!selectedEmployee?.id) return
    const nameEl = document.getElementById("edit-name") as HTMLInputElement | null
    const emailEl = document.getElementById("edit-email") as HTMLInputElement | null
    const phoneEl = document.getElementById("edit-phone") as HTMLInputElement | null
    const postEl = document.getElementById("edit-post") as HTMLInputElement | null
    // times come from controlled state

    const full_name = nameEl?.value?.trim() || ""
    const email = emailEl?.value?.trim() || ""
    const phone = phoneEl?.value?.trim() || ""
    const start_time = editStart || "09:00"
    const end_time = editEnd || "18:00"

    if (!full_name) {
      alert("Nom complet requis")
      return
    }

    setSaving(true)

    try {
      const is_active = editStatus === "Actif"
      const res = await fetch(`/api/pro/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, email: email || undefined, phone: phone || undefined, is_active, profession_label: postEl?.value?.trim() || "" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Mise à jour impossible")

      // Update Working Hours
      const selectedDays = Array.from(editDays)
      const dayIndex: Record<string, number> = {
        "Lundi": 1, "Mardi": 2, "Mercredi": 3, "Jeudi": 4, "Vendredi": 5, "Samedi": 6, "Dimanche": 0,
      }
      const hours = selectedDays.map((d) => ({ weekday: dayIndex[d], start_time, end_time, breaks: [] }))
      
      const hrsPut = await fetch(`/api/pro/employees/${selectedEmployee.id}/hours`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      })
      if (!hrsPut.ok) {
         console.error("Failed to update hours")
         toast.error("Infos modifiées, mais erreur sur les horaires")
      }

      // PASSED: Role (Access level) is now managed here
      if (selectedEmployee.hasAccount || createEmail) {
        const accRes = await fetch(`/api/pro/employee-accounts${selectedEmployee.hasAccount ? `/${selectedEmployee.id}` : ""}`, {
          method: selectedEmployee.hasAccount ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             employee_id: selectedEmployee.id,
             user_email: createEmail || email || selectedEmployee.email || "",
             employee_role: employeeAccessRole,
             permission_codes: selectedPermissionCodes,
             is_active: editStatus === "Actif"
          })
        })
        if (!accRes.ok) {
          const j = await accRes.json().catch(() => ({}))
          toast.error("Erreur lors de la mise à jour du compte : " + (j?.error || ""))
        }
      }

      setIsEditDialogOpen(false)
      // Reset account states
      setCreateEmail("")
      setEmployeeAccessRole("")
      setSelectedPermissionCodes([])
      await loadEmployees()
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  async function handleAddTimeOff() {
    if (!selectedEmployee?.id) return
    if (!toStart || !toEnd) {
      alert("Dates requises")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/pro/employees/${selectedEmployee.id}/time-off`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starts_at: toStart, ends_at: toEnd, reason: toReason || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Création congé échouée")
      setToStart("")
      setToEnd("")
      setToReason("")
      try {
        const r = await fetch(`/api/pro/employees/${selectedEmployee.id}/time-off`)
        const d = await r.json().catch(() => ({}))
        if (r.ok && Array.isArray(d?.items)) setTimeOff(d.items)
      } catch {}
      alert("Congé ajouté")
    } catch (e: any) {
      alert(e?.message || "Impossible d'ajouter le congé")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16"> */}
            {/* <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">YOKA</h1>
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
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-row justify-between items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Gestion des employés</h1>
                <p className="hidden sm:block text-gray-600">Gérez votre équipe, leurs services et leurs horaires de travail.</p>
              </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (open) {
                      setEmployeeAccessRole("praticienne");
                      setSelectedPermissionCodes(['pro_portal_access', 'agenda_view']);
                      setCreateEmail("");
                      setAddDays(new Set(["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"]));
                      setAddStart("09:00");
                      setAddEnd("18:00");
                    }
                  }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800 flex-shrink-0">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Nouvel employé</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel employé</DialogTitle>
              </DialogHeader>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddEmployee();
                }}
              >
                <div className="py-4">
                  <Accordion type="multiple" defaultValue={["basic"]}>
                    <AccordionItem value="basic">
                      <AccordionTrigger>Informations de base</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="name">Nom complet</Label>
                            <Input id="name" placeholder="Nom de l'employé" required />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="post">Poste</Label>
                            <Input id="post" placeholder="Ex: Coiffeur, Esthéticienne" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="email@exemple.com" />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="phone">Téléphone</Label>
                            <Input id="phone" placeholder="+213 555 123 456" />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="schedule">
                      <AccordionTrigger>Horaires & Planning</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div>
                          <Label className="mb-1.5 block">Jours de travail</Label>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {workDays.map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox id={day} checked={addDays.has(day)} onCheckedChange={(v) => {
                                  const next = new Set(addDays)
                                  if (v) next.add(day); else next.delete(day)
                                  setAddDays(next)
                                }} />
                                <Label className="mb-1.5 block text-sm" htmlFor={day}>{day}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="startTime">Heure de début</Label>
                            <Input id="startTime" type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="endTime">Heure de fin</Label>
                            <Input id="endTime" type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="access">
                      <AccordionTrigger>Accès & Sécurité</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="acc-email">Email de connexion (Optionnel)</Label>
                            <Input 
                              id="acc-email" 
                              placeholder="email@exemple.com" 
                              value={createEmail} 
                              onChange={(e) => setCreateEmail(e.target.value)} 
                            />
                            <p className="text-[10px] text-gray-500 mt-1">L'employé recevra une invitation par email pour activer son compte.</p>
                          </div>
                          <div>
                            <Label className="mb-1.5 block">Rôle d'accès</Label>
                            <Select value={employeeAccessRole} onValueChange={(val) => {
                              setEmployeeAccessRole(val)
                              if (val === 'praticienne') {
                                setSelectedPermissionCodes(['pro_portal_access', 'agenda_view'])
                              } else if (val === 'receptionniste') {
                                setSelectedPermissionCodes(['pro_portal_access', 'agenda_view', 'reservations_manage', 'clients_manage'])
                              } else if (val === 'admin_institut') {
                                setSelectedPermissionCodes(proPermissions.map(p => p.code))
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                {employeeRoleOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="mb-1.5 block">Permissions spécifiques</Label>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedPermissionCodes(proPermissions.map(p => p.code))}>Tout</Button>
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedPermissionCodes([])}>Aucun</Button>
                              </div>
                            </div>
                            <Input 
                              placeholder="Filtrer les permissions..." 
                              className="h-8 text-sm mb-2"
                              value={permQuery}
                              onChange={(e) => setPermQuery(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                               {proPermissions.filter(p => !permQuery || p.code.includes(permQuery) || p.description?.toLowerCase().includes(permQuery.toLowerCase())).map(p => (
                                 <div key={p.code} className="flex items-center space-x-2">
                                   <Checkbox 
                                     id={`perm-${p.code}`} 
                                     checked={selectedPermissionCodes.includes(p.code)} 
                                     onCheckedChange={(checked) => {
                                       if (checked) setSelectedPermissionCodes(prev => [...prev, p.code])
                                       else setSelectedPermissionCodes(prev => prev.filter(c => c !== p.code))
                                     }}
                                   />
                                   <Label className="mb-1.5 block text-[11px] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 truncate" htmlFor={`perm-${p.code}`} title={p.description}>
                                     {p.description || p.code}
                                   </Label>
                                 </div>
                               ))}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={saving} className="bg-black text-white hover:bg-gray-800">
                    {saving ? "Chargement..." : "Ajouter l'employé"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>
        </header>

        {/* Actions Bar */}
        <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Employees List - Desktop Table */}
        <div className="hidden md:block rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[30%] pl-6">Employé</TableHead>
                <TableHead className="w-[35%]">Contact</TableHead>
                <TableHead className="w-[25%]">Poste</TableHead>
                <TableHead className="w-[10%] pl-[14px] pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50/50">
                  <TableCell className="pl-6">
                    <div className="flex flex-row items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{employee.name}</span>
                      {employee.hasAccount && (
                         <Badge variant="outline" className="h-4 bg-green-50 text-green-700 border-green-200 text-[9px] px-1.5 flex items-center gap-1 w-fit">
                            <Shield className="h-2.5 w-2.5" /> {employee.accessLevel || "Compte"}
                         </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-gray-500">
                      {employee.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-[180px]" title={employee.email}>{employee.email}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="h-3 w-3" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 font-medium">{employee.post}</span>
                  </TableCell>

                  <TableCell className="pr-6">
                    <div className="flex items-center justify-start gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-black" onClick={() => handleViewEmployee(employee)} title="Voir détails">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-black" onClick={() => handleEditEmployee(employee)} title="Modifier">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteEmployee(employee.id)} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                    Aucun employé trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Employees List - Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{employee.name}</span>
                    {employee.hasAccount && (
                      <Badge variant="outline" className="h-4 bg-green-50 text-green-700 border-green-200 text-[8px] px-1.5">
                        {employee.accessLevel || "Compte"}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">{employee.post}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => handleViewEmployee(employee)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400" onClick={() => handleEditEmployee(employee)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteEmployee(employee.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 pt-3 border-t border-gray-50">
                {employee.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{employee.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
              Aucun employé trouvé.
            </div>
          )}
        </div>
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
                    <Label className="mb-1.5 block">Nom complet</Label>
                    <div className="mt-1 font-medium">{viewEmployee.name}</div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Poste</Label>
                    <div className="mt-1">{viewEmployee.post || "-"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Email</Label>
                    <div className="mt-1">{viewEmployee.email || "-"}</div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Téléphone</Label>
                    <div className="mt-1">{viewEmployee.phone || "-"}</div>
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Services proposés</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {viewEmployee.services.length ? viewEmployee.services.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    )) : <div>-</div>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block">Horaires</Label>
                    <div className="mt-1">{viewEmployee.workHours || "-"}</div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block">Repos</Label>
                    <div className="mt-1">{viewEmployee.restDays.join(", ") || "-"}</div>
                  </div>
                </div>
                <div>
                  <Label className="mb-1.5 block">Statut</Label>
                  <div className="mt-1">{viewEmployee.status}</div>
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
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEdit();
                }}
              >
                <div className="py-4">
                  <Accordion type="multiple" defaultValue={["edit-basic"]}>
                    <AccordionItem value="edit-basic">
                      <AccordionTrigger>Informations de base</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-name">Nom complet</Label>
                            <Input id="edit-name" defaultValue={selectedEmployee.name} required />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-post">Poste</Label>
                            <Input id="edit-post" defaultValue={selectedEmployee.post} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-email">Email</Label>
                            <Input id="edit-email" type="email" defaultValue={selectedEmployee.email} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-phone">Téléphone</Label>
                            <Input id="edit-phone" defaultValue={selectedEmployee.phone} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-1">
                            <Label className="mb-1.5 block">Statut</Label>
                            <Select value={editStatus} onValueChange={setEditStatus}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un statut" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Actif">Actif</SelectItem>
                                <SelectItem value="Inactif">Inactif</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edit-schedule">
                      <AccordionTrigger>Horaires & Planning</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div>
                          <Label className="mb-1.5 block">Jours de travail</Label>
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {workDays.map((day) => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox id={`edit-day-${day}`} checked={editDays.has(day)} onCheckedChange={(v) => {
                                  const next = new Set(editDays)
                                  if (v) next.add(day); else next.delete(day)
                                  setEditDays(next)
                                }} />
                                <Label className="mb-1.5 block text-sm" htmlFor={`edit-day-${day}`}>{day}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-startTime">Heure de début</Label>
                            <Input id="edit-startTime" type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
                          </div>
                          <div>
                            <Label className="mb-1.5 block" htmlFor="edit-endTime">Heure de fin</Label>
                            <Input id="edit-endTime" type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edit-access">
                      <AccordionTrigger>Accès & Sécurité</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2">
                        <div className="grid gap-4">
                          {!selectedEmployee.hasAccount && (
                            <div>
                              <Label className="mb-1.5 block" htmlFor="edit-acc-email">Email de connexion (pour créer un compte)</Label>
                              <Input 
                                id="edit-acc-email" 
                                placeholder="email@exemple.com" 
                                value={createEmail} 
                                onChange={(e) => setCreateEmail(e.target.value)} 
                              />
                            </div>
                          )}
                          
                          <div>
                            <Label className="mb-1.5 block">Rôle d'accès</Label>
                            <Select value={employeeAccessRole} onValueChange={(val) => {
                              setEmployeeAccessRole(val)
                              if (val === 'praticienne') {
                                setSelectedPermissionCodes(['pro_portal_access', 'agenda_view'])
                              } else if (val === 'receptionniste') {
                                setSelectedPermissionCodes(['pro_portal_access', 'agenda_view', 'reservations_manage', 'clients_manage'])
                              } else if (val === 'admin_institut') {
                                setSelectedPermissionCodes(proPermissions.map(p => p.code))
                              }
                            }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                {employeeRoleOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="mb-1.5 block">Permissions spécifiques</Label>
                              <div className="flex gap-2">
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedPermissionCodes(proPermissions.map(p => p.code))}>Tout</Button>
                                <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setSelectedPermissionCodes([])}>Aucun</Button>
                              </div>
                            </div>
                            <Input 
                              placeholder="Filtrer les permissions..." 
                              className="h-8 text-sm mb-2"
                              value={permQuery}
                              onChange={(e) => setPermQuery(e.target.value)}
                            />
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                               {proPermissions.filter(p => !permQuery || p.code.includes(permQuery) || p.description?.toLowerCase().includes(permQuery.toLowerCase())).map(p => (
                                 <div key={p.code} className="flex items-center space-x-2">
                                   <Checkbox 
                                     id={`edit-perm-${p.code}`} 
                                     checked={selectedPermissionCodes.includes(p.code)} 
                                     onCheckedChange={(checked) => {
                                       if (checked) setSelectedPermissionCodes(prev => [...prev, p.code])
                                       else setSelectedPermissionCodes(prev => prev.filter(c => c !== p.code))
                                     }}
                                   />
                                   <Label className="mb-1.5 block text-[11px] leading-none truncate" htmlFor={`edit-perm-${p.code}`} title={p.description}>
                                     {p.description || p.code}
                                   </Label>
                                 </div>
                               ))}
                            </div>
                          </div>

                          {selectedEmployee.hasAccount && (
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <div>
                                <p className="text-xs font-medium text-gray-700">Compte lié</p>
                                <p className="text-[10px] text-gray-500">{selectedEmployee.email}</p>
                              </div>
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm" 
                                className="h-7 text-[10px]"
                                onClick={async () => {
                                   if (!confirm("Voulez-vous vraiment supprimer le compte utilisateur de cet employé ?")) return
                                   const res = await fetch(`/api/pro/employees/${selectedEmployee.id}/account`, { method: "DELETE" })
                                   if (res.ok) {
                                     toast.success("Compte supprimé")
                                     setSelectedEmployee({...selectedEmployee, hasAccount: false})
                                     loadEmployees()
                                   } else {
                                      const d = await res.json()
                                      toast.error("Erreur : " + d.error)
                                   }
                                }}
                              >
                                Supprimer l'accès
                              </Button>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="edit-absences">
                      <AccordionTrigger>Absences & Exceptions</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-2">
                        <div>
                          <Label className="mb-1.5 block">Congés</Label>
                          <div className="grid gap-2 mt-2">
                            {!showTimeOffForm ? (
                              <div className="flex justify-start">
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowTimeOffForm(true)}>Ajouter un congé</Button>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input type="date" value={toStart} onChange={(e) => setToStart(e.target.value)} />
                                  <Input type="date" value={toEnd} onChange={(e) => setToEnd(e.target.value)} />
                                </div>
                                <Input placeholder="Raison (optionnel)" value={toReason} onChange={(e) => setToReason(e.target.value)} />
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowTimeOffForm(false); setToStart(""); setToEnd(""); setToReason("") }} disabled={saving}>Annuler</Button>
                                  <Button type="button" variant="outline" size="sm" onClick={handleAddTimeOff} disabled={saving}>
                                    {saving ? "..." : "Ajouter le congé"}
                                  </Button>
                                </div>
                              </>
                            )}
                            <div className="max-h-40 overflow-auto border rounded p-2 text-sm">
                              {timeOff.length ? timeOff.map((t) => (
                                <div key={t.id} className="flex items-center justify-between py-1">
                                  <div>
                                    <div className="font-medium">{new Date(t.starts_at).toLocaleDateString()} → {new Date(t.ends_at).toLocaleDateString()}</div>
                                    {t.reason && <div className="text-gray-500">{t.reason}</div>}
                                  </div>
                                </div>
                              )) : <div className="text-gray-500">Aucun congé</div>}
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="mb-1.5 block">Disponibilités exceptionnelles</Label>
                          <div className="grid gap-2 mt-2">
                            {!showOverrideForm ? (
                              <div className="flex justify-start">
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowOverrideForm(true)} disabled={saving}>Ajouter une disponibilité exceptionnelle</Button>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-4 gap-2 items-center">
                                  <Input type="date" value={ovDate} onChange={(e) => setOvDate(e.target.value)} />
                                  <div className="flex items-center gap-2">
                                    <Checkbox id="ovAvail" checked={ovAvailable} onCheckedChange={(v) => setOvAvailable(!!v)} />
                                    <Label className="mb-1.5 block text-sm" htmlFor="ovAvail">Disponible</Label>
                                  </div>
                                  <Input type="time" value={ovStart} onChange={(e) => setOvStart(e.target.value)} />
                                  <Input type="time" value={ovEnd} onChange={(e) => setOvEnd(e.target.value)} />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => { setShowOverrideForm(false); setOvDate(""); setOvAvailable(false); setOvStart(""); setOvEnd("") }}>Annuler</Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (!ovDate) { alert("Date requise"); return }
                                      upsertOverrideLocal({ date: ovDate, is_available: ovAvailable, start_time: ovStart || null, end_time: ovEnd || null })
                                      setOvDate(""); setOvAvailable(false); setOvStart(""); setOvEnd(""); setShowOverrideForm(false)
                                    }}
                                  >Ajouter/Mettre à jour</Button>
                                </div>
                              </>
                            )}
                            <div className="max-h-40 overflow-auto border rounded p-2 text-sm space-y-1">
                              {overrides.length ? overrides
                                .slice()
                                .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)))
                                .map((o: any) => (
                                  <div key={String(o.date)} className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{String(o.date).slice(0,10)} • {o.is_available ? "Disponible" : "Indisponible"}</div>
                                      {(o.start_time || o.end_time) && (
                                        <div className="text-gray-500">{o.start_time?.slice(11,16) || o.start_time} → {o.end_time?.slice(11,16) || o.end_time}</div>
                                      )}
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setOverrides((prev) => prev.filter((x: any) => String(x.date).slice(0,10) !== String(o.date).slice(0,10)))}>Retirer</Button>
                                  </div>
                                )) : <div className="text-gray-500">Aucune exception</div>}
                            </div>
                            <div className="flex justify-end">
                              <Button type="button" className="bg-black text-white hover:bg-gray-800" size="sm" onClick={handleSaveOverrides} disabled={saving}>
                                {saving ? "..." : "Enregistrer les exceptions"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={saving}>Annuler</Button>
                  <Button type="submit" className="bg-black text-white hover:bg-gray-800" disabled={saving}>
                    {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
