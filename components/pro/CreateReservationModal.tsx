"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [employees, setEmployees] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [serviceId, setServiceId] = useState<string>("");
  const [variantId, setVariantId] = useState<string>("");
  const [employeeId, setEmployeeId] = useState<string>("none");
  const [clientId, setClientId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [priceCents, setPriceCents] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/pro/services?business_id=${businessId}`).then((r) => r.json()),
      fetch(`/api/pro/employees?business_id=${businessId}`).then((r) => r.json()),
    ])
      .then(([s, e]) => {
        setServices(s.services || []);
        setEmployees(e.employees || []);
      })
      .finally(() => setLoading(false));
  }, [open, businessId]);

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);
  const variants = selectedService?.service_variants || [];

  useEffect(() => {
    if (!variantId && variants.length) {
      setVariantId(variants[0].id);
      setDuration(String(variants[0].duration_minutes || 30));
      setPriceCents(String(variants[0].price_cents || 0));
    }
  }, [variants, variantId]);

  async function submit() {
    setSubmitting(true);
    try {
      const starts_at = new Date(`${date}T${time}:00`);
      const res = await fetch("/api/pro/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: businessId,
          client_id: clientId || null,
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Service</Label>
                <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setVariantId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Variante</Label>
                <Select value={variantId} onValueChange={(v) => setVariantId(v)} disabled={!variants.length}>
                  <SelectTrigger><SelectValue placeholder={!variants.length ? "Aucune" : "Choisir"} /></SelectTrigger>
                  <SelectContent>
                    {variants.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name || `${v.duration_minutes} min`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employé (optionnel)</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Client ID (optionnel)</Label>
                <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="UUID client" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <Label>Heure</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div>
                <Label>Durée (min)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div>
                <Label>Prix (centimes)</Label>
                <Input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={submit} disabled={submitting || !serviceId || !date || !time}>{submitting ? "Création…" : "Créer le RDV"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
