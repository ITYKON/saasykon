"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function SalonSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"infos" | "horaires" | "employes" | "verification">("verification");

  // Verification state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("pending");
  const [rcNumber, setRcNumber] = useState("");
  const [rcDoc, setRcDoc] = useState<string | undefined>(undefined);
  const [idFront, setIdFront] = useState<string | undefined>(undefined);
  const [idBack, setIdBack] = useState<string | undefined>(undefined);

  async function loadVerification() {
    setLoading(true);
    try {
      const res = await fetch("/api/pro/verification");
      const data = await res.json();
      if (data?.item) {
        setStatus(data.item.status || "pending");
        setRcNumber(data.item.rc_number || "");
        setRcDoc(data.item.rc_document_url || undefined);
        setIdFront(data.item.id_document_front_url || undefined);
        setIdBack(data.item.id_document_back_url || undefined);
      }
    } catch (e) {
      toast({ title: "Erreur", description: (e as any)?.message || "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadVerification(); /* eslint-disable-next-line */ }, []);

  async function upload(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/onboarding", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url as string;
  }

  async function saveVerification() {
    try {
      const res = await fetch("/api/pro/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rc_number: rcNumber || null,
          rc_document_url: rcDoc || null,
          id_document_front_url: idFront || null,
          id_document_back_url: idBack || null,
        }),
      });
      if (!res.ok) throw new Error("Sauvegarde impossible");
      toast({ title: "Enregistré", description: "Vos documents ont été mis à jour." });
      await loadVerification();
    } catch (e) {
      toast({ title: "Erreur", description: (e as any)?.message || "" });
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex gap-2">
        <Button variant={tab==="infos"?"default":"outline"} onClick={()=>setTab("infos")}>
          Infos
        </Button>
        <Button variant={tab==="horaires"?"default":"outline"} onClick={()=>setTab("horaires")}>
          Horaires
        </Button>
        <Button variant={tab==="employes"?"default":"outline"} onClick={()=>setTab("employes")}>
          Employés
        </Button>
        <Button variant={tab==="verification"?"default":"outline"} onClick={()=>setTab("verification")}>
          Vérification
        </Button>
      </div>

      {tab === "verification" && (
        <Card>
          <CardHeader>
            <CardTitle>Vérification du dossier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">Statut: {status}</div>
            <div>
              <Label>Numéro RC</Label>
              <Input value={rcNumber} onChange={(e)=>setRcNumber(e.target.value)} placeholder="RC..." />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Document RC</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={async (e)=>{
                  const f=e.target.files?.[0]; if(!f) return; const url=await upload(f); setRcDoc(url); e.currentTarget.value="";
                }} />
                {rcDoc && <a className="text-sm underline" href={rcDoc} target="_blank" rel="noreferrer">Voir le document</a>}
              </div>
              <div className="space-y-1">
                <Label>CNI recto</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={async (e)=>{
                  const f=e.target.files?.[0]; if(!f) return; const url=await upload(f); setIdFront(url); e.currentTarget.value="";
                }} />
                {idFront && <a className="text-sm underline" href={idFront} target="_blank" rel="noreferrer">Voir</a>}
              </div>
              <div className="space-y-1">
                <Label>CNI verso</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={async (e)=>{
                  const f=e.target.files?.[0]; if(!f) return; const url=await upload(f); setIdBack(url); e.currentTarget.value="";
                }} />
                {idBack && <a className="text-sm underline" href={idBack} target="_blank" rel="noreferrer">Voir</a>}
              </div>
            </div>
            <div className="pt-2">
              <Button onClick={saveVerification} disabled={loading}>{loading?"Enregistrement…":"Enregistrer"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "infos" && (
        <Card>
          <CardHeader><CardTitle>Informations du salon</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">A compléter…</CardContent>
        </Card>
      )}
      {tab === "horaires" && (
        <Card>
          <CardHeader><CardTitle>Horaires</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">A compléter…</CardContent>
        </Card>
      )}
      {tab === "employes" && (
        <Card>
          <CardHeader><CardTitle>Employés</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">A compléter…</CardContent>
        </Card>
      )}
    </div>
  );
}
