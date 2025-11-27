"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams?.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setLoading(false);
        setValid(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/invite/verify?token=${encodeURIComponent(token)}`, { method: "POST" });
        const data = await res.json();
        setValid(!!data?.valid);
        setEmail(data?.email || null);
      } catch (e) {
        setValid(false);
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      toast({ title: "Mot de passe trop court", description: "8 caractères minimum" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Les mots de passe ne correspondent pas" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/invite/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Erreur ${res.status}`);
      }
      // Success: user is created/logged and session cookie set. Employees go directly to Pro dashboard.
      router.push("/pro");
    } catch (err: any) {
      toast({ title: "Activation impossible", description: err?.message || "" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader><CardTitle>Vérification…</CardTitle></CardHeader>
          <CardContent>Merci de patienter…</CardContent>
        </Card>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Card>
          <CardHeader><CardTitle>Lien invalide ou expiré</CardTitle></CardHeader>
          <CardContent>
            Le lien d’invitation est invalide ou a expiré. Demandez un nouvel email d’invitation.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Activer mon compte</CardTitle>
          {email && <div className="text-sm text-muted-foreground">{email}</div>}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmer le mot de passe</Label>
              <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" disabled={submitting}>{submitting ? "Activation…" : "Activer"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
