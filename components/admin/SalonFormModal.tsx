import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SalonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (salon: any) => void;
  initialSalon?: any;
  mode?: "add" | "edit";
}

export const SalonFormModal: React.FC<SalonFormModalProps> = ({
  open,
  onClose,
  onSave,
  initialSalon,
  mode = "add",
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(
    initialSalon || {
      legal_name: "",
      public_name: "",
      description: "",
      email: "",
      phone: "",
      country_code: "+213",
      website: "",
      vat_number: "",
      category_code: "",
      location: initialSalon?.business_locations?.[0]?.address_line1 || "", // Add location field from existing data
      logo_url: "",
      cover_url: "",
      status: "actif",
      subscription: "Pro",
      joinDate: "",
      lastActivity: "",
      rating: 0,
      reviewCount: 0,
      totalBookings: 0,
      monthlyRevenue: 0,
      create_for_claim: false, // Nouveau champ pour créer sans propriétaire
    }
  );

  const [logoPreview, setLogoPreview] = useState<string>(form.logo_url || "");
  const [coverPreview, setCoverPreview] = useState<string>(
    form.cover_url || ""
  );

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, files } = e.target;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (name === "logo_url") setLogoPreview(ev.target?.result as string);
        if (name === "cover_url") setCoverPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
      // Pour l'instant, on stocke le DataURL dans le form, à remplacer par l'URL backend après upload réel
      setForm({ ...form, [name]: URL.createObjectURL(files[0]) });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(form);
      toast({
        title: mode === "add" ? "Salon ajouté" : "Salon modifié",
        description:
          mode === "add"
            ? "Le salon a bien été ajouté."
            : "Les modifications ont été enregistrées.",
        variant: "default",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de l'enregistrement.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-white rounded-xl shadow-xl min-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-8 pt-8 pb-2">
          <DialogTitle className="text-lg font-bold mb-2">
            {mode === "add" ? "Ajouter un salon" : "Modifier le salon"}
          </DialogTitle>
          <DialogClose />
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2">
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-xs text-gray-500">Nom légal</label>
              <Input
                name="legal_name"
                value={form.legal_name}
                onChange={handleChange}
                placeholder="Nom légal"
                required
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Nom public</label>
              <Input
                name="public_name"
                value={form.public_name}
                onChange={handleChange}
                placeholder="Nom public"
                required
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Description</label>
              <Input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Email</label>
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Téléphone</label>
              <div className="flex gap-2">
                <select
                  name="country_code"
                  value={form.country_code}
                  onChange={handleChange}
                  className="border rounded-lg px-3 py-2 bg-gray-50"
                >
                  <option value="+213">+213 (DZ)</option>
                  <option value="+33">+33 (FR)</option>
                  <option value="+212">+212 (MA)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Téléphone"
                  className="rounded-lg"
                />
              </div>
              <label className="text-xs text-gray-500">
                Ville / Localisation
              </label>
              <Input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Ex: Alger, Oran, Constantine..."
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Site web</label>
              <Input
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="Site web"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Numéro TVA</label>
              <Input
                name="vat_number"
                value={form.vat_number}
                onChange={handleChange}
                placeholder="Numéro TVA"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Catégorie</label>
              <Input
                name="category_code"
                value={form.category_code}
                onChange={handleChange}
                placeholder="Catégorie"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Logo</label>
              <Input
                type="file"
                name="logo_url"
                accept="image/*"
                onChange={handleImageChange}
                className="rounded-lg"
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Aperçu logo"
                  className="h-16 w-16 object-cover rounded mt-1 border"
                />
              )}
            </div>
            <div className="flex flex-col gap-4">
              <label className="text-xs text-gray-500">Couverture</label>
              <Input
                type="file"
                name="cover_url"
                accept="image/*"
                onChange={handleImageChange}
                className="rounded-lg"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Aperçu couverture"
                  className="h-16 w-32 object-cover rounded mt-1 border"
                />
              )}
              <label className="text-xs text-gray-500">Statut</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 bg-gray-50"
              >
                <option value="actif">Actif</option>
                <option value="en attente">En attente</option>
                <option value="suspendu">Suspendu</option>
                <option value="inactif">Inactif</option>
              </select>
              <label className="text-xs text-gray-500">Abonnement</label>
              <select
                name="subscription"
                value={form.subscription}
                onChange={handleChange}
                className="border rounded-lg px-3 py-2 bg-gray-50"
              >
                <option value="Premium">Premium</option>
                <option value="Pro">Pro</option>
                <option value="Basic">Basic</option>
              </select>
              <label className="text-xs text-gray-500">
                Date d'inscription
              </label>
              <Input
                name="joinDate"
                value={form.joinDate}
                onChange={handleChange}
                placeholder="Date d'inscription"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Dernière activité</label>
              <Input
                name="lastActivity"
                value={form.lastActivity}
                onChange={handleChange}
                placeholder="Dernière activité"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Note</label>
              <Input
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={handleChange}
                placeholder="Note sur 5"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Nombre d'avis</label>
              <Input
                name="reviewCount"
                type="number"
                min="0"
                value={form.reviewCount}
                onChange={handleChange}
                placeholder="Nombre d'avis"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">RDV total</label>
              <Input
                name="totalBookings"
                type="number"
                min="0"
                value={form.totalBookings}
                onChange={handleChange}
                placeholder="RDV total"
                className="rounded-lg"
              />
              <label className="text-xs text-gray-500">Revenus/mois</label>
              <Input
                name="monthlyRevenue"
                type="number"
                min="0"
                value={form.monthlyRevenue}
                onChange={handleChange}
                placeholder="Revenus/mois"
                className="rounded-lg"
              />
              {mode === "add" && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="create_for_claim"
                      checked={form.create_for_claim}
                      onChange={(e) =>
                        setForm({ ...form, create_for_claim: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-blue-900 font-medium">
                      Créer pour revendication (sans propriétaire)
                    </span>
                  </label>
                  <p className="text-xs text-blue-700 mt-2">
                    Si coché, le salon sera créé sans propriétaire et pourra
                    être revendiqué par les utilisateurs via la page publique.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full px-6"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="default"
              className="rounded-full px-6"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Enregistrement..."
                : mode === "add"
                ? "Ajouter"
                : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
