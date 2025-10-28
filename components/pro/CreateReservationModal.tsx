"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientSearch } from "@/components/ui/client-search";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CreateReservationModal({
  businessId,
  trigger,
}: {
  businessId: string;
  trigger: React.ReactNode;
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
  const [employeeId, setEmployeeId] = useState<string>("none");
  const [client, setClient] = useState<{id: string; name: string; phone?: string; email?: string} | null>(null);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [priceCents, setPriceCents] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Charger les services et employés
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/pro/services?business_id=${businessId}`).then((r) => r.json()),
      fetch(`/api/pro/employees?business_id=${businessId}&include=services&limit=200`).then((r) => r.json()),
    ])
      .then(([s, e]) => {
        setServices(s.services || []);
        setAllEmployees(e.items || []);
        setFilteredEmployees(e.items || []);
      })
      .finally(() => setLoading(false));
  }, [open, businessId]);

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
  }, []);

  useEffect(() => {
    if (!variantId && variants.length) {
      setVariantId(variants[0].id);
      setDuration(String(variants[0].duration_minutes || 30));
      setPriceCents(String(variants[0].price_cents || 0));
    }
  }, [variants, variantId]);

  async function submit() {
    if (!client) {
      alert("Veuillez sélectionner un client");
      return;
    }
    
    setSubmitting(true);
    try {
      const starts_at = new Date(`${date}T${time}:00`);
      const res = await fetch("/api/pro/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          client_id: client.id,
          employee_id: employeeId === "none" ? null : employeeId || null,
          starts_at: starts_at.toISOString(),
          notes: notes || null,
          items: [
            {
              service_id: serviceId,
              variant_id: variantId || null,
              price_cents: Number(priceCents || 0),
              duration_minutes: Number(duration || 30),
            },
          ],
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Erreur de création");
      
      // Réinitialiser le formulaire
      setClient(null);
      setClientSearch("");
      setServiceId("");
      setVariantId("");
      setEmployeeId("none");
      setDate("");
      setTime("");
      setNotes("");
      
      setOpen(false);
    } catch (e) {
      alert((e as any)?.message || "Erreur de création");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau RDV</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-6 text-sm text-gray-600">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-4">
              {/* Section Client */}
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <ClientSearch
                  value={clientSearch}
                  onChange={setClientSearch}
                  onSelect={handleClientSelect}
                  businessId={businessId}
                  placeholder="Rechercher un client par nom, email ou téléphone"
                />
                {client && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{client.name}</div>
                    {client.phone && <div className="text-sm text-gray-600">📞 {client.phone}</div>}
                    {client.email && <div className="text-sm text-gray-600">✉️ {client.email}</div>}
                  </div>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un service" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="max-h-60">
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col">
                              <span>{service.name}</span>
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
                        const selectedVariant = variants.find((v: any) => v.id === value);
                        if (selectedVariant) {
                          setDuration(String(selectedVariant.duration_minutes || duration));
                          setPriceCents(String(selectedVariant.price_cents || priceCents));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une variante" />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="max-h-60">
                          {variants.map((variant: any) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              <div className="flex justify-between w-full">
                                <span>{variant.name}</span>
                                <span className="text-gray-500 ml-2">
                                  {variant.duration_minutes} min • {variant.price_cents ? `${(variant.price_cents / 100).toFixed(2)} DA` : 'Prix non défini'}
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
                  <Label>Prix (DA) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">DA</span>
                    <Input 
                      type="number" 
                      value={priceCents !== '' ? (Number(priceCents) / 100).toFixed(2) : ''} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setPriceCents('');
                        } else {
                          setPriceCents(String(Math.round(Number(val) * 100)));
                        }
                      }} 
                      min="0"
                      step="0.01"
                      className="pl-8"
                      required
                    />
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
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button
                  onClick={submit}
                  disabled={submitting || !serviceId || !date || !time || !client || !duration || !priceCents}
                >
                  {submitting ? "Création en cours..." : "Confirmer la réservation"}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 text-right">
                * Champs obligatoires
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
