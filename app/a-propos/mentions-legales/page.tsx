import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import MentionsLegales from '@/components/footer/a-propos/MentionsLegales';

export const metadata: Metadata = {
  title: 'Mentions Légales - YOKA',
  description: 'Consultez les mentions légales de la plateforme YOKA. Informations sur l\'éditeur, les conditions d\'utilisation et la protection des données.',
};

export default function MentionsLegalesPage() {
  return (
    <main>
      <Header />
      <MentionsLegales />
      <Footer />
    </main>
  );
}
