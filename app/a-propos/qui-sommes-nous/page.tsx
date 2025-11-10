import { Header } from "@/components/header";
import { QuiSommesNous } from "@/components/footer/a-propos/QuiSommesNous";
import { Footer } from "@/components/footer";

export const metadata = {
  title: 'Qui sommes-nous - YOKA',
  description: 'Découvrez YOKA, votre partenaire de confiance pour la réservation de services de beauté et de bien-être.',
};

export default function QuiSommesNousPage() {
  return (
    <>
      <Header />
      <main>
        <QuiSommesNous />
      </main>
      <Footer />
    </>
  );
}
