import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, MapPin, Loader2, Upload } from "lucide-react";
import { wilayas } from "@/lib/wilayas";
import { PhoneInput } from "@/components/ui/phone-input";

export interface SalonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (salon: any) => Promise<void> | void;
  initialSalon?: any;
  mode?: "add" | "edit";
}

export interface FormErrors {
  [key: string]: string | undefined;
  location?: string;
  email?: string;
}

export const SalonFormModal: React.FC<SalonFormModalProps> = ({ open, onClose, onSave, initialSalon, mode = "add" }) => {
  const { toast } = useToast();
  const initialFormState = {
    legal_name: "",
    public_name: "",
    description: "",
    email: "",
    phone: "",
    country_code: "+213",
    category_code: "institut_beaute",
    location: "", 
    logo_url: "",
    cover_url: "",
    status: "pending_verification",
    subscription: "Pro",
    create_for_claim: false,
  };

  const [form, setForm] = useState(() => {
    if (initialSalon) {
      return {
        ...initialFormState,
        ...initialSalon,
        location: initialSalon.location || initialSalon.business_locations?.[0]?.address_line1 || "",
        // Prevent null values
        description: initialSalon.description || "",
        website: initialSalon.website || "",
        vat_number: initialSalon.vat_number || "",
        category_code: initialSalon.category_code || "institut_beaute",
      };
    }
    return initialFormState;
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [logoPreview, setLogoPreview] = useState<string>(form.logo_url || "");
  const [coverPreview, setCoverPreview] = useState<string>(form.cover_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSelectChange(name: string, value: string) {
    setForm({ ...form, [name]: value });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "cover_url") {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Erreur", description: "L'image ne doit pas dépasser 2Mo", variant: "destructive" });
      return;
    }

    const setLoader = field === "logo_url" ? setIsUploadingLogo : setIsUploadingCover;
    const setPreview = field === "logo_url" ? setLogoPreview : setCoverPreview;

    setLoader(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      
      setForm((prev: any) => ({ ...prev, [field]: data.url }));
      setPreview(URL.createObjectURL(file)); // Show local preview immediately or use data.url if backend returns full path
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur Upload", description: "Impossible de télécharger l'image.", variant: "destructive" });
    } finally {
      setLoader(false);
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.location) {
      newErrors.location = "La wilaya est requise";
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setFormErrors({});

    try {
      await onSave(form);

      toast({
        title: mode === "add" ? "Salon ajouté" : "Salon modifié",
        description: mode === "add" ? "Le salon a bien été ajouté." : "Les modifications ont été enregistrées.",
        variant: "default",
      });
      onClose();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-white rounded-xl shadow-2xl min-w-[650px] max-h-[90vh] overflow-y-auto border-none gap-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-1.5 rounded-lg shadow-sm">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-gray-900 leading-tight">
                {mode === "add" ? "Nouvel établissement" : "Modifier l'établissement"}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                {mode === "add" ? "Remplissez les infos pour créer." : "Modifier les infos du salon."}
              </p>
            </div>
          </div>
          <DialogClose className="relative" />
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          
          {/* Informations Générales */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Général</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="legal_name" className="text-xs font-semibold text-gray-700">Nom légal <span className="text-red-500">*</span></Label>
                <Input id="legal_name" name="legal_name" value={form.legal_name} onChange={handleChange} placeholder="Ex: SARL Beauty" required className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="public_name" className="text-xs font-semibold text-gray-700">Nom public <span className="text-red-500">*</span></Label>
                <Input id="public_name" name="public_name" value={form.public_name} onChange={handleChange} placeholder="Ex: Institut Éclat" required className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="description" className="text-xs font-semibold text-gray-700">Description</Label>
                <Input id="description" name="description" value={form.description} onChange={handleChange} placeholder="Brève description..." className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                 <Label className="text-xs font-semibold text-gray-700">Catégorie</Label>
                 <Select value={form.category_code} onValueChange={(val) => handleSelectChange("category_code", val)}>
                   <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                   <SelectContent position="popper"><SelectItem value="institut_beaute">Institut de beauté</SelectItem></SelectContent>
                 </Select>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Contact & Localisation */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Contact & Lieu</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@exemple.com"
                    className={`h-9 text-sm pl-9 ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">Téléphone <span className="text-red-500">*</span></Label>
                <PhoneInput
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value || "" })}
                  defaultCountry="DZ"
                  className="w-full text-sm"
                  placeholder="05 55 ..."
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Wilaya <span className="text-red-500">*</span></Label>
                <Select 
                  value={form.location || ""} 
                  onValueChange={(val) => {
                    handleSelectChange("location", val);
                    // Effacer l'erreur lors de la sélection d'une valeur
                    if (val) {
                      setFormErrors(prev => ({
                        ...prev,
                        location: ""
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-sm pl-9 relative">
                    <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Sélectionner une Wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {wilayas.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.location && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.location}</p>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Visuels */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold text-gray-400 tracking-wider">Visuels</h3>
            <div className="flex gap-4">
              {/* Logo Upload */}
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Logo</Label>
                <div className="relative h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer group overflow-hidden">
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, "logo_url")} disabled={isUploadingLogo} />
                  {isUploadingLogo ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      <span className="text-[10px] text-gray-500">Logo</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Cover Upload */}
              <div className="flex-[2] space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Couverture</Label>
                <div className="relative h-16 rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer group overflow-hidden">
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" onChange={(e) => handleImageUpload(e, "cover_url")} disabled={isUploadingCover} />
                   {isUploadingCover ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" /> : coverPreview ? <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center gap-1">
                      <Upload className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                      <span className="text-[10px] text-gray-500">Image de couverture</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {mode === "add" && (
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded border border-blue-100">
              <input type="checkbox" id="create_for_claim" checked={form.create_for_claim} onChange={(e) => setForm({ ...form, create_for_claim: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <label htmlFor="create_for_claim" className="text-xs text-blue-800 font-medium cursor-pointer">Créer pour revendication (sans propriétaire)</label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} className="h-8 text-sm" disabled={isSubmitting}>Annuler</Button>
            <Button type="submit" className="h-8 text-sm bg-black hover:bg-gray-800 px-6 rounded-md" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : null}
              {mode === "add" ? "Créer" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
