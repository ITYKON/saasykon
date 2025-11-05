"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ChevronLeft, ChevronRight, Star, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/useAuth"

interface BookingWizardProps {
  salon: any
  onClose: () => void
  initialService?: {
    id: string
    name: string
    duration_minutes: number
    price_cents?: number | null
  } | null
}

 export default function BookingWizard({ salon, onClose, initialService = null }: BookingWizardProps) {
  const router = useRouter()
  const { auth, loading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedItems, setSelectedItems] = useState<any[]>(() => initialService ? [initialService] : [])
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string; color?: string | null }>>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Array<{ date: string; slots: string[] }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [showInfo, setShowInfo] = useState(false)
  const [identMode, setIdentMode] = useState<'none' | 'login' | 'signup'>('none')
  const [authOverride, setAuthOverride] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupCGU, setSignupCGU] = useState(false)
  const [signupOkMsg, setSignupOkMsg] = useState<string | null>(null)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)
  const [showAddService, setShowAddService] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [itemSlotsCache, setItemSlotsCache] = useState<Record<string, Array<{ date: string; slots: string[] }>>>({})

  // removed unused constants to avoid TS noUnusedLocals issues

  const totalDuration = selectedItems.reduce((sum, it) => sum + Number(it?.duration_minutes || 0), 0)
  const totalPriceCents = selectedItems.reduce((sum, it) => sum + Number(it?.price_cents ?? 0), 0)

  async function loadSlotsForService(serviceId: string) {
    if (!serviceId) return [] as Array<{ date: string; slots: string[] }>
    if (itemSlotsCache[serviceId]) return itemSlotsCache[serviceId]
    try {
      const p = new URLSearchParams()
      p.set('serviceId', serviceId)
      if (selectedEmployeeId) p.set('employeeId', selectedEmployeeId)
      p.set('days', '7')
      p.set('start', startDate)
      const res = await fetch(`/api/salon/${salon.id}/timeslots?` + p.toString(), { cache: 'no-store' })
      const j = await res.json().catch(() => ({ days: [] }))
      const days = Array.isArray(j?.days) ? j.days : []
      const val = days.map((d: any) => ({ date: d.date, slots: (d.slots || []).map((s: any) => s.time) }))
      setItemSlotsCache((prev) => ({ ...prev, [serviceId]: val }))
      return val
    } catch {
      return []
    }
  }

  // Fetch employees when at least one service is selected (use the first one as reference)
  useEffect(() => {
    let ignore = false
    async function run() {
      const first = selectedItems[0]
      if (!first) { setEmployees([]); setSelectedEmployeeId(null); return }
      try {
        const url = `/api/salon/${salon.id}/employees?serviceId=${first.id}`
        const res = await fetch(url, { cache: 'no-store' })
        const j = await res.json().catch(() => ({ employees: [] }))
        if (ignore) return
        const list = Array.isArray(j?.employees) ? j.employees : []
        setEmployees(list)
        // Reset selection if not in list
        setSelectedEmployeeId((prev) => (list.find((e: any) => e.id === prev) ? prev : null))
      } catch {
        if (!ignore) { setEmployees([]); setSelectedEmployeeId(null) }
      }
    }
    run()
    return () => { ignore = true }
  }, [selectedItems, salon.id])

  // Fetch time slots when first service, employee or startDate changes
  useEffect(() => {
    let ignore = false
    async function loadSlots() {
      const first = selectedItems[0]
      if (!first) { setSlots([]); return }
      setLoadingSlots(true)
      try {
        const p = new URLSearchParams()
        p.set('serviceId', first.id)
        if (selectedEmployeeId) p.set('employeeId', selectedEmployeeId)
        p.set('days', '7')
        p.set('start', startDate)
        const res = await fetch(`/api/salon/${salon.id}/timeslots?` + p.toString(), { cache: 'no-store' })
        const j = await res.json().catch(() => ({ days: [] }))
        if (ignore) return
        const days = Array.isArray(j?.days) ? j.days : []
        setSlots(days.map((d: any) => ({ date: d.date, slots: (d.slots || []).map((s: any) => s.time) })))
      } catch {
        if (!ignore) setSlots([])
      } finally {
        if (!ignore) setLoadingSlots(false)
      }
    }
    loadSlots()
    return () => { ignore = true }
  }, [selectedItems, selectedEmployeeId, salon.id, startDate])

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Section 1 header */}
      <h2 className="text-base font-semibold text-black"><span className="text-blue-600 mr-2">1.</span> Prestation sélectionnée</h2>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{selectedItems.length ? "Prestations sélectionnées" : "Sélectionner une prestation"}</h3>
            {!!selectedItems.length && (
              <div className="space-y-2 mt-2">
                {selectedItems.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 text-sm">
                    <div className="truncate">
                      {it.name}
                      <span className="text-gray-600"> • {it.duration_minutes}min • {(it.price_cents ?? 0) / 100} DA</span>
                    </div>
                    <button className="text-sm text-blue-600 hover:underline shrink-0" onClick={() => {
                      setSelectedItems((prev) => prev.filter((_, i) => i !== idx))
                      setShowAddService(false)
                    }}>Supprimer</button>
                  </div>
                ))}
              </div>
            )}
            {/* Information modal shown after slot selection */}
      <AlertDialog open={showInfo} onOpenChange={setShowInfo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Informations</AlertDialogTitle>
            <AlertDialogDescription>
              Merci d'avoir réservé votre rendez-vous chez {salon?.name || 'notre institut'} ! Votre confirmation est bien enregistrée et nous sommes impatients de vous accueillir.
              Si vous avez besoin de modifier ou annuler votre rendez-vous, n'hésitez pas à nous contacter.
              <br />
              <br />TEAM {salon?.name || 'YOKA'}
              <br />Nous avons hâte de vous offrir une expérience de beauté exceptionnelle !
              <br />À très bientôt,
              <br />L'équipe {salon?.name || 'Yoka'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => { setShowInfo(false); setCurrentStep(2) }}>J'ai compris</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ticket modal after successful reservation */}
      <AlertDialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket de réservation</AlertDialogTitle>
            <AlertDialogDescription>
              {ticketData ? (
                <div id="ticket">
                  <div className="font-medium">{ticketData.salonName}</div>
                  <div className="text-sm text-gray-600">{ticketData.date} • à {ticketData.time}</div>
                  <div className="mt-2 text-sm">Prestation: {ticketData.serviceName}</div>
                  <div className="text-sm">Avec: {ticketData.employee}</div>
                  <div className="mt-2 text-xs text-gray-500">Référence: {ticketData.id}</div>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-wrap gap-2 justify-between">
            <AlertDialogAction onClick={() => {
              const w = window.open('', 'PRINT', 'height=600,width=800')
              if (!w) return
              const html = document.getElementById('ticket')?.outerHTML || ''
              w.document.write('<html><head><title>Ticket</title></head><body>' + html + '</body></html>')
              w.document.close(); w.focus(); w.print(); w.close();
            }}>Télécharger</AlertDialogAction>
            <AlertDialogAction onClick={() => { setTicketOpen(false); router.push(`/client/dashboard`) }}>Mon espace</AlertDialogAction>
            <AlertDialogAction onClick={() => { setTicketOpen(false); router.push(`/salon/${salon?.id}`) }}>Retour au salon</AlertDialogAction>
            <AlertDialogAction onClick={() => { setTicketOpen(false); onClose() }}>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
          {!!selectedItems.length && (
            <div className="w-56 shrink-0">
              <Label className="text-xs text-gray-500">Avec qui ?</Label>
              <div className="mt-1">
                {employees.length <= 1 ? (
                  <div className="text-sm text-gray-600 border rounded-md h-9 px-3 flex items-center bg-gray-50">{employees.length === 1 ? employees[0].full_name : "Sans préférence"}</div>
                ) : (
                  <Select value={selectedEmployeeId ?? "none"} onValueChange={(v) => setSelectedEmployeeId(v === 'none' ? null : v)}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Sans préférence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sans préférence</SelectItem>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
          {/* right area left blank when multi */}
        </div>
        {!selectedItems.length && (
          <div className="mt-3">
            <div className="text-sm text-gray-700 mb-4">Choisir une prestation</div>
            <div className="space-y-6">
              {(salon?.services || []).map((category: any, catIndex: number) => {
                if (!category.items?.length) return null;
                return (
                  <div key={catIndex} className="space-y-2">
                    <h3 className="font-medium text-gray-900 text-base mb-2">
                      {category.category || 'Autres prestations'}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((svc: any) => (
                        <button
                          key={svc.id}
                          className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                          onClick={() => {
                            setSelectedItems((prev)=> [...prev, { id: svc.id, name: svc.name, duration_minutes: svc.duration_minutes || 30, price_cents: svc.price_cents ?? 0 }])
                            setShowAddService(false)
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{svc.name}</div>
                            <div className="text-sm text-gray-500">
                              {svc.duration_minutes || 30} min • {(svc.price_cents ?? 0) / 100} DA
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 ml-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!!selectedItems.length && (
          <div className="mt-6">
            {/* Section 2 header */}
            <h2 className="text-base font-semibold text-black mb-3"><span className="text-blue-600 mr-2">2.</span> Choix de la date & heure</h2>
            {loadingSlots ? (
              <div className="text-sm text-gray-500">Chargement des créneaux…</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-center justify-between mb-2">
                  <Button variant="ghost" size="sm" className="bg-transparent" onClick={() => {
                    const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d.toISOString().split('T')[0])
                  }}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="bg-transparent" onClick={() => {
                    const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d.toISOString().split('T')[0])
                  }}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-4 w-full bg-white border rounded-2xl p-6 shadow-sm">
                {/* En-têtes des jours */}
                {slots.slice(0, 7).map((d) => (
                  <div key={`header-${d.date}`} className="text-center font-medium text-sm text-gray-600 pb-2">
                    {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                  </div>
                ))}
                {/* Contenu des jours */}
                  {slots.map((d) => (
                    <div key={d.date} className="border-l border-gray-100 pl-3">
                      <div className="text-sm font-medium text-gray-800 mb-3">
                        {new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit' })} {new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' })}
                      </div>
                      <div className="flex flex-col gap-2">
                        {d.slots.length === 0 && (
                          <div className="text-xs text-gray-400">Aucun créneau</div>
                        )}
                        {d.slots.map((t) => (
                          <button
                            key={`${d.date}-${t}`}
                            className={`text-sm h-10 border rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition font-medium ${selectedDate === d.date && selectedTime === t ? 'bg-black text-white hover:bg-black' : 'hover:border-gray-300'}`}
                            onClick={() => { setSelectedDate(d.date); setSelectedTime(t); setShowInfo(true) }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ajouter une prestation à la suite */}
      <div className="mt-3">
        <Button variant="default" className="bg-black hover:bg-gray-800 text-white" onClick={() => setShowAddService((v)=>!v)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une prestation à la suite
        </Button>
        {showAddService && (
          <div className="mt-4">
            <div className="text-sm text-gray-700 mb-4">Choisir une prestation supplémentaire</div>
            <div className="space-y-6">
              {(salon?.services || []).map((category: any, catIndex: number) => {
                if (!category.items?.length) return null;
                return (
                  <div key={`add-${catIndex}`} className="space-y-2">
                    <h3 className="font-medium text-gray-900 text-base mb-2">
                      {category.category || 'Autres prestations'}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((svc: any) => (
                        <button
                          key={`add-${svc.id}`}
                          className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                          onClick={() => {
                            setSelectedItems((prev)=> [...prev, { id: svc.id, name: svc.name, duration_minutes: svc.duration_minutes || 30, price_cents: svc.price_cents ?? 0 }])
                            setShowAddService(false)
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{svc.name}</div>
                            <div className="text-sm text-gray-500">
                              {svc.duration_minutes || 30} min • {(svc.price_cents ?? 0) / 100} DA
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 ml-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bloc manuel masqué pour coller au rendu Planity */}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-8">
      {/* Résumé date supprimé pour réduire la redondance */}
      {(auth || authOverride) && (
        <div className="space-y-4">
          {error && <div className="text-sm text-red-600 text-center">{error}</div>}
          <Button
            className="w-full bg-black text-white hover:bg-gray-800"
            disabled={authLoading || submitting || selectedItems.length === 0 || !selectedDate || !selectedTime}
            onClick={async () => {
              setSubmitting(true)
              setError(null)
              try {
                const starts_at = new Date(`${selectedDate}T${selectedTime}:00`)
                const payload = {
                  business_id: salon.id,
                  starts_at: starts_at.toISOString(),
                  employee_id: selectedEmployeeId || undefined,
                  items: selectedItems.map((it) => ({
                    service_id: it.id,
                    duration_minutes: Number(it.duration_minutes || 30),
                    price_cents: Number(it.price_cents ?? 0),
                    currency: 'DZD',
                    employee_id: selectedEmployeeId || undefined,
                  })),
                }
                const res = await fetch('/api/client/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                const j = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(j?.error || 'Impossible de créer la réservation')
                // Open ticket modal with data
                setTicketData({
                  id: j?.booking?.id,
                  salonName: salon?.name,
                  date: new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
                  time: selectedTime,
                  serviceName: selectedItems.map(s=>s.name).join(' + '),
                  employee: employees.find(e => e.id === selectedEmployeeId)?.full_name || 'Sans préférence',
                })
                setTicketOpen(true)
              } catch (e: any) {
                setError(e?.message || 'Erreur de création')
              } finally {
                setSubmitting(false)
              }
            }}
          >
            {submitting ? 'Création…' : 'Confirmer la réservation'}
          </Button>
        </div>
      )}
      {!(auth || authOverride) && (
        <div>
          <h3 className="font-semibold mb-4">3. Identification</h3>

          {identMode === 'login' && (
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" placeholder="Email" className="mt-1" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Mot de passe *</Label>
                  <Input type="password" placeholder="Mot de passe" className="mt-1" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} />
                </div>
              </div>
              <div>
                <Link href="/auth/forgot-password" className="text-sm text-blue-600">Mot de passe oublié ?</Link>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button className="w-full bg-black text-white hover:bg-gray-800" disabled={authSubmitting} onClick={async ()=>{
                  try{
                    setAuthSubmitting(true)
                    setError(null)
                    console.log('[Login] start', { email: loginEmail })
                    const res = await fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: loginEmail, password: loginPassword})})
                    console.log('[Login] response status', res.status)
                    if(!res.ok){ const body = await res.text(); console.error('[Login] error body', body); throw new Error(`[Login ${res.status}] ${body}`) }
                    setAuthOverride(true); setIdentMode('none'); setSignupOkMsg(null)
                    console.log('[Login] success')
                  }catch(e:any){ setError(e?.message||'Erreur de connexion') }
                  finally { setAuthSubmitting(false) }
                }}>Se connecter</Button>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <div className="flex-1 h-px bg-gray-200"/>
                  <span>ou</span>
                  <div className="flex-1 h-px bg-gray-200"/>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIdentMode('signup')}>Créer mon compte</Button>
              </div>
            </div>
          )}

          {identMode === 'none' && (
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              <div className="text-center font-medium">Nouveau sur YOKA ?</div>
              <Button className="w-full bg-black text-white hover:bg-gray-800" onClick={() => setIdentMode('signup')}>Créer mon compte</Button>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="flex-1 h-px bg-gray-200"/>
                <span>ou</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>
              <div className="text-center font-medium">Vous avez déjà utilisé YOKA ?</div>
              <Button variant="outline" className="w-full" onClick={() => setIdentMode('login')}>Se connecter</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black tracking-wide">
              YOKA
            </Link>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
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
                {renderStep1()}
                {currentStep >= 2 && renderStep2()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
            {/* Récapitulatif de la réservation */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-semibold text-lg">Récapitulatif</h3>
                {selectedItems.length === 0 ? (
                  <div className="text-sm text-gray-600">Aucune prestation sélectionnée</div>
                ) : (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      {selectedItems.map((it, idx) => (
                        <div key={`recap-${idx}`} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate mr-2">{it.name}</span>
                            <span className="text-gray-600">{it.duration_minutes}min • {(it.price_cents ?? 0) / 100} DA</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Date & heure</span>
                            <div className="flex items-center gap-2">
                              <span>{(it as any).date && (it as any).time
                                ? `${new Date((it as any).date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • ${(it as any).time}`
                                : (selectedDate && selectedTime ? `${new Date(selectedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} • ${selectedTime}` : '—')}
                              </span>
                              <button className="text-blue-600 hover:underline" onClick={async () => {
                                setEditingItemIndex(idx)
                                await loadSlotsForService(it.id)
                              }}>Modifier</button>
                            </div>
                          </div>
                          {editingItemIndex === idx && (
                            <div className="mt-2 rounded-md border p-2">
                              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto">
                                {(itemSlotsCache[it.id] || []).map((d) => (
                                  <div key={`itm-${idx}-${d.date}`} className="col-span-1">
                                    <div className="text-[11px] font-medium text-gray-700 mb-1">{new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                                    <div className="flex flex-col gap-1">
                                      {d.slots.slice(0,6).map((t) => (
                                        <button key={`itm-${idx}-${d.date}-${t}`} className={`text-[11px] h-7 border rounded px-2 ${((it as any).date === d.date && (it as any).time === t) ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                                          onClick={() => {
                                            setSelectedItems((prev) => prev.map((p, pi) => pi === idx ? { ...p, date: d.date, time: t } : p))
                                            setEditingItemIndex(null)
                                          }}
                                        >{t}</button>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 mt-1 border-t flex items-center justify-between text-sm">
                      <span className="font-medium">Total</span>
                      <span className="font-medium">{totalDuration} min • {Math.round(totalPriceCents / 100)} DA</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentStep(1)}>Modifier prestations</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  {Object.entries((salon?.hours || {}) as Record<string, string>).map(([day, hours]) => (
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
