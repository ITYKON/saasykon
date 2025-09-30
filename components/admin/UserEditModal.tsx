import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface UserEditModalProps {
  open: boolean;
  onClose: () => void;
  user: {
    id: string | number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: string;
    salon?: string;
  };
  onSave: (user: any) => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ open, onClose, user, onSave }) => {
  const [form, setForm] = useState(user);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier utilisateur</DialogTitle>
          <DialogClose />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="Nom" />
          <input name="email" value={form.email} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="Email" />
          <input name="phone" value={form.phone || ""} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="Téléphone" />
          <select name="role" value={form.role} onChange={handleChange} className="border rounded px-3 py-2 w-full">
            <option value="Client">Client</option>
            <option value="Professionnel">Professionnel</option>
            <option value="Admin">Admin</option>
          </select>
          <select name="status" value={form.status} onChange={handleChange} className="border rounded px-3 py-2 w-full">
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Suspendu">Suspendu</option>
          </select>
          <input name="salon" value={form.salon || ""} onChange={handleChange} className="border rounded px-3 py-2 w-full" placeholder="Salon" />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant="default">Enregistrer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
