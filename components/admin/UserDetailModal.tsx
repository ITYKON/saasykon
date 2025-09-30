import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface UserDetailModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    joinDate?: string;
    reservations?: number;
    avatar?: string;
    salon?: string;
  };
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ open, onClose, user }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Détail utilisateur</DialogTitle>
        <DialogClose />
      </DialogHeader>
      <div className="flex items-center space-x-4 mb-4">
        <Avatar className="h-14 w-14 bg-gray-200">
          <AvatarFallback className="text-gray-600 font-medium">{user.avatar}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-xl font-semibold text-black">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
          {user.phone && <p className="text-gray-500">{user.phone}</p>}
          {user.salon && <p className="text-sm text-gray-500">{user.salon}</p>}
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline">{user.role}</Badge>
            <Badge variant="outline">{user.status}</Badge>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500 mb-2">{user.joinDate}</div>
      {user.reservations !== undefined && (
        <div className="text-sm text-gray-500">{user.reservations} réservations</div>
      )}
    </DialogContent>
  </Dialog>
);
