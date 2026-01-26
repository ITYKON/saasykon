"use client";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSearch } from "@/components/ui/client-search";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CreateReservationModal({
  trigger,
  onCreated,
  defaultDate,
  defaultTime,
  defaultEmployeeId,
  forceOpenSignal,
}: {
  trigger: React.ReactNode;
  onCreated?: () => void;
  defaultDate?: string; // yyyy-mm-dd
  defaultTime?: string; // HH:mm
  defaultEmployeeId?: string | "none";
  forceOpenSignal?: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const [serviceId, setServiceId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string }>>([]);
  const [employeeId, setEmployeeId] = useState<string | "none">(defaultEmployeeId || "none");
  const employeesRef = useRef(employees);
  employeesRef.current = employees;
  const [client, setClient] = useState<{id: string; name: string; phone?: string; email?: string} | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [priceCents, setPriceCents] = useState<string>("");
  const [priceMode, setPriceMode] = useState<'fixed' | 'range'>('fixed');
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // New Client State
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");

  // Charger les services et employés
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/pro/services`).then((r) => r.json()),
      fetch(`/api/pro/employees?include=services&limit=200`).then((r) => r.json()),
    ])
      .then(([s, e]) => {
        setServices(s.services || []);
        setAllEmployees(e.items || []);
        setFilteredEmployees(e.items || []);
        setEmployees(e.items || []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  // Appliquer des valeurs par défaut à l'ouverture
  useEffect(() => {
    if (!open) return;
    if (defaultDate) setDate(defaultDate);
    if (defaultTime) setTime(defaultTime);
    if (typeof defaultEmployeeId !== 'undefined') setEmployeeId(defaultEmployeeId || "none");
  }, [open]);

  // Ouvrir sur demande externe avec pré-remplissage
  useEffect(() => {
    if (typeof forceOpenSignal === 'number' && forceOpenSignal > 0) {
      if (defaultDate) setDate(defaultDate);
      if (defaultTime) setTime(defaultTime);
      if (typeof defaultEmployeeId !== 'undefined') setEmployeeId(defaultEmployeeId || "none");
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpenSignal]);

  // Filtrer les employés en fonction du service sélectionné
  useEffect(() => {
    if (!serviceId) {
      setFilteredEmployees(allEmployees);
      setEmployeeId("none");
      return;
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    // Filtrer les employés qui proposent ce service via employee_services
    const filtered = allEmployees.filter((emp: any) =>
      Array.isArray(emp.employee_services) && emp.employee_services.some((es: any) => es?.services?.id === serviceId)
    );
    setFilteredEmployees(filtered);
    
    // Réinitialiser la sélection d'employé
    setEmployeeId("none");
  }, [serviceId, services, allEmployees]);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const variants = selectedService?.service_variants || [];
  
  // Gérer la sélection d'un client
  const handleClientSelect = useCallback((client: { id: string; name: string; phone?: string; email?: string }) => {
    setClient({
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email
    });
    setClientSearch(client.name);
    setIsNewClient(false);
  }, []);

  useEffect(() => {
    if (!variantId && variants.length) {
      const v = variants[0] as any
      setVariantId(v.id);
      setDuration(String(v.duration_minutes || 30));
      const hasRange = typeof v?.price_min_cents === 'number' && typeof v?.price_max_cents === 'number'
      if (hasRange) { setPriceMode('range'); setPriceCents(''); }
      else { setPriceMode('fixed'); setPriceCents(String(v?.price_cents || 0)); }
    }
  }, [variants, variantId]);

  // Vérifier la disponibilité du créneau
  async function checkAvailability() {
    if (!date || !time || !duration) return true; // Pas de vérification si les champs requis ne sont pas remplis
    
    const startsAt = new Date(`${date}T${time}:00`);
    const endsAt = new Date(startsAt.getTime() + (Number(duration) || 30) * 60000);
    
    try {

      
      const res = await fetch(`/api/pro/availability/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          employee_id: employeeId === "none" ? null : employeeId,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || "Erreur de vérification de disponibilité");
      }
      
      if (data.available === false) {
        if (data.conflict) {
          // Utiliser les informations du conflit renvoyées par l'API
          const { client_name, employee_name, starts_at, ends_at } = data.conflict;
          const startTime = new Date(starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const endTime = new Date(ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          
          setAvailabilityError(
            `⚠️ ${employee_name} est déjà réservé(e) pour ${client_name} de ${startTime} à ${endTime}. ` +
            "Veuillez choisir un autre horaire ou un autre employé."
          );
        } else {
          // Fallback si les informations de conflit ne sont pas disponibles
          const employeeName = employeeId && employeeId !== "none" 
            ? employeesRef.current.find((e: { id: string }) => e.id === employeeId)?.full_name 
            : "l'employé sélectionné";
          
          setAvailabilityError(
            `⚠️ ${employeeName} est déjà occupé(e) sur ce créneau. ` +
            "Veuillez choisir un autre horaire ou un autre employé."
          );
        }
        return false;
      }
      
      setAvailabilityError(null);
      return true;
      
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Erreur inconnue";
      console.error("Erreur lors de la vérification de disponibilité:", e);
      setAvailabilityError(`Erreur de vérification de disponibilité: ${errorMessage}`);
      return false;
    }
  }

  async function submit() {
    // Réinitialiser les erreurs
    setAvailabilityError(null);
    
    // Validation des champs obligatoires
    if (!isNewClient && !client) {
      setAvailabilityError("Veuillez sélectionner un client");
      return;
    }

    if (isNewClient && (!newClientLastName || !newClientFirstName)) {
      setAvailabilityError("Veuillez renseigner le nom et le prénom du client");
      return;
    }
    
    if (isNewClient && !newClientPhone) {
        setAvailabilityError("Veuillez renseigner le numéro de téléphone");
        return;
    }
    
    if (!serviceId) {
      setAvailabilityError("Veuillez sélectionner un service");
      return;
    }
    
    if (!date || !time) {
      setAvailabilityError("Veuillez sélectionner une date et une heure");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Vérifier d'abord la disponibilité
      const isAvailable = await checkAvailability();
      
      if (!isAvailable) {
        setSubmitting(false);
        return;
      }
      
      const starts_at = new Date(`${date}T${time}:00`);
      const res = await fetch("/api/pro/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: isNewClient ? null : client?.id,
          new_client: isNewClient ? {
            first_name: newClientFirstName,
            last_name: newClientLastName,
            phone: newClientPhone,
            email: newClientEmail
          } : null,
          employee_id: employeeId === "none" ? null : employeeId || null,
          starts_at: starts_at.toISOString(),
          notes: notes || null,
          items: [
            {
              service_id: serviceId,
              variant_id: variantId || null,
              price_cents: priceMode === 'fixed' ? Number(priceCents || 0) : null,
              currency: 'DZD',
              employee_id: employeeId === "none" ? null : employeeId || null,
              duration_minutes: Number(duration || 30),
            },
          ],
        }),
      });
      
      const text = await res.text();
      let j: any = {};
      try { j = JSON.parse(text); } catch {}
      
      if (!res.ok) {
        throw new Error(j?.error || text || "Erreur de création");
      }
      
      // Réinitialiser le formulaire
      setClient(null);
      setClientSearch("");
      setIsNewClient(false);
      setNewClientFirstName("");
      setNewClientLastName("");
      setNewClientFirstName("");
      setNewClientLastName("");
      setNewClientPhone("");
      setNewClientEmail("");
      setServiceId("");
      setVariantId("");
      setEmployeeId("none");
      setDate("");
      setTime("");
      setNotes("");
      setAvailabilityError(null);
      
      if (onCreated) onCreated();
      setOpen(false);
    } catch (e) {
      setAvailabilityError((e as any)?.message || "Erreur lors de la création de la réservation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau RDV</DialogTitle>
          {availabilityError && (
            <div className="mt-4 w-full">
              <div className="w-full p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                <div className="flex items-start gap-2 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Créneau indisponible</p>
                    <p className="text-sm mt-1">{availabilityError.replace('⚠️', '').trim()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        {loading ? (
          <div className="py-6 text-sm text-gray-600">Chargement…</div>
        ) : (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            <div className="space-y-4">
              {/* Section Client */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="client">Client *</Label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-blue-600 hover:text-blue-800"
                        onClick={() => {
                            setIsNewClient(!isNewClient);
                            setClient(null);
                            setClientSearch("");
                        }}
                    >
                        {isNewClient ? "Rechercher un client existant" : "Nouveau client ?"}
                    </Button>
                </div>
                
                {isNewClient ? (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-md border border-gray-100">
                        <div className="space-y-1">
                            <Label htmlFor="newClientLastName" className="text-xs">Nom *</Label>
                            <Input 
                                id="newClientLastName"
                                value={newClientLastName}
                                onChange={(e) => setNewClientLastName(e.target.value)}
                                placeholder="Nom"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="newClientFirstName" className="text-xs">Prénom *</Label>
                            <Input 
                                id="newClientFirstName"
                                value={newClientFirstName}
                                onChange={(e) => setNewClientFirstName(e.target.value)}
                                placeholder="Prénom"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="newClientPhone" className="text-xs">Téléphone *</Label>
                            <Input 
                                id="newClientPhone"
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                placeholder="05XXXXXXXX"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="newClientEmail" className="text-xs">Email</Label>
                            <Input 
                                id="newClientEmail"
                                type="email"
                                value={newClientEmail}
                                onChange={(e) => setNewClientEmail(e.target.value)}
                                placeholder="client@exemple.com"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <ClientSearch
                        value={clientSearch}
                        onChange={setClientSearch}
                        onSelect={handleClientSelect}
                        placeholder="Rechercher un client par nom, email ou téléphone"
                        />
                        {client && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            <div className="font-medium">{client.name}</div>
                            {client.phone && <div className="text-sm text-gray-600">📞 {client.phone}</div>}
                            {client.email && <div className="text-sm text-gray-600">✉️ {client.email}</div>}
                        </div>
                        )}
                    </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Service */}
                <div className="space-y-2">
                  <Label htmlFor="service">Service *</Label>
                  <Select 
                    value={serviceId} 
                    onValueChange={(value) => {
                      setServiceId(value);
                      setVariantId("");
                    }}
                  >
                    <SelectTrigger className="h-auto max-h-12 overflow-hidden whitespace-normal line-clamp-2">
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="max-h-60">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col">
                              <span className="break-words max-w-xs">{service.name}</span>
                              {service.duration_minutes && (
                                <span className="text-xs text-gray-500">
                                  Durée: {service.duration_minutes} min
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                {/* Variante */}
                {variants.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="variant">Variante (optionnel)</Label>
                    <Select 
                      value={variantId} 
                      onValueChange={(value) => {
                        setVariantId(value);
                        const selectedVariant = variants.find((v: any) => v.id === value) as any;
                        if (selectedVariant) {
                          setDuration(String(selectedVariant.duration_minutes || duration));
                          const hasRange = typeof selectedVariant?.price_min_cents === 'number' && typeof selectedVariant?.price_max_cents === 'number'
                          if (hasRange) { setPriceMode('range'); setPriceCents(''); }
                          else { setPriceMode('fixed'); setPriceCents(String(selectedVariant.price_cents || priceCents)); }
                        }
                      }}
                    >
                      <SelectTrigger className="h-auto max-h-12 overflow-hidden">
                        <SelectValue placeholder="Sélectionner une variante" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="max-h-60">
                          {variants.map((variant: any) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              <div className="flex flex-col gap-1">
                                <span className="break-words max-w-xs">{variant.name}</span>
                                <span className="text-gray-500 text-xs">
                                  {variant.duration_minutes} min • {typeof variant.price_min_cents === 'number' && typeof variant.price_max_cents === 'number'
                                    ? `${Math.round(variant.price_min_cents / 100)}–${Math.round(variant.price_max_cents / 100)} DA`
                                    : (typeof variant.price_cents === 'number' ? `${Math.round(variant.price_cents / 100)} DA` : 'Prix non défini')}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Employé */}
                <div className="space-y-2">
                  <Label>Employé (optionnel)</Label>
                  <Select 
                    value={employeeId} 
                    onValueChange={setEmployeeId}
                    disabled={!serviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={serviceId ? "Sélectionner un employé" : "Sélectionnez d'abord un service"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun employé spécifique</SelectItem>
                      {filteredEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date et Heure */}
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input 
                    type="date" 
                    value={date} 
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)} 
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Heure *</Label>
                  <Input 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                    required
                  />
                </div>

                {/* Durée et Prix */}
                <div className="space-y-2">
                  <Label>Durée (minutes) *</Label>
                  <Input 
                    type="number" 
                    value={duration} 
                    onChange={(e) => setDuration(e.target.value)} 
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prix *</Label>
                  <div className={`grid ${priceMode === 'fixed' ? 'grid-cols-3' : 'grid-cols-1'} gap-2 items-center`}>
                    <Select value={priceMode} onValueChange={(v: any) => setPriceMode(v)}>
                      <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixe</SelectItem>
                        <SelectItem value="range">Variable</SelectItem>
                      </SelectContent>
                    </Select>
                    {priceMode === 'fixed' ? (
                      <div className="relative col-span-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">DA</span>
                        <Input 
                          type="number" 
                          value={priceCents !== '' ? String(Math.floor(Number(priceCents) / 100)) : ''} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setPriceCents('');
                            } else {
                              const dinars = Math.max(0, Math.floor(Number(val)) || 0);
                              setPriceCents(String(dinars * 100));
                            }
                          }}
                          placeholder="0"
                          className="pl-10"
                          step="1"
                          min="0"
                          required
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <textarea
                  id="notes"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes supplémentaires pour la réservation..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <div className="relative group">
                    <Button 
                      type="submit"
                      disabled={submitting || (!isNewClient && !client) || (isNewClient && (!newClientFirstName || !newClientLastName)) || !serviceId || !date || !time}
                      className="w-full"
                    >
                      {submitting ? "Création en cours..." : "Confirmer la réservation"}
                    </Button>
                    
                    {/* Message d'aide au survol */}
                    {(submitting || (!isNewClient && !client) || (isNewClient && (!newClientFirstName || !newClientLastName)) || !serviceId || !date || !time) && (
                      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {submitting ? "Traitement en cours..." :
                         (!isNewClient && !client) ? "Sélectionnez d'abord un client" :
                         (isNewClient && (!newClientFirstName || !newClientLastName)) ? "Remplissez le nom et prénom" : 
                         !serviceId ? "Sélectionnez un service" :
                         !date || !time ? "Sélectionnez une date et une heure" : 
                         "Confirmer la réservation"}
                      </div>
                    )}
                  </div>
                  {(!isNewClient && !client) || (isNewClient && (!newClientFirstName || !newClientLastName)) || !serviceId || !date || !time ? (
                    <p className="text-sm text-gray-500 text-center">
                      {(!isNewClient && !client) ? "Sélectionnez un client" :
                       (isNewClient && (!newClientFirstName || !newClientLastName)) ? "Remplissez le nom et prénom" :
                       !serviceId ? "Sélectionnez un service" :
                       !date || !time ? "Sélectionnez une date et une heure" : ""}
                    </p>
                  ) : null}
                </div>
              </div>
              
              <p className="text-xs text-gray-500 text-right">
                * Champs obligatoires
              </p>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
