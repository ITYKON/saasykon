'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type VerificationStatus = 'PENDING_DOCUMENTS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'BLOCKED' | 'DOCUMENTS_SUBMITTED';

interface DocumentVerificationBannerProps {
  status: VerificationStatus;
  daysRemaining: number;
  businessId: string;
}

export function DocumentVerificationBanner({ status, daysRemaining, businessId }: DocumentVerificationBannerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  


  useEffect(() => {
    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(now.getDate() + daysRemaining);
      
      const diff = endDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('Temps écoulé');
        clearInterval(timer);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}j ${hours}h ${minutes}m`);
    }, 60000); // Update every minute
    
    return () => clearInterval(timer);
  }, [daysRemaining]);

  if (status === 'VERIFIED' || status === 'DOCUMENTS_SUBMITTED') {

    return null;
  }

  const getAlertVariant = () => {
    switch (status) {
      case 'PENDING_DOCUMENTS':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'default';
      case 'REJECTED':
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'PENDING_DOCUMENTS':
        return <Clock className="h-5 w-5" />;
      case 'PENDING_VERIFICATION':
        return <AlertCircle className="h-5 w-5" />;
      case 'REJECTED':
      case 'BLOCKED':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'PENDING_DOCUMENTS':
        return 'Documents requis';
      case 'PENDING_VERIFICATION':
        return 'En attente de vérification';
      case 'REJECTED':
        return 'Documents rejetés';
      case 'BLOCKED':
        return 'Compte bloqué';
      default:
        return 'Statut inconnu';
    }
  };

  const getDescription = () => {
    switch (status) {
      case 'PENDING_DOCUMENTS':
        return (
          <span>
            Veuillez soumettre vos documents pour vérification. 
            {daysRemaining > 0 && (
              <span> Temps restant : <span className="font-bold">{timeLeft}</span></span>
            )}
          </span>
        );
      case 'PENDING_VERIFICATION':
        return 'Vos documents sont en cours de vérification. Cette opération peut prendre jusqu\'à 24 heures.';
      case 'REJECTED':
        return 'Vos documents ont été rejetés. Veuillez soumettre de nouveaux documents valides.';
      case 'BLOCKED':
        return 'Votre compte a été bloqué en raison d\'un délai de soumission des documents dépassé. Veuillez contacter le support.';
      default:
        return 'Statut inconnu. Veuillez contacter le support.';
    }
  };

  const showUploadButton = status === 'PENDING_DOCUMENTS' || status === 'REJECTED';

  return (
    <div className="mb-6">
      <Alert variant={getAlertVariant()}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <AlertTitle className="font-semibold">{getTitle()}</AlertTitle>
            <AlertDescription className="mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span>{getDescription()}</span>
                {showUploadButton && (
                  <Button variant={status === 'REJECTED' ? 'destructive' : 'default'} size="sm" asChild className="mt-2 sm:mt-0 sm:ml-4">
                    <Link href={`/pro/settings/business?tab=documents`}>
                      {status === 'REJECTED' ? 'Mettre à jour les documents' : 'Télécharger les documents'}
                    </Link>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}
