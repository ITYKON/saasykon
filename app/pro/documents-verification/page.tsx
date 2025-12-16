"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle } from "lucide-react";

export default function DocumentsVerificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState({
    idCardFront: null as File | null,
    idCardBack: null as File | null,
    rcDocument: null as File | null,
  });
  const [rcNumber, setRcNumber] = useState("");

  // Vérifier si les documents ont déjà été soumis
  useEffect(() => {
    const checkSubmissionStatus = async () => {
      try {
        const response = await fetch("/api/business/verification");
        if (response.ok) {
          const data = await response.json();
          if (data.verification) {
            setIsAlreadySubmitted(true);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du statut:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubmissionStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof files) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({
        ...prev,
        [field]: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      if (files.idCardFront) formData.append("idDocumentFront", files.idCardFront);
      if (files.idCardBack) formData.append("idDocumentBack", files.idCardBack);
      if (files.rcDocument) formData.append("rcDocument", files.rcDocument);
      if (rcNumber) formData.append("rcNumber", rcNumber);

      const response = await fetch("/api/pro/verify-documents", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Échec de la soumission des documents");
      }

      toast({
        title: "Documents soumis avec succès !",
        description: "Vos documents ont été soumis et sont en attente de validation par notre équipe. Vous recevrez une notification dès que la vérification sera terminée.",
      });

      setIsAlreadySubmitted(true);
    } catch (error) {
      console.error("Erreur lors de la soumission des documents:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la soumission des documents. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allDocumentsUploaded = files.idCardFront && files.idCardBack && files.rcDocument && rcNumber;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Vérification du statut...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadySubmitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents déjà soumis</h2>
            <p className="text-gray-600 mb-6">
              Vos documents ont été soumis avec succès et sont en attente de validation par notre équipe.
              Vous recevrez une notification dès que la vérification sera terminée.
            </p>
            <Button onClick={() => router.push("/pro/dashboard")}>
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Vérification de votre identité</CardTitle>
          <CardDescription>
            Pour accéder à votre tableau de bord, veuillez soumettre les documents suivants pour vérification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Important :</strong> Vous disposez de <strong>7 jours</strong> à compter de la création de votre compte 
              pour soumettre vos documents. Passé ce délai, votre compte sera bloqué.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Vérification de votre identité</CardTitle>
          <CardDescription>
            Pour accéder à votre tableau de bord, veuillez soumettre les documents suivants pour vérification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Pièce d'identité</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="idCardFront">Recto de la pièce d'identité *</Label>
                    <Input
                      id="idCardFront"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "idCardFront")}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG ou PDF (max 5MB)</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="idCardBack">Verso de la pièce d'identité *</Label>
                    <Input
                      id="idCardBack"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "idCardBack")}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG ou PDF (max 5MB)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rcNumber">Numéro d'immatriculation (RC) *</Label>
                    <Input
                      id="rcNumber"
                      type="text"
                      value={rcNumber}
                      onChange={(e) => setRcNumber(e.target.value)}
                      placeholder="Ex: 05B123456789"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rcDocument">Extrait d'immatriculation (K-bis ou équivalent) *</Label>
                    <Input
                      id="rcDocument"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, "rcDocument")}
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format: JPG, PNG ou PDF (max 5MB)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-700">
                Vos documents sont traités de manière sécurisée et ne seront utilisés qu'à des fins de vérification d'identité conformément à notre politique de confidentialité.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="submit"
                disabled={!allDocumentsUploaded || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Soumission en cours..." : "Soumettre les documents"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
