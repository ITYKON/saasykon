"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, CheckCircle2, XCircle, FileText, Clock } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function AdminClaimsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [claims, setClaims] = useState<any[]>([])
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false)
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject" | null>(null)
  const [verifyNotes, setVerifyNotes] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchClaims()
  }, [statusFilter, page])

  const fetchClaims = async () => {
    setLoading(true)
    try {
      const status = statusFilter === "all" ? undefined : statusFilter
      const response = await fetch(`/api/admin/claims?status=${status || ""}&page=${page}&pageSize=20`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setClaims(data.items || [])
      setTotal(data.total || 0)
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les revendications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!selectedClaim || !verifyAction) return

    setVerifying(true)
    try {
      const response = await fetch(`/api/admin/claims/${selectedClaim.id}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: verifyAction,
          notes: verifyNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification")
      }

      toast({
        title: "Succès",
        description: verifyAction === "approve" ? "Revendication approuvée" : "Revendication rejetée",
      })

      setShowVerifyDialog(false)
      setSelectedClaim(null)
      setVerifyAction(null)
      setVerifyNotes("")
      fetchClaims()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de vérifier la revendication",
        variant: "destructive",
      })
    } finally {
      setVerifying(false)
    }
  }

  const openVerifyDialog = (claim: any, action: "approve" | "reject") => {
    setSelectedClaim(claim)
    setVerifyAction(action)
    setShowVerifyDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      documents_submitted: "default",
      approved: "default",
      rejected: "destructive",
    }

    const labels: Record<string, string> = {
      pending: "En attente",
      documents_submitted: "Documents soumis",
      approved: "Approuvé",
      rejected: "Rejeté",
    }

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    )
  }

  const pendingClaims = claims.filter((c) => c.status === "documents_submitted")
  const allClaims = claims

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestion des revendications</h1>
        <p className="text-gray-600 mt-2">Gérez les revendications d'établissements et vérifiez les documents</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            À vérifier ({pendingClaims.length})
          </TabsTrigger>
          <TabsTrigger value="all">Toutes ({allClaims.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : pendingClaims.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Aucune revendication à vérifier
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{claim.full_name}</CardTitle>
                        <CardDescription>
                          {claim.email} • {claim.phone}
                        </CardDescription>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Établissement</p>
                        <p className="text-sm text-gray-600">{claim.business?.public_name || claim.business?.legal_name}</p>
                      </div>

                      {claim.rc_number && (
                        <div>
                          <p className="text-sm font-medium">Numéro RC</p>
                          <p className="text-sm text-gray-600">{claim.rc_number}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        {claim.id_document_front_url && (
                          <div>
                            <p className="text-sm font-medium mb-2">Pièce d'identité (Recto)</p>
                            <a
                              href={claim.id_document_front_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Voir le document
                            </a>
                          </div>
                        )}
                        {claim.id_document_back_url && (
                          <div>
                            <p className="text-sm font-medium mb-2">Pièce d'identité (Verso)</p>
                            <a
                              href={claim.id_document_back_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Voir le document
                            </a>
                          </div>
                        )}
                        {claim.rc_document_url && (
                          <div>
                            <p className="text-sm font-medium mb-2">Registre de commerce</p>
                            <a
                              href={claim.rc_document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:underline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Voir le document
                            </a>
                          </div>
                        )}
                      </div>

                      {claim.documents_submitted_at && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          Documents soumis le {new Date(claim.documents_submitted_at).toLocaleDateString("fr-FR")}
                        </div>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => openVerifyDialog(claim, "approve")}
                          className="flex-1"
                          disabled={!claim.documents_submitted}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          onClick={() => openVerifyDialog(claim, "reject")}
                          variant="destructive"
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : allClaims.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                Aucune revendication
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allClaims.map((claim) => (
                <Card key={claim.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{claim.full_name}</CardTitle>
                        <CardDescription>
                          {claim.email} • {claim.phone}
                        </CardDescription>
                      </div>
                      {getStatusBadge(claim.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Établissement</p>
                        <p className="text-sm text-gray-600">{claim.business?.public_name || claim.business?.legal_name}</p>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Créé le {new Date(claim.created_at).toLocaleDateString("fr-FR")}
                      </div>
                      {claim.status === "documents_submitted" && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => openVerifyDialog(claim, "approve")}
                            size="sm"
                            disabled={!claim.documents_submitted}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            onClick={() => openVerifyDialog(claim, "reject")}
                            size="sm"
                            variant="destructive"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {verifyAction === "approve" ? "Approuver la revendication" : "Rejeter la revendication"}
            </DialogTitle>
            <DialogDescription>
              {verifyAction === "approve"
                ? "Cette action va approuver la revendication et créer le compte professionnel."
                : "Cette action va rejeter la revendication."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Ajoutez des notes pour cette vérification..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)} disabled={verifying}>
              Annuler
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifying}
              variant={verifyAction === "approve" ? "default" : "destructive"}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : verifyAction === "approve" ? (
                "Approuver"
              ) : (
                "Rejeter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

