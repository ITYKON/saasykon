"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Row = {
  id: string;
  business_id: string;
  business_name: string;
  status: string;
  rc_number?: string | null;
  rc_document_url?: string | null;
  id_document_front_url?: string | null;
  id_document_back_url?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
};

export default function AdminVerificationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("pending");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<string>("");
  const [act, setAct] = useState<{ id: string; business_id: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const url = new URL(window.location.origin + "/api/admin/verifications");
      if (status && status !== "all") url.searchParams.set("status", status);
      if (q) url.searchParams.set("q", q);
      const res = await fetch(url.toString());
      const data = await res.json();
      setRows(data.items || []);
    } catch (e) {
      toast({ title: "Chargement impossible", description: (e as any)?.message || "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function verify(businessId: string, newStatus: "verified" | "rejected") {
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (!res.ok) throw new Error("Action impossible");
      toast({ title: newStatus === "verified" ? "Dossier validé" : "Dossier rejeté" });
      setAct(null);
      setNotes("");
      await load();
    } catch (e) {
      toast({ title: "Erreur", description: (e as any)?.message || "" });
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-end gap-3">
        <div className="w-64">
          <Label>Recherche (nom du salon)</Label>
          <Input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Rechercher…" />
        </div>
        <div>
          <Label>Statut</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="verified">Validé</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={load} disabled={loading}>{loading ? "Chargement…" : "Filtrer"}</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{r.business_name}</span>
                <span className="text-sm font-normal text-muted-foreground">{r.status}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>RC: {r.rc_number || "—"}</div>
              <div className="flex flex-wrap gap-2">
                {r.rc_document_url && <a className="underline" href={r.rc_document_url} target="_blank" rel="noreferrer">Document RC</a>}
                {r.id_document_front_url && <a className="underline" href={r.id_document_front_url} target="_blank" rel="noreferrer">CNI recto</a>}
                {r.id_document_back_url && <a className="underline" href={r.id_document_back_url} target="_blank" rel="noreferrer">CNI verso</a>}
              </div>
              <div className="pt-2">
                <Label>Notes (optionnel)</Label>
                <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Commentaire pour le commerçant" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={()=>verify(r.business_id, "rejected")}>Rejeter</Button>
                <Button onClick={()=>verify(r.business_id, "verified")}>Valider</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
