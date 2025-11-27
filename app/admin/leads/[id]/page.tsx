"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, MessageSquareText, CheckCircle } from "lucide-react";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  
  if (!id) {
    return <div>ID non trouvé</div>; // Ou une autre gestion d'erreur appropriée
  }
  
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Convert form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerFirst, setOwnerFirst] = useState("");
  const [ownerLast, setOwnerLast] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [planCode, setPlanCode] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      setLead(data.lead);
      setHistory(data.history || []);
      // Prefill convert form
      setEmail(data.lead?.email || "");
      setPhone(data.lead?.phone || "");
      setOwnerFirst(data.lead?.owner_first_name || "");
      setOwnerLast(data.lead?.owner_last_name || "");
      setBusinessName(data.lead?.business_name || "");
      setNotes(data.lead?.notes || "");
    } catch (err: any) {
      toast({ title: "Erreur de chargement", description: err?.message || "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function onConvert(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        email,
        phone: phone || null,
        owner_first_name: ownerFirst,
        owner_last_name: ownerLast,
        business_name: businessName,
        notes: notes || null,
        send_invite: sendInvite,
      };
      if (planCode && planCode !== "none") payload.plan_code = planCode;
      const res = await fetch(`/api/admin/leads/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `API ${res.status}`);
      }
      toast({ title: "Lead converti", description: sendInvite ? "Invitation envoyée" : "Compte créé" });
      router.push("/admin/leads");
    } catch (err: any) {
      toast({ title: "Conversion impossible", description: err?.message || "" });
    } finally {
      setSubmitting(false);
    }
  }

  async function markContacted() {
    try {
      const res = await fetch(`/api/admin/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "contacted" })
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      toast({ title: "Statut mis à jour", description: "Lead marqué comme contacté" });
      await load();
    } catch (err: any) {
      toast({ title: "Impossible de mettre à jour", description: err?.message || "" });
    }
  }

  if (loading) return <div className="p-6">Chargement...</div>;
  if (!lead) return <div className="p-6">Lead introuvable.</div>;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Lead</h1>
        <Link href="/admin/leads"><Button variant="outline">Retour</Button></Link>
      </div>

      {/* Quick actions */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {lead?.phone && (
          <a href={`tel:${lead.phone}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><Phone className="mr-2 h-4 w-4" /> Appeler</Button>
          </a>
        )}
        {lead?.phone && (
          <a href={`https://wa.me/${lead.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><MessageSquareText className="mr-2 h-4 w-4" /> WhatsApp</Button>
          </a>
        )}
        <Button variant="outline" size="sm" onClick={markContacted}><CheckCircle className="mr-2 h-4 w-4" /> Marquer contacté</Button>
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm">Créer un compte SaaS</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un compte et (option) envoyer une invitation</DialogTitle>
            </DialogHeader>
            <form onSubmit={onConvert} className="grid grid-cols-1 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prénom</Label>
                  <Input value={ownerFirst} onChange={(e) => setOwnerFirst(e.target.value)} required />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input value={ownerLast} onChange={(e) => setOwnerLast(e.target.value)} required />
                </div>
              </div>
              <div>
                <Label>Nom du salon / institut</Label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
              <div>
                <Label>Offre (optionnel)</Label>
                <Select value={planCode} onValueChange={(v) => setPlanCode(v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes internes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="send_invite" checked={sendInvite} onCheckedChange={(v) => setSendInvite(Boolean(v))} />
                <Label htmlFor="send_invite">Créer immédiatement un compte et envoyer un lien d’activation</Label>
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="submit" disabled={submitting}>{submitting ? "Création..." : "Créer et envoyer invitation"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Annuler</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Détails</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Salon</div>
                <div className="font-medium">{lead.business_name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Contact</div>
                <div className="font-medium">{lead.owner_first_name} {lead.owner_last_name}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Email</div>
                <div>{lead.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Téléphone</div>
                <div>{lead.phone || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Activité</div>
                <div>{lead.activity_type || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ville</div>
                <div>{lead.location || "—"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground">Notes</div>
                <div className="whitespace-pre-wrap">{lead.notes || "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right side column left empty since convert is done via modal */}
        <div></div>
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
        <CardContent>
          {history.length === 0 && <div className="text-sm text-muted-foreground">Aucun événement</div>}
          <ul className="space-y-3 text-sm">
            {history.map((ev, idx) => (
              <li key={idx} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{ev.event_name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ev.occurred_at || ev.created_at || Date.now()).toLocaleString()}</div>
                </div>
                {ev.payload && (
                  <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(ev.payload, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
