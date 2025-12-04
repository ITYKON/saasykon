"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/useAuth"
import { buildSalonSlug } from "@/lib/salon-slug"

interface BookingWizardProps {
  salon: any
  onClose: () => void
  initialService?: {
    id: string
    name: string
    duration_minutes: number
    price_cents?: number | null
    price_min_cents?: number | null
    price_max_cents?: number | null
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
  const submitLock = useRef(false)
  const [showAgenda, setShowAgenda] = useState(true)

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
        setSelectedEmployeeId((prev) => {
          const stillThere = list.find((e: any) => e.id === prev) ? prev : null
          if (stillThere) return stillThere
          // Auto-assign randomly when 'Sans préférence' to drive agenda by a concrete employee
          if (list.length > 0) {
            const pick = list[Math.floor(Math.random() * list.length)]
            return pick.id
          }
          return null
        })
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
                <div className="w-full bg-white border rounded-2xl p-4 shadow-sm flex items-start justify-between">
                  <div className="min-w-0">
                    {(() => {
                      let minTotal = 0, maxTotal = 0, counted = false
                      for (const it of selectedItems) {
                        const pc = typeof it.price_cents === 'number' ? it.price_cents : null
                        const pmin = typeof (it as any).price_min_cents === 'number' ? (it as any).price_min_cents : null
                        const pmax = typeof (it as any).price_max_cents === 'number' ? (it as any).price_max_cents : null
                        if (pc != null) { minTotal += pc; maxTotal += pc; counted = true }
                        else if (pmin != null && pmax != null) { minTotal += pmin; maxTotal += pmax; counted = true }
                      }
                      const hasPrice = counted
                      const isRange = counted && minTotal !== maxTotal
                      const priceText = !hasPrice ? '—' : (isRange ? `à partir de ${Math.round(minTotal / 100)} da` : `${Math.round(minTotal / 100)} da`)
                      const mins = Number(totalDuration || 0)
                      const h = Math.floor(mins / 60)
                      const m = mins % 60
                      const durText = h > 0 ? `${h}h${m ? ` ${m}min` : ''}` : `${m}min`
                      return (
                        <>
                          <div className="font-medium text-gray-900 truncate">
                            {selectedItems.map(s => s.name).join(' + ')}
                            {hasPrice && <span className="ml-1 text-gray-800">{priceText}</span>}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">{durText}</div>
                        </>
                      )
                    })()}
                  </div>
                  <button className="text-sm text-indigo-600 hover:underline shrink-0 ml-4" onClick={() => {
                    setSelectedItems([])
                    setShowAddService(false)
                  }}>Supprimer</button>
                </div>
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
          <button aria-label="Fermer" className="absolute right-4 top-4 text-gray-500 hover:text-black" onClick={() => setTicketOpen(false)}>
            <X className="h-5 w-5" />
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Ticket de réservation</AlertDialogTitle>
            <AlertDialogDescription>
              {ticketData ? (
                <div id="ticket">
                  <div className="font-medium">{ticketData.salonName}</div>
                  <div className="text-sm text-gray-600">{ticketData.date} • à {ticketData.time}</div>
                  <div className="mt-2 text-sm">Prestation: {ticketData.serviceName}</div>
                  {ticketData.price && (
                    <div className="text-sm">Prix: {ticketData.price}</div>
                  )}
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
            <AlertDialogAction
              onClick={() => {
                setTicketOpen(false)
                if (salon?.id) {
                  router.push(`/salon/${buildSalonSlug(salon?.name || "", salon.id, salon?.city || null)}`)
                }
              }}
            >
              Retour au salon
            </AlertDialogAction>
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
                            const hasRange = typeof svc.price_min_cents === 'number' && typeof svc.price_max_cents === 'number'
                            setSelectedItems((prev)=> [...prev, {
                              id: svc.id,
                              name: svc.name,
                              duration_minutes: svc.duration_minutes || 30,
                              price_cents: hasRange ? null : (typeof svc.price_cents === 'number' ? svc.price_cents : null),
                              ...(typeof svc.price_min_cents === 'number' ? { price_min_cents: svc.price_min_cents } : {}),
                              ...(typeof svc.price_max_cents === 'number' ? { price_max_cents: svc.price_max_cents } : {}),
                            }])
                            setShowAddService(false)
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{svc.name}</div>
                            <div className="text-sm text-gray-500">
                              {svc.duration_minutes || 30} min • {typeof svc.price_min_cents === 'number' && typeof svc.price_max_cents === 'number'
                                ? `${Math.round(svc.price_min_cents / 100)}–${Math.round(svc.price_max_cents / 100)} DA`
                                : `${Math.round(((svc.price_cents ?? 0) as number) / 100)} DA`}
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
            {/* Résumé sélection si agenda masqué */}
            {!showAgenda && selectedDate && selectedTime && (
              <div className="mb-3">
                <div className="w-full bg-white border rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="text-sm text-gray-800">
                    <span className="capitalize">{new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span>à {selectedTime}</span>
                  </div>
                  <button className="text-sm text-indigo-600 hover:underline" onClick={() => setShowAgenda(true)}>Modifier</button>
                </div>
              </div>
            )}
            {loadingSlots ? (
              <div className="text-sm text-gray-500">Chargement des créneaux…</div>
            ) : (
              <div className={`relative overflow-x-auto ${!showAgenda ? 'hidden' : ''}`}>
                <button aria-label="Semaine précédente" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-gray-100" onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() - 7); setStartDate(d.toISOString().split('T')[0]) }}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button aria-label="Semaine suivante" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 hover:bg-gray-100" onClick={() => { const d = new Date(startDate); d.setDate(d.getDate() + 7); setStartDate(d.toISOString().split('T')[0]) }}>
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="grid grid-cols-7 gap-4 w-full bg-white border rounded-2xl p-6 shadow-sm">
                  {slots.slice(0, 7).map((d) => {
                    const dateObj = new Date(d.date)
                    const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' })
                    const day = dateObj.toLocaleDateString('fr-FR', { day: '2-digit' })
                    const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' })
                    return (
                      <div key={d.date} className="flex flex-col">
                        <div className="text-center mb-3">
                          <div className="text-sm font-medium text-gray-800 capitalize">{dayName}</div>
                          <div className="text-xs text-gray-500">{day} {month}.</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          {d.slots.length === 0 && (
                            <div className="text-xs text-gray-400 text-center">Aucun créneau</div>
                          )}
                          {d.slots.map((t) => (
                            <button
                              key={`${d.date}-${t}`}
                              className={`text-sm h-9 rounded-md px-3 py-2 transition font-medium text-gray-800 ${selectedDate === d.date && selectedTime === t ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                              onClick={() => { setSelectedDate(d.date); setSelectedTime(t); setShowInfo(true); setShowAgenda(false) }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ajouter une prestation à la suite */}
      <div className="mt-3">
        <Button variant="default" className="bg-black hover:bg-gray-800 text-white mb-3" onClick={() => setShowAddService((v)=>!v)}>
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
                            const hasRange = typeof svc.price_min_cents === 'number' && typeof svc.price_max_cents === 'number'
                            setSelectedItems((prev)=> [...prev, {
                              id: svc.id,
                              name: svc.name,
                              duration_minutes: svc.duration_minutes || 30,
                              price_cents: hasRange ? null : (typeof svc.price_cents === 'number' ? svc.price_cents : null),
                              ...(typeof svc.price_min_cents === 'number' ? { price_min_cents: svc.price_min_cents } : {}),
                              ...(typeof svc.price_max_cents === 'number' ? { price_max_cents: svc.price_max_cents } : {}),
                            }])
                            setShowAddService(false)
                          }}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{svc.name}</div>
                            <div className="text-sm text-gray-500">
                              {svc.duration_minutes || 30} min • {typeof svc.price_min_cents === 'number' && typeof svc.price_max_cents === 'number'
                                ? `${Math.round(svc.price_min_cents / 100)}–${Math.round(svc.price_max_cents / 100)} DA`
                                : `${Math.round(((svc.price_cents ?? 0) as number) / 100)} DA`}
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
              if (submitLock.current) return
              submitLock.current = true
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
                    price_cents: (typeof it.price_cents === 'number' ? it.price_cents : null) as any,
                    currency: 'DZD',
                    employee_id: selectedEmployeeId || undefined,
                  })),
                }
                try { console.log('[BookingWizard] submit payload', { payload, selectedItems }) } catch {}
                const res = await fetch('/api/client/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                const j = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(j?.error || 'Impossible de créer la réservation')
                // Open ticket modal with data (provisional employee name)
                const bookingId = j?.booking?.id
                try { console.log('[BookingWizard] booking created', { bookingId, business_id: salon?.id }) } catch {}
                // Compute price text (fixed total or min–max range)
                let minTotal = 0
                let maxTotal = 0
                let counted = false
                for (const it of selectedItems) {
                  const pc = typeof it.price_cents === 'number' ? it.price_cents : null
                  const pmin = typeof (it as any).price_min_cents === 'number' ? (it as any).price_min_cents : null
                  const pmax = typeof (it as any).price_max_cents === 'number' ? (it as any).price_max_cents : null
                  if (pc != null) { minTotal += pc; maxTotal += pc; counted = true }
                  else if (pmin != null && pmax != null) { minTotal += pmin; maxTotal += pmax; counted = true }
                }
                const priceText = !counted
                  ? '—'
                  : (minTotal === maxTotal)
                    ? `${Math.round(minTotal / 100)} DA`
                    : `${Math.round(minTotal / 100)}–${Math.round(maxTotal / 100)} DA`
                setTicketData({
                  id: bookingId,
                  salonName: salon?.name,
                  date: new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
                  time: selectedTime,
                  serviceName: selectedItems.map(s=>s.name).join(' + '),
                  employee: employees.find(e => e.id === selectedEmployeeId)?.full_name || 'Sans préférence',
                  price: priceText,
                })
                setTicketOpen(true)
                // Refresh employee from server-assigned value (handles 'Sans préférence')
                if (bookingId) {
                  try {
                    const det = await fetch(`/api/client/bookings/${bookingId}`, { cache: 'no-store' })
                    const dj = await det.json().catch(() => null)
                    const name = dj?.booking?.employees?.full_name || null
                    if (name) setTicketData((prev: any) => ({ ...prev, employee: name }))
                  } catch {}
                }
              } catch (e: any) {
                setError(e?.message || 'Erreur de création')
              } finally {
                setSubmitting(false)
                submitLock.current = false
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

          {identMode === 'signup' && (
            <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Téléphone portable *</Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+213</span>
                    </div>
                    <Input 
                      type="tel" 
                      placeholder="Entrez votre numéro..." 
                      className="pl-16" 
                      value={signupPhone} 
                      onChange={e => setSignupPhone(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Email *</Label>
                  <Input 
                    type="email" 
                    placeholder="Email" 
                    className="mt-1" 
                    value={signupEmail} 
                    onChange={e => setSignupEmail(e.target.value)} 
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</Label>
                  <div className="relative">
                    <Input 
                      type={signupCGU ? 'text' : 'password'} 
                      placeholder="Mot de passe" 
                      className="mt-1 pr-10" 
                      value={signupPassword} 
                      onChange={e => setSignupPassword(e.target.value)} 
                    />
                    <button 
                      type="button" 
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setSignupCGU(!signupCGU)}
                    >
                      {signupCGU ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input 
                      id="cgu" 
                      type="checkbox" 
                      checked={signupCGU} 
                      onChange={e => setSignupCGU(e.target.checked)} 
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <label htmlFor="cgu" className="ml-2 block text-sm text-gray-700">
                    J'accepte les CGU de Yoka
                  </label>
                </div>
                
                <p className="text-xs text-gray-500">
                  En créant votre compte, vous acceptez notre politique de confidentialité et nos conditions d'utilisation.
                   La politique de confidentialité et les conditions d'utilisation de Google s'appliquent.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  className="w-full bg-black text-white hover:bg-gray-800" 
                  disabled={authSubmitting || !signupPhone || !signupEmail || !signupPassword || !signupCGU}
                  onClick={async () => {
                    try {
                      setAuthSubmitting(true)
                      setError(null)
                      
                      const userData = {
                        phone: signupPhone,
                        email: signupEmail,
                        password: signupPassword,
                        name: signupEmail.split('@')[0] // Utiliser la partie avant @ de l'email comme nom par défaut
                      };
                      
                      console.log('[Inscription] Envoi des données d\'inscription :', {
                        ...userData,
                        password: '***' // Ne pas logger le mot de passe en clair
                      });
                      
                      const startTime = Date.now();
                      const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData)
                      });
                      
                      console.log(`[Inscription] Réponse reçue en ${Date.now() - startTime}ms`, {
                        status: res.status,
                        statusText: res.statusText,
                        headers: Object.fromEntries(res.headers.entries())
                      });
                      
                      if (!res.ok) {
                        let errorData;
                        try {
                          errorData = await res.json();
                          console.error('[Inscription] Erreur détaillée du serveur:', errorData);
                        } catch (e) {
                          console.error('[Inscription] Erreur lors de la lecture de la réponse d\'erreur:', e);
                          errorData = { message: 'Réserve d\'erreur invalide du serveur' };
                        }
                        
                        console.error(`[Inscription] Échec de l'inscription avec le statut ${res.status}:`, errorData);
                        
                        if (res.status === 409) {
                          console.error('[Inscription] Conflit détecté. Données en conflit:', errorData);
                          if (errorData.field === 'email') {
                            throw new Error('Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.')
                          } else if (errorData.field === 'phone') {
                            throw new Error('Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter ou utiliser un autre numéro.')
                          }
                        }
                        
                        const errorMessage = errorData?.message || 'Erreur lors de la création du compte. Veuillez réessayer.';
                        console.error('[Inscription] Message d\'erreur à afficher à l\'utilisateur:', errorMessage);
                        throw new Error(errorMessage);
                      }
                      
                      // Connexion automatique après inscription
                      const loginRes = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: signupEmail,
                          password: signupPassword
                        })
                      })
                      
                      if (!loginRes.ok) {
                        throw new Error('Compte créé mais échec de la connexion automatique')
                      }
                      
                      setAuthOverride(true)
                      setSignupOkMsg('Compte créé avec succès !')
                      setIdentMode('none')
                      
                    } catch (e: any) {
                      setError(e?.message || 'Erreur lors de la création du compte')
                    } finally {
                      setAuthSubmitting(false)
                    }
                  }}
                >
                  {authSubmitting ? 'Création...' : 'Créer mon compte'}
                </Button>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <div className="flex-1 h-px bg-gray-200"/>
                  <span>ou</span>
                  <div className="flex-1 h-px bg-gray-200"/>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIdentMode('login')}>
                  Se connecter
                </Button>
              </div>
            </div>
          )}
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
                            <span className="text-gray-600">{it.duration_minutes}min • {typeof (it as any).price_min_cents === 'number' && typeof (it as any).price_max_cents === 'number'
                              ? `${Math.round((it as any).price_min_cents / 100)}–${Math.round((it as any).price_max_cents / 100)} DA`
                              : `${Math.round(((it.price_cents ?? 0) as number) / 100)} DA`}
                            </span>
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
                      {(() => {
                        let minTotal = 0
                        let maxTotal = 0
                        for (const it of selectedItems) {
                          const pc = typeof it.price_cents === 'number' ? it.price_cents : null
                          const pmin = typeof (it as any).price_min_cents === 'number' ? (it as any).price_min_cents : null
                          const pmax = typeof (it as any).price_max_cents === 'number' ? (it as any).price_max_cents : null
                          if (pc != null) { minTotal += pc; maxTotal += pc }
                          else if (pmin != null && pmax != null) { minTotal += pmin; maxTotal += pmax }
                        }
                        const text = (minTotal === maxTotal)
                          ? `${Math.round(minTotal / 100)} DA`
                          : `${Math.round(minTotal / 100)}–${Math.round(maxTotal / 100)} DA`
                        return (
                          <span className="font-medium">{totalDuration} min • {text}</span>
                        )
                      })()}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentStep(1)}>Modifier prestations</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
