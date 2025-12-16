"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, XCircle, Building, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";

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
  claim_status?: string;
  business_logo?: string | null;
};

export default function AdminVerificationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState<string>("");
  const [act, setAct] = useState<{ id: string; business_id: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string>("all");

  // Fonction pour filtrer les lignes en fonction de l'onglet actif
  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "pending")
      return rows.filter((row) => row.status === "pending");
    if (activeTab === "verified")
      return rows.filter((row) => row.status === "verified");
    if (activeTab === "rejected")
      return rows.filter((row) => row.status === "rejected");
    if (activeTab === "claimed")
      return rows.filter(
        (row) =>
          row.claim_status === "approved" || row.claim_status === "pending"
      );
    if (activeTab === "from_leads")
      return rows.filter((row) => row.claim_status === "not_claimable");
    return rows;
  }, [rows, activeTab]);

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
      toast({
        title: "Chargement impossible",
        description: (e as any)?.message || "",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [status, q]);

  async function verify(
    businessId: string,
    newStatus: "verified" | "rejected",
    verificationId?: string
  ) {
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (!res.ok) throw new Error("Action impossible");
      toast({
        title: newStatus === "verified" ? "Dossier validé" : "Dossier rejeté",
        description:
          newStatus === "verified"
            ? "Le salon a été validé avec succès"
            : "Le dossier a été rejeté",
      });
      setAct(null);
      setNotes("");
      await load();
    } catch (e) {
      toast({
        title: "Erreur",
        description: (e as any)?.message || "",
        variant: "destructive",
      });
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            En attente
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Validé
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejeté
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getClaimStatusBadge = (claimStatus?: string) => {
    if (!claimStatus) return null;
    switch (claimStatus) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
            Revendiqué
          </Badge>
        );
      case "not_claimable":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
            Depuis lead
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
            Revendication en attente
          </Badge>
        );
      default:
        return null;
    }
  };

  // Calculer les statistiques
  const stats = {
    all: rows.length,
    claimed: rows.filter(
      (r) => r.claim_status === "approved" || r.claim_status === "pending"
    ).length,
    from_leads: rows.filter((r) => r.claim_status === "not_claimable").length,
    pending: rows.filter((r) => r.status === "pending").length,
    verified: rows.filter((r) => r.status === "verified").length,
    rejected: rows.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">
          Vérification des documents
        </h1>
        <p className="text-gray-600">
          Vérifiez les documents des salons revendiqués et des salons convertis
          depuis les leads
        </p>
      </div>

      <div className="mb-4 flex items-end gap-3 flex-wrap">
        <div className="w-64">
          <Label>Recherche (nom du salon)</Label>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <div>
          <Label>Statut de vérification</Label>
          <Tabs
            defaultValue="all"
            className="space-y-4"
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="all">Tous ({rows.length})</TabsTrigger>
              <TabsTrigger value="pending">
                En attente ({rows.filter((r) => r.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="from_leads">
                Leads convertis (
                {rows.filter((r) => r.claim_status === "not_claimable").length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Validés ({rows.filter((r) => r.status === "verified").length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejetés ({rows.filter((r) => r.status === "rejected").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button onClick={load} disabled={loading}>
          {loading ? "Chargement…" : "Filtrer"}
        </Button>
      </div>

      {/* Onglets pour séparer les types de salons */}
      <VerificationsList
        rows={filteredRows}
        loading={loading}
        notes={notes}
        setNotes={setNotes}
        verify={verify}
        getStatusBadge={getStatusBadge}
        getClaimStatusBadge={getClaimStatusBadge}
      />
    </div>
  );
}

// Composant pour afficher la liste des vérifications
function VerificationsList({
  rows,
  loading,
  notes,
  setNotes,
  verify,
  getStatusBadge,
  getClaimStatusBadge,
}: {
  rows: Row[];
  loading: boolean;
  notes: string;
  setNotes: (notes: string) => void;
  verify: (
    businessId: string,
    newStatus: "verified" | "rejected",
    verificationId?: string
  ) => void;
  getStatusBadge: (status: string) => JSX.Element | null;
  getClaimStatusBadge: (claimStatus?: string) => JSX.Element | null;
}) {
  if (rows.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          Aucun document à vérifier
        </h3>
        <p className="text-gray-500 mt-1">
          Aucun document ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => (
        <Card key={r.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="line-clamp-1">{r.business_name}</span>
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(r.status)}
                  {getClaimStatusBadge(r.claim_status)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Numéro RC</Label>
              <p className="font-medium">{r.rc_number || "—"}</p>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-2 block">
                Documents
              </Label>
              <div className="flex flex-wrap gap-2">
                {r.rc_document_url ? (
                  <a
                    href={r.rc_document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    <FileText className="h-3 w-3" />
                    Document RC
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">
                    Document RC manquant
                  </span>
                )}
                {r.id_document_front_url ? (
                  <a
                    href={r.id_document_front_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    <FileText className="h-3 w-3" />
                    CNI recto
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">
                    CNI recto manquant
                  </span>
                )}
                {r.id_document_back_url ? (
                  <a
                    href={r.id_document_back_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    <FileText className="h-3 w-3" />
                    CNI verso
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">
                    CNI verso manquant
                  </span>
                )}
              </div>
            </div>

            {r.status === "pending" && (
              <>
                <div>
                  <Label className="text-xs text-gray-500">
                    Notes (optionnel)
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Commentaire pour le commerçant"
                    className="text-xs min-h-[60px]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => verify(r.business_id, "rejected", r.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => verify(r.business_id, "verified", r.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Valider
                  </Button>
                </div>
              </>
            )}

            {r.status !== "pending" && r.reviewed_at && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                {r.status === "verified" ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Validé le{" "}
                    {new Date(r.reviewed_at).toLocaleDateString("fr-FR")}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-3 w-3" />
                    Rejeté le{" "}
                    {new Date(r.reviewed_at).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t">
              <Link href={`/admin/salons`}>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Voir le salon
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
