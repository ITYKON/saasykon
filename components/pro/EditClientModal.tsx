"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditClientModal({
  clientId,
  trigger,
  onSaved,
  onDeleted,
}: {
  clientId: string;
  trigger: React.ReactNode;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("NOUVEAU");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/pro/clients/${clientId}`)
      .then((r) => r.json())
      .then((j) => {
        const c = j.client;
        if (c) {
          setFirstName(c.first_name || "");
          setLastName(c.last_name || "");
          setPhone(c.phone || "");
          setNotes(c.notes || "");
          setEmail(c.users?.email || "");
          setStatus((c.status as string) || "NOUVEAU");
        }
      })
      .finally(() => setLoading(false));
  }, [open, clientId]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/pro/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone, notes, status }),
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde");
      setOpen(false);
      onSaved?.();
    } catch (e) {
      alert((e as any)?.message || "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function removeClient() {
    if (!confirm("Supprimer ce client ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pro/clients/${clientId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      setOpen(false);
      onDeleted?.();
    } catch (e) {
      alert((e as any)?.message || "Erreur");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier le client</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-4 text-sm text-gray-600">Chargement…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div>
                <Label>Email (lecture seule)</Label>
                <Input value={email} readOnly />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Choisir un statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="REGULIER">Régulier</SelectItem>
                    <SelectItem value="NOUVEAU">Nouveau</SelectItem>
                    <SelectItem value="AUCUN">Aucun</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="destructive" onClick={removeClient} disabled={deleting}>
                {deleting ? "Suppression…" : "Supprimer"}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                <Button onClick={save} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer"}</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
