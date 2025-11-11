import { Header } from "@/components/header";
import ContactPage from "@/components/footer/a-propos/ContactPage";
import { Footer } from "@/components/footer";

export const metadata = {
  title: 'Contact - YOKA',
  description: 'Contactez notre équipe YOKA pour toute question ou demande de renseignements. Nous sommes là pour vous aider !',
};

export default function Contact() {
  return (
    <>
      <Header />
      <main>
        <ContactPage />
      </main>
      <Footer />
    </>
  );
}
