'use client';

import { Building, MapPin, Clock, CheckCircle, XCircle, MoreVertical, ArrowRight, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

type SalonListProps = {
  salons: any[];
  loading: boolean;
  onStatusChange: (salonId: string, status: string) => void;
  showActions?: boolean;
  showClaimStatus?: boolean;
  onViewDetails?: (salon: any) => void;
  onEdit?: (salon: any) => void;
  onDelete?: (salon: any) => void;
};

export function SalonList({ 
  salons, 
  loading, 
  onStatusChange,
  showActions = false,
  showClaimStatus = true,
  onViewDetails = () => {},
  onEdit = () => {},
  onDelete = () => {}
}: SalonListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (salons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-muted/20">
        <Building className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Aucun salon trouvé</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'actif':
        return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Actif</Badge>;
      case 'pending':
      case 'en attente':
        return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">En attente</Badge>;
      case 'suspended':
      case 'suspendu':
        return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">Suspendu</Badge>;
      case 'inactive':
      case 'inactif':
        return <Badge variant="outline">Inactif</Badge>;
      default:
        return <Badge variant="outline">{status || 'Inconnu'}</Badge>;
    }
  };

  const getClaimStatusBadge = (claimStatus: string) => {
    switch (claimStatus?.toLowerCase()) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 flex items-center gap-1">
            <Clock className="h-3 w-3" /> En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approuvé
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejeté
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
            Non revendiqué
          </Badge>
        );
    }
  };

  // Les gestionnaires d'événements sont maintenant passés en props

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[25%] px-2 py-2">Nom du salon</TableHead>
              <TableHead className="w-[15%] px-2 py-2">Statut</TableHead>
              {showClaimStatus && <TableHead className="w-[20%] px-2 py-2">Revendication</TableHead>}
              <TableHead className="w-[15%] px-2 py-2">Localisation</TableHead>
              <TableHead className="w-[10%] px-2 py-2">Créé le</TableHead>
              <TableHead className="w-[15%] px-2 py-2 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
        <TableBody>
          {salons.map((salon) => (
            <TableRow key={salon.id} className="hover:bg-muted/50">
              <TableCell className="px-2 py-2">
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{salon.public_name || salon.legal_name}</span>
                  {salon.public_name && salon.legal_name && (
                    <span className="text-xs text-muted-foreground truncate">{salon.legal_name}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-2 py-2">
                <div className="flex">
                  {getStatusBadge(salon.status)}
                </div>
              </TableCell>
              {showClaimStatus && (
                <TableCell className="px-2 py-2">
                  <div className="flex">
                    {getClaimStatusBadge(salon.claim_status)}
                  </div>
                </TableCell>
              )}
              <TableCell className="px-2 py-2">
                {salon.business_locations?.[0]?.cities?.name && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm truncate">{salon.business_locations[0].cities.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="px-2 py-2">
                {salon.created_at && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(salon.created_at), 'dd/MM/yy', { locale: fr })}
                  </span>
                )}
              </TableCell>
              <TableCell className="px-2 py-2">
                <div className="flex justify-end gap-1">
                  {showActions ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={() => onStatusChange(salon.id, 'approved')}
                      >
                        Valider
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => onStatusChange(salon.id, 'rejected')}
                      >
                        Rejeter
                      </Button>
                    </>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onViewDetails(salon)} className="cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Voir détails</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(salon)} className="cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(salon)} 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Supprimer</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </div>
  );
}
