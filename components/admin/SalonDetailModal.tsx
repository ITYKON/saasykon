import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

export interface SalonDetailModalProps {
  open: boolean;
  onClose: () => void;
  salon: any;
}

export const SalonDetailModal: React.FC<SalonDetailModalProps> = ({ open, onClose, salon }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="min-w-[700px] bg-white rounded-xl shadow-xl p-0">
      <DialogHeader className="px-8 pt-8 pb-2">
        <DialogTitle className="text-lg font-bold mb-2">Détail du salon</DialogTitle>
        <DialogClose />
      </DialogHeader>
      <div className="px-8 pb-8 pt-2">
        <div className="grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="relative h-32 w-32 mb-2">
              <Image src={salon.logo_url || "/placeholder.svg"} alt={salon.public_name} fill className="object-cover rounded-lg" />
            </div>
            <h3 className="text-xl font-bold text-black">{salon.public_name}</h3>
            <p className="text-gray-600 text-sm">Nom légal : <span className="font-semibold">{salon.legal_name}</span></p>
            <p className="text-gray-600 text-sm">Description : <span className="font-semibold">{salon.description}</span></p>
            <p className="text-gray-600 text-sm">Email : <span className="font-semibold">{salon.email}</span></p>
            <p className="text-gray-600 text-sm">Téléphone : <span className="font-semibold">{salon.country_code} {salon.phone}</span></p>
            <p className="text-gray-600 text-sm">Site web : <span className="font-semibold">{salon.website}</span></p>
            <p className="text-gray-600 text-sm">Numéro TVA : <span className="font-semibold">{salon.vat_number}</span></p>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-gray-600 text-sm">Catégorie : <span className="font-semibold">{salon.category_code}</span></p>
            <p className="text-gray-600 text-sm">Statut : <Badge>{salon.status}</Badge></p>
            <p className="text-gray-600 text-sm">Abonnement : <Badge>{salon.subscription}</Badge></p>
            <p className="text-gray-600 text-sm">Date d'inscription : <span className="font-semibold">{salon.joinDate}</span></p>
            <p className="text-gray-600 text-sm">Dernière activité : <span className="font-semibold">{salon.lastActivity}</span></p>
            <p className="text-gray-600 text-sm">Services : <span className="font-semibold">{Array.isArray(salon.services) ? salon.services.join(", ") : salon.services}</span></p>
            <div className="relative h-32 w-full mt-2">
              <Image src={salon.cover_url || "/placeholder.svg"} alt="Couverture" fill className="object-cover rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
