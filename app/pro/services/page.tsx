"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Edit, Trash2, Clock, DollarSign, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
 
export default function ProServices() {
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string; duration: number; price: number; priceMin?: number; priceMax?: number; description: string; active: boolean }>>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [newDuration, setNewDuration] = useState<string>("")
  const [newPrice, setNewPrice] = useState<string>("")
  const [newPriceMin, setNewPriceMin] = useState<string>("")
  const [newPriceMax, setNewPriceMax] = useState<string>("")
  const [priceMode, setPriceMode] = useState<"fixed" | "range">("fixed")
  const [newDescription, setNewDescription] = useState("")
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoriesApi, setCategoriesApi] = useState<Array<{ id: number; name: string }>>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryCode, setNewCategoryCode] = useState("")
  const [employees, setEmployees] = useState<Array<{ id: string; name: string }>>([])
  const [addSelectedEmployeeIds, setAddSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [serviceEmployees, setServiceEmployees] = useState<Record<string, string[]>>({})

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editServiceId, setEditServiceId] = useState<string>("")
  const [editVariantId, setEditVariantId] = useState<string>("")
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<string>("")
  const [editDuration, setEditDuration] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editPriceMin, setEditPriceMin] = useState<string>("")
  const [editPriceMax, setEditPriceMax] = useState<string>("")
  const [editPriceMode, setEditPriceMode] = useState<"fixed" | "range">("fixed")
  const [editDescription, setEditDescription] = useState("")
  const [editActive, setEditActive] = useState<boolean>(true)
  const [editSelectedEmployeeIds, setEditSelectedEmployeeIds] = useState<Set<string>>(new Set())


  async function openEditModal(serviceId: string) {
    try {
      const res = await fetch(`/api/pro/services/${serviceId}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.service) throw new Error(data?.error || "Chargement impossible")
      const s = data.service
      setEditServiceId(String(s.id))
      setEditName(String(s.name || ""))
      const catId = typeof s?.category_id === "number" ? String(s.category_id) : (s?.service_categories?.id ? String(s.service_categories.id) : "")
      setEditCategoryId(catId)
      setEditDescription(String(s.description || ""))
      setEditActive(Boolean(s.is_active))
      const v = Array.isArray(s.service_variants) ? s.service_variants[0] : undefined
      setEditVariantId(v?.id ? String(v.id) : "")
      setEditDuration(typeof v?.duration_minutes === "number" ? String(v.duration_minutes) : "")
      if (typeof v?.price_cents === "number") {
        setEditPrice(String(Math.round(v.price_cents / 100)))
        setEditPriceMode("fixed")
      } else {
        setEditPrice("")
        const min = typeof v?.price_min_cents === "number" ? String(Math.round(v.price_min_cents / 100)) : ""
        const max = typeof v?.price_max_cents === "number" ? String(Math.round(v.price_max_cents / 100)) : ""
        setEditPriceMin(min)
        setEditPriceMax(max)
        setEditPriceMode("range")
      }
      try {
        const empRes = await fetch(`/api/pro/employees?include=services&limit=200`)
        const empData = await empRes.json().catch(() => ({}))
        if (empRes.ok && Array.isArray(empData?.items)) {
          const emps = empData.items.map((e: any) => ({ id: String(e.id), name: String(e.full_name || "") , services: e.employee_services || [] }))
          setEmployees(emps.map((e: any) => ({ id: e.id, name: e.name })))
          const selected = new Set<string>()
          for (const e of emps) {
            const has = (e.services || []).some((x: any) => x?.services?.id === serviceId)
            if (has) selected.add(e.id)
          }
          setEditSelectedEmployeeIds(selected)
        }
      } catch {}
      setIsEditModalOpen(true)
    } catch (e: any) {
      alert(e?.message || "Impossible d'ouvrir la modification")
    }
  }

  async function handleSaveEdit() {
    if (!editServiceId) return
    const name = editName.trim()
    const duration = parseInt(editDuration || "0", 10)
    const price = parseInt(editPrice || "0", 10)
    const priceMin = parseInt(editPriceMin || "0", 10)
    const priceMax = parseInt(editPriceMax || "0", 10)
    if (!name) return alert("Nom du service requis")
    if (!duration || duration <= 0) return alert("Durée invalide")
    if (editPriceMode === "fixed" && price < 0) return alert("Prix invalide")
    if (editPriceMode === "range") {
      if (isNaN(priceMin) || isNaN(priceMax) || priceMin < 0 || priceMax < 0) return alert("Prix min/max invalides")
      if (priceMin > priceMax) return alert("Prix min > max")
    }
    try {
      // Update service fields
      const body: any = { name, description: editDescription || null, is_active: !!editActive }
      if (editCategoryId) body.category_id = parseInt(editCategoryId, 10)
      const res = await fetch(`/api/pro/services/${editServiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Mise à jour service échouée")

      // Update first variant if available
      if (editVariantId) {
        const variantPatch: any = { duration_minutes: duration }
        if (editPriceMode === "fixed") {
          variantPatch.price_cents = price * 100
          variantPatch.price_min_cents = null
          variantPatch.price_max_cents = null
        } else {
          variantPatch.price_cents = null
          variantPatch.price_min_cents = priceMin * 100
          variantPatch.price_max_cents = priceMax * 100
        }
        await fetch(`/api/pro/variants/${editVariantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variantPatch),
        }).then(() => {}).catch(() => {})
      }

      // Sync employees assigned to this service
      try {
        for (const emp of employees) {
          const curRes = await fetch(`/api/pro/employees/${emp.id}/services`)
          const cur = await curRes.json().catch(() => ({}))
          const existing: string[] = Array.isArray(cur?.services) ? cur.services.map((s: any) => s.id) : []
          const has = existing.includes(editServiceId)
          const shouldHave = editSelectedEmployeeIds.has(emp.id)
          let next = existing
          if (shouldHave && !has) next = [...existing, editServiceId]
          if (!shouldHave && has) next = existing.filter((id) => id !== editServiceId)
          if (next !== existing) {
            await fetch(`/api/pro/employees/${emp.id}/services`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ service_ids: next }),
            }).then(() => {}).catch(() => {})
          }
        }
      } catch {}

      setIsEditModalOpen(false)
      await loadServices()
      // refresh employee-service mapping
      try {
        const empRes = await fetch(`/api/pro/employees?include=services&limit=200`)
        const empData = await empRes.json().catch(() => ({}))
        if (empRes.ok && Array.isArray(empData?.items)) {
          const list = empData.items as any[]
          const map: Record<string, string[]> = {}
          for (const e of list) {
            const name = String(e.full_name || "")
            for (const es of (e.employee_services || [])) {
              const sid = es?.services?.id
              if (!sid) continue
              const key = String(sid)
              if (!map[key]) map[key] = []
              map[key].push(name)
            }
          }
          setServiceEmployees(map)
        }
      } catch {}
      alert("Service modifié")
    } catch (e: any) {
      alert(e?.message || "Impossible d'enregistrer")
    }
  }

  async function loadServices() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pro/services`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement")
      const list: any[] = Array.isArray(data?.services) ? data.services : []
      const mapped = list.map((s: any) => {
        const v = Array.isArray(s.service_variants) ? s.service_variants[0] : undefined
        const minPrice = typeof v?.price_min_cents === "number" ? Math.round(v.price_min_cents / 100) : undefined
        const maxPrice = typeof v?.price_max_cents === "number" ? Math.round(v.price_max_cents / 100) : undefined
        const hasRange = typeof minPrice === "number" && typeof maxPrice === "number"
        const price = typeof v?.price_cents === "number" ? Math.round(v.price_cents / 100) : (typeof minPrice === "number" ? minPrice : (typeof maxPrice === "number" ? maxPrice : 0))
        return {
          id: String(s.id),
          name: String(s.name || ""),
          category: s?.service_categories?.name ? String(s.service_categories.name) : "Autres",
          duration: typeof v?.duration_minutes === "number" ? v.duration_minutes : 0,
          price,
          ...(typeof minPrice === "number" ? { priceMin: minPrice } : {}),
          ...(typeof maxPrice === "number" ? { priceMax: maxPrice } : {}),
          description: String(s.description || ""),
          active: true,
        }
      })
      setServices(mapped)
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadServices()
    ;(async () => {
      try {
        const empRes = await fetch(`/api/pro/employees?include=services&limit=200`)
        const empData = await empRes.json().catch(() => ({}))
        if (empRes.ok && Array.isArray(empData?.items)) {
          const list = empData.items as any[]
          setEmployees(list.map((e: any) => ({ id: String(e.id), name: String(e.full_name || "") })))
          const map: Record<string, string[]> = {}
          for (const e of list) {
            const name = String(e.full_name || "")
            for (const es of (e.employee_services || [])) {
              const sid = es?.services?.id
              if (!sid) continue
              const key = String(sid)
              if (!map[key]) map[key] = []
              map[key].push(name)
            }
          }
          setServiceEmployees(map)
        }
      } catch {}
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const s of services) set.add(s.category || "Autres")
    return Array.from(set)
  }, [services])

  async function loadCategories() {

    try {
      const res = await fetch(`/api/pro/service-categories`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur lors du chargement des catégories:', res.status, errorText);
        return;
      }
      const data = await res.json().catch(e => {
        console.error('Erreur lors du parsing de la réponse:', e);
        return { categories: [] };
      });
      

      if (Array.isArray(data?.categories)) {
        setCategoriesApi(data.categories);
      } else {
        console.error('Format de données inattendu:', data);
        setCategoriesApi([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      setCategoriesApi([]);
    }
  }
  useEffect(() => {
    loadCategories()
  }, [])

  async function handleCreateService() {
    const name = newName.trim()
    const duration = parseInt(newDuration || "0", 10)
    const price = parseInt(newPrice || "0", 10)
    const priceMin = parseInt(newPriceMin || "0", 10)
    const priceMax = parseInt(newPriceMax || "0", 10)
    if (!name) return alert("Nom du service requis")
    if (!duration || duration <= 0) return alert("Durée invalide")
    if (priceMode === "fixed" && price < 0) return alert("Prix invalide")
    if (priceMode === "range") {
      if (isNaN(priceMin) || isNaN(priceMax) || priceMin < 0 || priceMax < 0) return alert("Prix min/max invalides")
      if (priceMin > priceMax) return alert("Prix min > max")
    }
    const category_id = selectedCategoryId ? parseInt(selectedCategoryId, 10) : undefined
    try {
      // Front guard: check duplicates before creating
      const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')
      const nameNorm = normalize(name)
      try {
        const listRes = await fetch(`/api/pro/services`)
        const lj = await listRes.json().catch(() => ({ services: [] }))
        const exists = Array.isArray(lj?.services) && lj.services.some((s: any) => {
          const sameCat = (typeof category_id === 'number' ? (s.category_id === category_id) : (s.category_id == null))
          const sameName = typeof s?.name === 'string' && s.name.trim().toLowerCase() === nameNorm.toLowerCase()
          return sameCat && sameName
        })
        if (exists) { alert('Cette prestation existe déjà dans cette catégorie.'); return }
      } catch {}
      const key = `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
      const createRes = await fetch(`/api/pro/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Idempotency-Key': key },
        body: JSON.stringify({ name, description: newDescription || null, ...(category_id ? { category_id } : {}) }),
      })
      const created = await createRes.json().catch(() => ({}))
      if (!createRes.ok) throw new Error(created?.error || "Création service échouée")
      const serviceId: string = created.id

      const variantPayload: any = { name: null, duration_minutes: duration }
      if (priceMode === "fixed") variantPayload.price_cents = price * 100
      if (priceMode === "range") {
        variantPayload.price_min_cents = priceMin * 100
        variantPayload.price_max_cents = priceMax * 100
      }
      await fetch(`/api/pro/services/${serviceId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variantPayload),
      }).then(() => {}).catch(() => {})

      // Assign selected employees to this new service
      try {
        for (const empId of Array.from(addSelectedEmployeeIds)) {
          const curRes = await fetch(`/api/pro/employees/${empId}/services`)
          const cur = await curRes.json().catch(() => ({}))
          const existing: string[] = Array.isArray(cur?.services) ? cur.services.map((s: any) => s.id) : []
          const next = Array.from(new Set([...existing, serviceId]))
          await fetch(`/api/pro/employees/${empId}/services`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ service_ids: next }),
          }).then(() => {}).catch(() => {})
        }
      } catch {}

      setNewName("")
      setSelectedCategoryId("")
      setNewDuration("")
      setNewPrice("")
      setNewPriceMin("")
      setNewPriceMax("")
      setPriceMode("fixed")
      setNewDescription("")
      setIsServiceModalOpen(false)
      await loadServices()
      // refresh employee-service mapping
      try {
        const empRes = await fetch(`/api/pro/employees?include=services&limit=200`)
        const empData = await empRes.json().catch(() => ({}))
        if (empRes.ok && Array.isArray(empData?.items)) {
          const list = empData.items as any[]
          const map: Record<string, string[]> = {}
          for (const e of list) {
            const name = String(e.full_name || "")
            for (const es of (e.employee_services || [])) {
              const sid = es?.services?.id
              if (!sid) continue
              const key = String(sid)
              if (!map[key]) map[key] = []
              map[key].push(name)
            }
          }
          setServiceEmployees(map)
        }
      } catch {}
      alert("Service ajouté")
    } catch (e: any) {
      alert(e?.message || "Impossible d'ajouter le service")
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm("Supprimer ce service ?")) return
    try {
      const res = await fetch(`/api/pro/services/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Suppression impossible")
      await loadServices()
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la suppression")
    }
  }

  async function handleCreateCategory() {
    const name = newCategoryName.trim()
    const code = newCategoryCode.trim() || undefined
    
    if (!name) {
      alert("Veuillez saisir un nom pour la catégorie")
      return
    }


    
    try {
      const response = await fetch(`/api/pro/service-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error || `Erreur HTTP: ${response.status}`;
        console.error('Erreur lors de la création de la catégorie:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      
      // Réinitialiser le formulaire
      setNewCategoryName("");
      setNewCategoryCode("");
      setIsCategoryModalOpen(false);
      
      // Recharger la liste des catégories
      await loadCategories();
      
      // Sélectionner automatiquement la nouvelle catégorie
      if (data?.id) {
        const newCategoryId = String(data.id);

        setSelectedCategoryId(newCategoryId);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      alert(error instanceof Error ? error.message : "Une erreur inattendue est survenue");
    }
  }

  return (
    <div>
              <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
        <h1 className="text-2xl font-bold text-black">Mes services</h1>
        <p className="text-gray-600">Gérer vos services</p>
        </div>
        <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau service</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceName">Nom du service</Label>
                <Input id="serviceName" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: COUPE + BRUSHING" />
              </div>
              <div>
                <Label>Catégorie</Label>
                <div className="flex flex-col gap-2">
                  <Select value={selectedCategoryId} onValueChange={(v) => setSelectedCategoryId(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesApi.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="w-full" onClick={() => setIsCategoryModalOpen(true)}>+ Catégorie</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="serviceDuration">Durée (minutes)</Label>
                <Input id="serviceDuration" type="number" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="30" />
              </div>
              <div>
                <Label htmlFor="servicePrice">Prix (DA)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={priceMode} onValueChange={(v) => setPriceMode(v as any)}>
                    <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixe</SelectItem>
                      <SelectItem value="range">Plage</SelectItem>
                    </SelectContent>
                  </Select>
                  {priceMode === "fixed" ? (
                    <Input id="servicePrice" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="200" />
                  ) : (
                    <>
                      <Input id="servicePriceMin" type="number" value={newPriceMin} onChange={(e) => setNewPriceMin(e.target.value)} placeholder="Min" />
                      <Input id="servicePriceMax" type="number" value={newPriceMax} onChange={(e) => setNewPriceMax(e.target.value)} placeholder="Max" />
                    </>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea id="serviceDescription" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description du service..." rows={3} />
             </div>
              <div className="md:col-span-2">
                <Label>Employés</Label>
                <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
                  {employees.map((e) => (
                    <div key={e.id} className="flex items-center space-x-2 py-1">
                      <Checkbox id={`add-emp-${e.id}`} checked={addSelectedEmployeeIds.has(e.id)} onCheckedChange={(v) => {
                        const next = new Set(addSelectedEmployeeIds)
                        if (v) next.add(e.id); else next.delete(e.id)
                        setAddSelectedEmployeeIds(next)
                      }} />
                      <Label htmlFor={`add-emp-${e.id}`} className="text-sm">{e.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setIsServiceModalOpen(false)}>Annuler</Button>
             <Button onClick={handleCreateService} disabled={loading} className="bg-black text-white hover:bg-gray-800">Ajouter le service</Button>
           </div>
         </DialogContent>
       </Dialog>
      </div>
       </div>
       </header>     

      {/* Modal: Nouvelle catégorie */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle catégorie</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="catName">Nom</Label>
              <Input id="catName" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Ex: Coiffure" />
            </div>
            <div>
              <Label htmlFor="catCode">Code (optionnel)</Label>
              <Input id="catCode" value={newCategoryCode} onChange={(e) => setNewCategoryCode(e.target.value)} placeholder="coiffure" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateCategory} className="bg-black text-white hover:bg-gray-800">Créer</Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  {services.length ? Math.round(services.reduce((acc, s) => acc + s.price, 0) / services.length) : 0} DA
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
                  {services.length ? Math.round(services.reduce((acc, s) => acc + s.duration, 0) / services.length) : 0}min
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
                      <div className="text-lg font-bold text-black">
                        {typeof service.priceMin === "number" && typeof service.priceMax === "number"
                          ? `${service.priceMin}–${service.priceMax} DA`
                          : `${service.price} DA`}
                      </div>
                    </div>

                    {Array.isArray(serviceEmployees[service.id]) && serviceEmployees[service.id].length > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                        <Users className="h-4 w-4" />
                        <div className="flex flex-wrap gap-1">
                          {serviceEmployees[service.id].map((n, idx) => (
                            <Badge key={`${service.id}-${idx}`} variant="outline" className="text-xs">{n}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditModal(service.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDeleteService(service.id)}
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

      {/* Le formulaire d'ajout est désormais dans le modal */}

      {/* Edit Service Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier le service</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editServiceName">Nom du service</Label>
              <Input id="editServiceName" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Catégorie</Label>
              <div className="grid grid-cols-1">
                <Select value={editCategoryId} onValueChange={(v) => setEditCategoryId(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesApi.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editServiceDuration">Durée (minutes)</Label>
              <Input id="editServiceDuration" type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="editServicePrice">Prix (DA)</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={editPriceMode} onValueChange={(v) => setEditPriceMode(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixe</SelectItem>
                    <SelectItem value="range">Plage</SelectItem>
                  </SelectContent>
                </Select>
                {editPriceMode === "fixed" ? (
                  <Input id="editServicePrice" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
                ) : (
                  <>
                    <Input id="editServicePriceMin" type="number" value={editPriceMin} onChange={(e) => setEditPriceMin(e.target.value)} placeholder="Min" />
                    <Input id="editServicePriceMax" type="number" value={editPriceMax} onChange={(e) => setEditPriceMax(e.target.value)} placeholder="Max" />
                  </>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="editServiceDescription">Description</Label>
              <Textarea id="editServiceDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="md:col-span-2">
              <Label>Employés</Label>
              <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
                {employees.map((e) => (
                  <div key={e.id} className="flex items-center space-x-2 py-1">
                    <Checkbox id={`edit-emp-${e.id}`} checked={editSelectedEmployeeIds.has(e.id)} onCheckedChange={(v) => {
                      const next = new Set(editSelectedEmployeeIds)
                      if (v) next.add(e.id); else next.delete(e.id)
                      setEditSelectedEmployeeIds(next)
                    }} />
                    <Label htmlFor={`edit-emp-${e.id}`} className="text-sm">{e.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input id="editActive" type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              <Label htmlFor="editActive">Actif</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
            <Button onClick={handleSaveEdit} className="bg-black text-white hover:bg-gray-800">Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
