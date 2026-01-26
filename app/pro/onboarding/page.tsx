"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Identité", "Registre", "Salon", "Horaires", "Employés", "Récapitulatif"] as const;

type StepKey = typeof STEPS[number];

type Draft = {
  step: number;
  identity?: { first_name?: string; last_name?: string; id_card_front?: string; id_card_back?: string };
  registry?: { rc_number?: string; nif?: string; registry_doc?: string };
  business?: { name?: string; address?: string; city?: string; description?: string; phone?: string };
  hours?: { [weekday: string]: { open?: string; close?: string; disabled?: boolean } };
  employees?: Array<{ first_name?: string; last_name?: string; role?: string; phone?: string; email?: string }>;
};

export default function ProOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>({ step: 0 });
  const step = draft.step;
  const [uploading, setUploading] = useState<string | null>(null);
  const [cameraFor, setCameraFor] = useState<null | ("id_card_front" | "id_card_back" | "registry_doc")>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isImage = (url?: string) => !!url && /(png|jpg|jpeg|gif|webp)$/i.test(url.split("?")[0] || "");

  useEffect(() => {
    const raw = localStorage.getItem("pro_onboarding_draft");
    if (raw) {
      try { setDraft(JSON.parse(raw)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pro_onboarding_draft", JSON.stringify(draft));
  }, [draft]);

  function next() { setDraft(d => ({ ...d, step: Math.min(STEPS.length - 1, d.step + 1) })); }
  function prev() { setDraft(d => ({ ...d, step: Math.max(0, d.step - 1) })); }
  function skip() { next(); }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, key: "id_card_front" | "id_card_back" | "registry_doc") {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/uploads/onboarding", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const url = data?.url as string;
      if (!url) throw new Error("No URL");
      if (key === "registry_doc") {
        setDraft(d => ({ ...d, registry: { ...d.registry, registry_doc: url } }));
      } else {
        setDraft(d => ({ ...d, identity: { ...d.identity, [key]: url } } as Draft));
      }
      toast({ title: "Fichier téléversé", description: "Votre document a été enregistré." });
    } catch (e) {
      toast({ title: "Échec du téléversement", description: (e as any)?.message || "Réessayez.", variant: "destructive" });
    } finally {
      setUploading(null);
      e.target.value = ""; // reset input
    }
  }

  const canFinish = !!(draft.identity?.id_card_front && draft.identity?.id_card_back && draft.registry?.registry_doc);

  async function startCamera(kind: "id_card_front" | "id_card_back" | "registry_doc") {
    setCameraFor(kind);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          if (e.name !== 'AbortError') console.error('[Camera] Play error:', e);
        });
      }
    } catch {}
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraFor(null);
  }

  async function captureAndUpload() {
    if (!videoRef.current || !cameraFor) return;
    const v = videoRef.current;
    const canvas = document.createElement("canvas");
    const w = v.videoWidth; const h = v.videoHeight;
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    const blob: Blob = await new Promise(resolve => canvas.toBlob(b => resolve(b as Blob), "image/jpeg", 0.9)!);
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" });
    const fakeInput = { files: [file] } as unknown as HTMLInputElement; // reuse upload handler
    await handleUpload({ target: fakeInput } as any, cameraFor);
    stopCamera();
  }

  async function finish() {
    // For now, mark as done via cookie endpoint placeholder and go to dashboard.
    try {
      await fetch("/api/pro/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: draft.identity, registry: draft.registry }),
      });
    } catch {}
    toast({ title: "Configuration terminée", description: "Vos documents ont été enregistrés. Bienvenue !" });
    router.replace("/pro/dashboard");
  }

  return (
    <div className="relative z-50 mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Configuration du compte professionnel</h1>
        <div className="text-sm text-muted-foreground">Étape {step + 1} / {STEPS.length} — {STEPS[step]}</div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="grid grid-cols-1 gap-3 md:grid-cols-2"
            >
              <div>
                <Label htmlFor="ident-first">Prénom</Label>
                <Input id="ident-first" value={draft.identity?.first_name || ""} onChange={(e)=>setDraft(d=>({ ...d, identity:{...d.identity, first_name:e.target.value} }))} required />
              </div>
              <div>
                <Label htmlFor="ident-last">Nom</Label>
                <Input id="ident-last" value={draft.identity?.last_name || ""} onChange={(e)=>setDraft(d=>({ ...d, identity:{...d.identity, last_name:e.target.value} }))} required />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Carte d'identité (recto) — requis</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e)=>handleUpload(e, "id_card_front")} />
                  <Button type="button" variant="outline" onClick={()=>startCamera("id_card_front")}>Prendre une photo</Button>
                </div>
                {uploading === "id_card_front" ? <div className="text-xs text-muted-foreground">Téléversement…</div> : draft.identity?.id_card_front && <div className="text-xs text-emerald-600">Fichier téléversé</div>}
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label>Carte d'identité (verso) — requis</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e)=>handleUpload(e, "id_card_back")} />
                  <Button type="button" variant="outline" onClick={()=>startCamera("id_card_back")}>Prendre une photo</Button>
                </div>
                {uploading === "id_card_back" ? <div className="text-xs text-muted-foreground">Téléversement…</div> : draft.identity?.id_card_back && <div className="text-xs text-emerald-600">Fichier téléversé</div>}
              </div>
              <div className="md:col-span-2 pt-2">
                <Button type="submit" className="w-full">Suivant</Button>
              </div>
            </form>
          )}


          {step === 1 && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="grid grid-cols-1 gap-3"
            >
              <div>
                <Label htmlFor="reg-rc">Numéro RC</Label>
                <Input id="reg-rc" value={draft.registry?.rc_number || ""} onChange={(e)=>setDraft(d=>({ ...d, registry:{...d.registry, rc_number:e.target.value} }))} required />
              </div>
              <div>
                <Label htmlFor="reg-nif">NIF</Label>
                <Input id="reg-nif" value={draft.registry?.nif || ""} onChange={(e)=>setDraft(d=>({ ...d, registry:{...d.registry, nif:e.target.value} }))} required />
              </div>
              <div className="space-y-1">
                <Label>Document registre (PDF/JPG) — requis</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept="image/*,application/pdf" capture="environment" onChange={(e)=>handleUpload(e, "registry_doc")} />
                  <Button type="button" variant="outline" onClick={()=>startCamera("registry_doc")}>Scanner</Button>
                </div>
                {uploading === "registry_doc" ? <div className="text-xs text-muted-foreground">Téléversement…</div> : draft.registry?.registry_doc && <div className="text-xs text-emerald-600">Fichier téléversé</div>}
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full">Suivant</Button>
              </div>
            </form>
          )}


          {step === 2 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                next(); // Use the existing 'next' function
              }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={draft.identity?.first_name || ""} // Map to existing draft state
                      onChange={(e) => setDraft(d => ({ ...d, identity: { ...d.identity, first_name: e.target.value } }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={draft.identity?.last_name || ""} // Map to existing draft state
                      onChange={(e) => setDraft(d => ({ ...d, identity: { ...d.identity, last_name: e.target.value } }))}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salonName">Nom du salon</Label>
                  <Input
                    id="salonName"
                    value={draft.business?.name || ""} // Map to existing draft state
                    onChange={(e) => setDraft(d => ({ ...d, business: { ...d.business, name: e.target.value } }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse du salon</Label>
                  <Input
                    id="address"
                    value={draft.business?.address || ""} // Map to existing draft state
                    onChange={(e) => setDraft(d => ({ ...d, business: { ...d.business, address: e.target.value } }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone portable</Label>
                  <Input
                    id="phone"
                    type="tel"
                    // This field is new, assuming it should be stored somewhere, e.g., in business or identity.
                    // For now, let's add it to business as a placeholder.
                    value={draft.business?.phone || ""} // Assuming a 'phone' field in business
                    onChange={(e) => setDraft(d => ({ ...d, business: { ...d.business, phone: e.target.value } }))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Suivant
              </Button>
            </form>
          )}

          {step === 3 && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="grid grid-cols-1 gap-3"
            >
              <div className="text-sm text-muted-foreground">Configurez vos horaires (ex: 09:00 - 18:00).</div>
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((day, idx)=> (
                <div key={day} className="grid grid-cols-3 items-center gap-2">
                  <Label>{day}</Label>
                  <Input placeholder="Ouverture (ex: 09:00)" value={draft.hours?.[idx]?.open || ""} onChange={(e)=>setDraft(d=>({ ...d, hours:{ ...(d.hours||{}), [idx]:{ ...(d.hours?.[idx]||{}), open:e.target.value } } }))} />
                  <Input placeholder="Fermeture (ex: 18:00)" value={draft.hours?.[idx]?.close || ""} onChange={(e)=>setDraft(d=>({ ...d, hours:{ ...(d.hours||{}), [idx]:{ ...(d.hours?.[idx]||{}), close:e.target.value } } }))} />
                </div>
              ))}
              <div className="pt-2">
                <Button type="submit" className="w-full">Suivant</Button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="grid grid-cols-1 gap-3"
            >
              {(draft.employees || [{first_name:"", last_name:"", role:"", phone:"", email:""}]).map((emp, i)=> (
                <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Input placeholder="Prénom" value={emp.first_name || ""} onChange={(e)=>setDraft(d=>{ const arr=[...(d.employees||[])]; arr[i]={...arr[i], first_name:e.target.value}; return { ...d, employees:arr }; })} />
                  <Input placeholder="Nom" value={emp.last_name || ""} onChange={(e)=>setDraft(d=>{ const arr=[...(d.employees||[])]; arr[i]={...arr[i], last_name:e.target.value}; return { ...d, employees:arr }; })} />
                  <Input placeholder="Rôle" value={emp.role || ""} onChange={(e)=>setDraft(d=>{ const arr=[...(d.employees||[])]; arr[i]={...arr[i], role:e.target.value}; return { ...d, employees:arr }; })} />
                  <Input placeholder="Téléphone" value={emp.phone || ""} onChange={(e)=>setDraft(d=>{ const arr=[...(d.employees||[])]; arr[i]={...arr[i], phone:e.target.value}; return { ...d, employees:arr }; })} />
                  <Input placeholder="Email" value={emp.email || ""} onChange={(e)=>setDraft(d=>{ const arr=[...(d.employees||[])]; arr[i]={...arr[i], email:e.target.value}; return { ...d, employees:arr }; })} />
                </div>
              ))}
              <div>
                <Button type="button" variant="outline" onClick={()=>setDraft(d=>({ ...d, employees:[...(d.employees||[]), {first_name:"", last_name:"", role:"", phone:"", email:""}] }))}>+ Ajouter un employé</Button>
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full">Suivant</Button>
              </div>
            </form>
          )}


          {step === 5 && (
            <div className="space-y-4 text-sm">
              <div>
                <div className="font-medium">Identité</div>
                <div>Prénom: {draft.identity?.first_name || "—"}</div>
                <div>Nom: {draft.identity?.last_name || "—"}</div>
                <div className="mt-2 flex gap-3 flex-wrap items-start">
                  {isImage(draft.identity?.id_card_front) ? (
                    <a href={draft.identity?.id_card_front} target="_blank" rel="noreferrer">
                      <img src={draft.identity?.id_card_front} alt="CNI recto" className="h-28 w-auto rounded border" />
                    </a>
                  ) : (
                    <a className="underline text-primary" href={draft.identity?.id_card_front} target="_blank" rel="noreferrer">CNI recto {draft.identity?.id_card_front ? "✓" : "✗"}</a>
                  )}
                  {isImage(draft.identity?.id_card_back) ? (
                    <a href={draft.identity?.id_card_back} target="_blank" rel="noreferrer">
                      <img src={draft.identity?.id_card_back} alt="CNI verso" className="h-28 w-auto rounded border" />
                    </a>
                  ) : (
                    <a className="underline text-primary" href={draft.identity?.id_card_back} target="_blank" rel="noreferrer">CNI verso {draft.identity?.id_card_back ? "✓" : "✗"}</a>
                  )}
                </div>
              </div>
              <div>
                <div className="font-medium">Registre de commerce</div>
                <div>RC: {draft.registry?.rc_number || "—"}</div>
                <div>NIF: {draft.registry?.nif || "—"}</div>
                <div className="mt-2">
                  {isImage(draft.registry?.registry_doc) ? (
                    <a href={draft.registry?.registry_doc} target="_blank" rel="noreferrer">
                      <img src={draft.registry?.registry_doc} alt="Document RC" className="h-28 w-auto rounded border" />
                    </a>
                  ) : (
                    <a className="underline text-primary" href={draft.registry?.registry_doc} target="_blank" rel="noreferrer">Document RC {draft.registry?.registry_doc ? "✓" : "✗"}</a>
                  )}
                </div>
              </div>
              <div>
                <div className="font-medium">Salon</div>
                <div>Nom: {draft.business?.name || "—"}</div>
                <div>Adresse: {draft.business?.address || "—"}</div>
                <div>Ville: {draft.business?.city || "—"}</div>
                {draft.business?.description && <div>Description: {draft.business?.description}</div>}
              </div>
              <div>
                <div className="font-medium">Horaires</div>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d, i)=>{
                    const h = draft.hours?.[i];
                    const label = h?.open && h?.close ? `${h.open} - ${h.close}` : "—";
                    return <div key={i}>{d}: {label}</div>;
                  })}
                </div>
              </div>
              <div>
                <div className="font-medium">Employés</div>
                <div>{(draft.employees?.length || 0)} employé(s)</div>
                <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                  {(draft.employees||[]).slice(0,6).map((e, idx)=> (
                    <div key={idx}>{e.first_name || "—"} {e.last_name || ""} {e.role ? `— ${e.role}` : ""}</div>
                  ))}
                </div>
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Vous pourrez compléter ou modifier ces informations plus tard depuis votre tableau de bord.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prev} disabled={step===0}>Précédent</Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={skip}>Plus tard</Button>
          {step < STEPS.length - 1 ? (
            null /* Move Suivant into forms */
          ) : (
            <Button onClick={finish} disabled={!canFinish} title={!canFinish ? "Veuillez téléverser carte d'identité (recto/verso) et le registre de commerce" : undefined}>Terminer</Button>
          )}
        </div>
      </div>
      {cameraFor && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-background rounded-lg overflow-hidden">
            <div className="p-3 text-sm font-medium">Capture caméra</div>
            <div className="px-3 pb-3 space-y-2">
              <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />
              <div className="flex justify-between">
                <Button variant="outline" onClick={stopCamera}>Annuler</Button>
                <Button onClick={captureAndUpload}>Capturer</Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Overlay limité à la sidebar (largeur configurable) */}
      <div
        className="fixed left-0 top-0 z-40 h-screen pointer-events-auto backdrop-blur-sm bg-background/30"
        style={{ width: "var(--sidebar-width, 280px)" }}
      ></div>
    </div>
  );
}
