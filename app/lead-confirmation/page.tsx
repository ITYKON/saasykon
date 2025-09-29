import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LeadConfirmation() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Merci pour votre demande !</h1>
        <p className="mb-6 text-muted-foreground">Votre demande a bien été envoyée.<br />Un commercial va vous contacter très prochainement pour activer votre compte Pro.</p>
        <Link href="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
}
