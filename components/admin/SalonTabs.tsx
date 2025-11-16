'use client';

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Building, Clock, CheckCircle, XCircle, AlertCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from 'date-fns/locale';

interface Salon {
  id: string;
  legal_name: string;
  public_name: string;
  description?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  cover_url?: string;
  status?: string;
  subscription?: string;
  claim_status?: string;
  created_at: string;
  updated_at: string;
  business_locations?: Array<{ 
    address_line1?: string; 
    cities?: { 
      name?: string;
      postal_code?: string;
    } 
  }>;
  users?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface SalonTabsProps {
  salons: Salon[];
  loading: boolean;
  onRefresh: () => void;
  onStatusChange: (salonId: string, status: string) => void;
}

const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;
  
  const statusConfig = {
    'actif': { label: 'Actif', className: 'bg-green-100 text-green-800' },
    'en attente': { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
    'suspendu': { label: 'Suspendu', className: 'bg-red-100 text-red-800' },
    'inactif': { label: 'Inactif', className: 'bg-gray-100 text-gray-800' },
    'pending': { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
    'approved': { label: 'Approuvé', className: 'bg-green-100 text-green-800' },
    'rejected': { label: 'Rejeté', className: 'bg-red-100 text-red-800' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: 'bg-gray-100 text-gray-800' };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

const SalonCard = ({ 
  salon, 
  onStatusChange,
  showActions = false 
}: { 
  salon: Salon; 
  onStatusChange: (salonId: string, status: string) => void;
  showActions?: boolean;
}) => {
  const city = salon.business_locations?.[0]?.cities?.name || 'Ville non spécifiée';
  const createdAt = new Date(salon.created_at);
  const formattedDate = format(createdAt, 'PPP', { locale: fr });

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="relative w-full md:w-48 h-48 bg-gray-100">
          {salon.cover_url ? (
            <img
              src={salon.cover_url}
              alt={salon.public_name || salon.legal_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <Building className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {salon.public_name || salon.legal_name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {/* Afficher le statut de la revendication s'il existe, sinon le statut du salon */}
                  {salon.claim_status && salon.claim_status !== 'none' ? (
                    <StatusBadge status={salon.claim_status} />
                  ) : (
                    <StatusBadge status={salon.status} />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-1">
                {salon.legal_name}
              </p>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground">
                Créé le {formattedDate}
              </span>
              {salon.claim_status === 'pending' && (
                <span className="text-xs text-amber-600 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  En attente de validation
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{city}</span>
            </div>
            
            {salon.email && (
              <div className="flex items-center">
                <span className="mx-2">•</span>
                <a
                  href={`mailto:${salon.email}`}
                  className="hover:underline hover:text-primary"
                >
                  {salon.email}
                </a>
              </div>
            )}

            {salon.phone && (
              <div className="flex items-center">
                <span className="mx-2">•</span>
                <a
                  href={`tel:${salon.phone}`}
                  className="hover:underline hover:text-primary"
                >
                  {salon.phone}
                </a>
              </div>
            )}
          </div>

          {salon.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {salon.description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/admin/salons/${salon.id}`}>
                Voir les détails
              </a>
            </Button>

            {showActions && salon.claim_status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onStatusChange(salon.id, 'approved')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onStatusChange(salon.id, 'rejected')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </>
            )}

            {salon.claim_status === 'approved' && (
              <span className="inline-flex items-center text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Revendication approuvée
              </span>
            )}

            {salon.claim_status === 'rejected' && (
              <span className="inline-flex items-center text-sm text-red-600">
                <XCircle className="h-4 w-4 mr-1" />
                Revendication rejetée
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const SalonList = ({ 
  salons, 
  onStatusChange, 
  emptyMessage,
  showActions = false 
}: { 
  salons: Salon[]; 
  onStatusChange: (salonId: string, status: string) => void;
  emptyMessage: string;
  showActions?: boolean;
}) => {
  if (salons.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-muted-foreground">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {salons.map((salon) => (
        <SalonCard 
          key={salon.id} 
          salon={salon} 
          onStatusChange={onStatusChange}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export function SalonTabs({ salons, loading, onRefresh, onStatusChange }: SalonTabsProps) {
  // Filtrer les salons par statut de revendication
  const pendingSalons = salons.filter(salon => salon.claim_status === 'pending');
  const approvedSalons = salons.filter(salon => salon.claim_status === 'approved');
  const rejectedSalons = salons.filter(salon => salon.claim_status === 'rejected');
  const unclaimedSalons = salons.filter(salon => !salon.claim_status || salon.claim_status === 'none');

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        <TabsTrigger value="all" className="flex items-center justify-center">
          Tous les salons
          <Badge variant="secondary" className="ml-2">
            {salons.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending" className="flex items-center justify-center">
          <Clock className="h-4 w-4 mr-1" />
          En attente
          {pendingSalons.length > 0 && (
            <Badge className="ml-2 bg-amber-500 text-white">
              {pendingSalons.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="approved" className="flex items-center justify-center">
          <CheckCircle className="h-4 w-4 mr-1" />
          Approuvés
          {approvedSalons.length > 0 && (
            <Badge className="ml-2 bg-green-500 text-white">
              {approvedSalons.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="rejected" className="flex items-center justify-center">
          <XCircle className="h-4 w-4 mr-1" />
          Rejetés
          {rejectedSalons.length > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">
              {rejectedSalons.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="unclaimed" className="flex items-center justify-center">
          <Building className="h-4 w-4 mr-1" />
          Non revendiqués
          <Badge variant="outline" className="ml-2">
            {unclaimedSalons.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <div className="mt-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="all">
              <SalonList 
                salons={salons} 
                onStatusChange={onStatusChange}
                emptyMessage="Aucun salon trouvé"
              />
            </TabsContent>
            <TabsContent value="pending">
              <SalonList 
                salons={pendingSalons}
                onStatusChange={onStatusChange}
                emptyMessage="Aucune demande en attente"
                showActions={true}
              />
            </TabsContent>
            <TabsContent value="approved">
              <SalonList 
                salons={approvedSalons}
                onStatusChange={onStatusChange}
                emptyMessage="Aucune revendication approuvée"
              />
            </TabsContent>
            <TabsContent value="rejected">
              <SalonList 
                salons={rejectedSalons}
                onStatusChange={onStatusChange}
                emptyMessage="Aucune revendication rejetée"
              />
            </TabsContent>
            <TabsContent value="unclaimed">
              <SalonList 
                salons={unclaimedSalons}
                onStatusChange={onStatusChange}
                emptyMessage="Tous les salons sont revendiqués"
              />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
}
