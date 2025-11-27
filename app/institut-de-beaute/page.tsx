import { redirect } from "next/navigation";

export default function InstitutDeBeautePage() {
  // Rediriger vers la page d'Alger par défaut
  redirect('/institut-de-beaute/alger');
  
  return null;
}

