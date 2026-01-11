"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Mail,
  MessageSquareText,
  Phone,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type LeadItem = {
  id: string;
  business_name: string;
  owner_first_name: string;
  owner_last_name: string;
  email: string;
  phone: string | null;
  activity_type: string | null;
  location: string | null;
  status: string;
  created_at: string;
};

type ApiListResp = {
  total: number;
  page: number;
  pageSize: number;
  items: LeadItem[];
};

export default function AdminLeadsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<LeadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [activity, setActivity] = useState<string | undefined>(undefined);
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Convert form fields (prefilled)
  const [emailField, setEmailField] = useState("");
  const [phoneField, setPhoneField] = useState("");
  const [ownerFirst, setOwnerFirst] = useState("");
  const [ownerLast, setOwnerLast] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [planCode, setPlanCode] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      if (q) params.set("q", q);
      if (status && status !== "all") params.set("status", status);
      if (activity) params.set("activity", activity);
      if (location) params.set("location", location);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: ApiListResp = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch (err: any) {
      toast({ title: "Erreur de chargement", description: err?.message || "" });
    } finally {
      setLoading(false);
    }
  }

  async function openLeadModal(id: string) {
    setSelectedId(id);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const res = await fetch(`/api/admin/leads/${id}`);
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const lead = data.lead || {};
      setEmailField(lead.email || "");
      setPhoneField(lead.phone || "");
      setOwnerFirst(lead.owner_first_name || "");
      setOwnerLast(lead.owner_last_name || "");
      setBusinessName(lead.business_name || "");
      setNotes(lead.notes || "");
      setPlanCode("none");
    } catch (e: any) {
      toast({ title: "Erreur de chargement", description: e?.message || "" });
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  }

  async function onConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    try {
      const payload: any = {
        email: emailField,
        phone: phoneField || null,
        owner_first_name: ownerFirst,
        owner_last_name: ownerLast,
        business_name: businessName,
        notes: notes || null,
        send_invite: sendInvite,
      };
      if (planCode && planCode !== "none") payload.plan_code = planCode;
      const res = await fetch(`/api/admin/leads/${selectedId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `API ${res.status}`);
      }
      toast({
        title: "Lead converti",
        description: sendInvite ? "Invitation envoyée" : "Compte créé",
      });
      setModalOpen(false);
      await load();
    } catch (err: any) {
      toast({
        title: "Conversion impossible",
        description: err?.message || "",
      });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load();
  }

  const StatusBadge = (props: { status: string }) => {
    const s = (props.status || "").toLowerCase();
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      contacted: "bg-sky-100 text-sky-800 border-sky-200",
      invited: "bg-indigo-100 text-indigo-800 border-indigo-200",
      validated: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    const cls = map[s] || "bg-muted text-foreground border-transparent";
    const labelMap: Record<string, string> = {
      pending: "En attente",
      contacted: "Contacté",
      invited: "Invité",
      validated: "Validé",
    };
    const label = labelMap[s] || props.status;
    return (
      <span
        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${cls}`}
      >
        {label}
      </span>
    );
  };

  const getBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();
    const map: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 border-amber-200",
      contacted: "bg-sky-100 text-sky-800 border-sky-200",
      invited: "bg-indigo-100 text-indigo-800 border-indigo-200",
      validated: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return map[s] || "bg-muted text-foreground border-transparent";
  };

  async function markContacted(id: string) {
    try {
      const res = await fetch(`/api/admin/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "contacted" }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      toast({ title: "Succès", description: "Lead marqué comme contacté" });
      load();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  }

  async function archiveLead(id: string) {
    if (!confirm("Êtes-vous sûr de vouloir archiver ce lead ?")) {
      return;
    }
    
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error?.error || `API ${res.status}`);
      }
      
      toast({ title: "Succès", description: "Lead archivé avec succès" });
      load(); // Recharger la liste des leads
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Erreur lors de l'archivage du lead",
        variant: "destructive",
      });
    }
  }

  async function updateLeadStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/leads/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      setItems(items.map((it) => (it.id === id ? { ...it, status } : it)));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  }

  async function approveLead(id: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Erreur lors de l'approbation du lead");
      }
      
      toast({
        title: "Succès",
        description: "Le lead a été approuvé et converti en entreprise avec succès",
      });
      
      // Recharger la liste des leads
      await load();
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <div className="text-xs text-muted-foreground">
            Suivez et convertissez vos prospects
          </div>
        </div>
        <div className="text-sm text-muted-foreground">Total: {total}</div>
      </div>

      {/* Lead details + Create account modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du lead & création de compte</DialogTitle>
          </DialogHeader>
          {modalLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
          ) : (
            <form onSubmit={onConvert} className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <Label>Email</Label>
                  <Input
                    value={emailField}
                    onChange={(e) => setEmailField(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Téléphone</Label>
                  <Input
                    value={phoneField}
                    onChange={(e) => setPhoneField(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Prénom</Label>
                  <Input
                    value={ownerFirst}
                    onChange={(e) => setOwnerFirst(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input
                    value={ownerLast}
                    onChange={(e) => setOwnerLast(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Nom du salon / institut</Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Offre (optionnel)</Label>
                <Select value={planCode} onValueChange={(v) => setPlanCode(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    <SelectItem value="BASIC">BASIC</SelectItem>
                    <SelectItem value="PRO">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes internes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send_invite"
                  checked={sendInvite}
                  onCheckedChange={(v) => setSendInvite(Boolean(v))}
                />
                <Label htmlFor="send_invite">
                  Créer immédiatement un compte et envoyer un lien d’activation
                </Label>
              </div>
              <div className="pt-2 flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Création..." : "Créer et envoyer invitation"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={onSearch}
            className="grid grid-cols-1 gap-4 md:grid-cols-6"
          >
            <div className="md:col-span-2">
              <Label>Recherche</Label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom, email, téléphone..."
              />
            </div>
            <div>
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="contacted">Contacté</SelectItem>
                  <SelectItem value="invited">Invité</SelectItem>
                  <SelectItem value="validated">Validé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Activité</Label>
              <Input
                value={activity || ""}
                onChange={(e) => setActivity(e.target.value || undefined)}
                placeholder="ex: coiffure"
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                value={location || ""}
                onChange={(e) => setLocation(e.target.value || undefined)}
                placeholder="ex: Paris"
              />
            </div>
            <div>
              <Label>Du</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>Au</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="md:col-span-5 flex items-end gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Recherche..." : "Rechercher"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQ("");
                  setStatus("all");
                  setActivity(undefined);
                  setLocation(undefined);
                  setFrom("");
                  setTo("");
                  setPage(1);
                  load();
                }}
              >
                Réinitialiser
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <Label className="text-sm">Par page</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full table-auto border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b bg-muted/30">
              <th className="p-2 text-left">Salon</th>
              <th className="p-2 text-left">Contact</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Téléphone</th>
              <th className="p-2 text-left">Activité</th>
              <th className="p-2 text-left">Ville</th>
              <th className="p-2 text-left">Statut</th>
              <th className="p-2 text-left">Créé</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr
                key={it.id}
                className={`border-b ${
                  idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                } hover:bg-muted/30 transition-colors`}
              >
                <td className="p-2">{it.business_name}</td>
                <td className="p-2">
                  {it.owner_first_name} {it.owner_last_name}
                </td>
                <td className="p-2">{it.email}</td>
                <td className="p-2">{it.phone || "—"}</td>
                <td className="p-2">{it.activity_type || "—"}</td>
                <td className="p-2">{it.location || "—"}</td>
                <td className="p-2">
                  <Select value={it.status} onValueChange={(value) => updateLeadStatus(it.id, value)}>
                    <SelectTrigger className={`w-32 border px-2 py-0.5 text-xs rounded ${getBadgeClass(it.status)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="contacted">Contacté</SelectItem>
                      <SelectItem value="invited">Invité</SelectItem>
                      <SelectItem value="validated">Validé</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  {new Date(it.created_at).toLocaleDateString()}
                </td>
                <td className="p-2">
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-1">
                      {it.phone && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a href={`tel:${it.phone}`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                aria-label="Appeler"
                              >
                                <Phone className="h-4 w-4" />
                              </Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>Appeler</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={`mailto:${it.email}`}>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent>Email</TooltipContent>
                      </Tooltip>
                      {it.phone && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`https://wa.me/${it.phone.replace(
                                /[^\\d]/g,
                                ""
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                aria-label="WhatsApp"
                              >
                                <MessageSquareText className="h-4 w-4" />
                              </Button>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>WhatsApp</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => markContacted(it.id)}
                            aria-label="Marquer contacté"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Marquer contacté</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => openLeadModal(it.id)}
                          >
                            <UserPlus className="mr-1 h-3 w-3" />
                            Créer compte
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Créer un compte SaaS</TooltipContent>
                      </Tooltip>
                      <Link href={`/admin/leads/${it.id}`}>
                        <Button size="sm" variant="outline" className="h-8">
                          Ouvrir
                        </Button>
                      </Link>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive/90"
                            onClick={() => archiveLead(it.id)}
                            aria-label="Archiver"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archiver le lead</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td
                  className="p-8 text-center text-muted-foreground"
                  colSpan={9}
                >
                  Aucun résultat. Essayez d’ajuster vos filtres ou cliquez sur
                  “Réinitialiser”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} / {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
