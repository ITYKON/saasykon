"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function EditClientPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const id = params.id;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pro/clients/${id}`)
      .then((r) => r.json())
      .then((j) => {
        const c = j.client;
        if (c) {
          setFirstName(c.first_name || "");
          setLastName(c.last_name || "");
          setPhone(c.phone || "");
          setNotes(c.notes || "");
          setEmail(c.users?.email || "");
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/pro/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, phone, notes }),
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde");
      router.push(`/pro/clients/${id}`);
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
      const res = await fetch(`/api/pro/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      router.push("/pro/clients");
    } catch (e) {
      alert((e as any)?.message || "Erreur");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-600">Chargement…</div>;

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold text-black">Modifier le client</h1>
      <Card>
        <CardContent className="p-6 space-y-4">
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
              <Label>Téléphone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Email (lecture seule)</Label>
              <Input value={email} readOnly />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="destructive" onClick={removeClient} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => history.back()}>Annuler</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Sauvegarde…" : "Enregistrer"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
