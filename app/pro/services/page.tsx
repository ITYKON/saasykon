"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Edit, Trash2, Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
 
export default function ProServices() {
  const [services, setServices] = useState<Array<{ id: string; name: string; category: string; duration: number; price: number; description: string; active: boolean }>>([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [newDuration, setNewDuration] = useState<string>("")
  const [newPrice, setNewPrice] = useState<string>("")
  const [newDescription, setNewDescription] = useState("")
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoriesApi, setCategoriesApi] = useState<Array<{ id: number; name: string }>>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryCode, setNewCategoryCode] = useState("")

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editServiceId, setEditServiceId] = useState<string>("")
  const [editVariantId, setEditVariantId] = useState<string>("")
  const [editName, setEditName] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<string>("")
  const [editDuration, setEditDuration] = useState<string>("")
  const [editPrice, setEditPrice] = useState<string>("")
  const [editDescription, setEditDescription] = useState("")
  const [editActive, setEditActive] = useState<boolean>(true)

  function getBusinessId(): string {
    const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )business_id=([^;]+)/) : null
    return m ? decodeURIComponent(m[1]) : ""
  }

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
      setEditPrice(typeof v?.price_cents === "number" ? String(Math.round(v.price_cents / 100)) : "")
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
    if (!name) return alert("Nom du service requis")
    if (!duration || duration <= 0) return alert("Durée invalide")
    if (price < 0) return alert("Prix invalide")
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
        await fetch(`/api/pro/variants/${editVariantId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration_minutes: duration, price_cents: price * 100 }),
        }).then(() => {}).catch(() => {})
      }

      setIsEditModalOpen(false)
      await loadServices()
      alert("Service modifié")
    } catch (e: any) {
      alert(e?.message || "Impossible d'enregistrer")
    }
  }

  async function loadServices() {
    setLoading(true)
    try {
      const bid = getBusinessId()
      const q = bid ? `?business_id=${encodeURIComponent(bid)}` : ""
      const res = await fetch(`/api/pro/services${q}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement")
      const list: any[] = Array.isArray(data?.services) ? data.services : []
      const mapped = list.map((s: any) => {
        const v = Array.isArray(s.service_variants) ? s.service_variants[0] : undefined
        return {
          id: String(s.id),
          name: String(s.name || ""),
          category: s?.service_categories?.name ? String(s.service_categories.name) : "Autres",
          duration: typeof v?.duration_minutes === "number" ? v.duration_minutes : 0,
          price: typeof v?.price_cents === "number" ? Math.round(v.price_cents / 100) : 0,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const s of services) set.add(s.category || "Autres")
    return Array.from(set)
  }, [services])

  async function loadCategories() {
    try {
      const res = await fetch(`/api/pro/service-categories`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(data?.categories)) {
        setCategoriesApi(data.categories)
      }
    } catch {}
  }
  useEffect(() => {
    loadCategories()
  }, [])

  async function handleCreateService() {
    const name = newName.trim()
    const duration = parseInt(newDuration || "0", 10)
    const price = parseInt(newPrice || "0", 10)
    if (!name) return alert("Nom du service requis")
    if (!duration || duration <= 0) return alert("Durée invalide")
    if (price < 0) return alert("Prix invalide")
    const category_id = selectedCategoryId ? parseInt(selectedCategoryId, 10) : undefined
    try {
      const bid = getBusinessId()
      const q = bid ? `?business_id=${encodeURIComponent(bid)}` : ""
      const createRes = await fetch(`/api/pro/services${q}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: newDescription || null, ...(category_id ? { category_id } : {}) }),
      })
      const created = await createRes.json().catch(() => ({}))
      if (!createRes.ok) throw new Error(created?.error || "Création service échouée")
      const serviceId: string = created.id

      await fetch(`/api/pro/services/${serviceId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: null, duration_minutes: duration, price_cents: price * 100 }),
      }).then(() => {}).catch(() => {})

      setNewName("")
      setSelectedCategoryId("")
      setNewDuration("")
      setNewPrice("")
      setNewDescription("")
      setIsServiceModalOpen(false)
      await loadServices()
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
    if (!name) return alert("Nom de catégorie requis")
    try {
      const res = await fetch(`/api/pro/service-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Création catégorie échouée")
      setNewCategoryName("")
      setNewCategoryCode("")
      setIsCategoryModalOpen(false)
      await loadCategories()
      if (data?.id) setSelectedCategoryId(String(data.id))
    } catch (e: any) {
      alert(e?.message || "Impossible d'ajouter la catégorie")
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
                <Input id="servicePrice" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="200" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea id="serviceDescription" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Description du service..." rows={3} />
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
                      <div className="text-lg font-bold text-black">{service.price} DA</div>
                    </div>

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
              <Input id="editServicePrice" type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="editServiceDescription">Description</Label>
              <Textarea id="editServiceDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
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
