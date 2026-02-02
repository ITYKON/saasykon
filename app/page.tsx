"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchForm } from "@/components/search-form";
import Link from "next/link";
import Image from "next/image";
import { slugifySalonName } from "@/lib/salon-slug";

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

const faqItems: FAQItem[] = [
  {
    question: "Qu'est-ce que YOKA ?",
    answer: "YOKA est une plateforme innovante qui connecte les professionnels de la beauté avec leur clientèle. Notre mission est de simplifier la prise de rendez-vous en ligne, d'optimiser la gestion des salons et d'offrir une expérience utilisateur exceptionnelle aux clients comme aux professionnels du secteur."
  },
  {
    question: "Comment prendre rendez-vous sur YOKA ?",
    answer: (
      <ol className="list-decimal pl-5 space-y-2">
        <li>Recherchez un salon ou un professionnel près de chez vous</li>
        <li>Sélectionnez le service désiré</li>
        <li>Choisissez une date et un créneau horaire disponible</li>
        <li>Confirmez votre rendez-vous en quelques clics</li>
        <li>Recevez une confirmation par email et SMS</li>
      </ol>
    )
  },
  {
    question: "Est-ce que je dois payer en ligne sur YOKA ?",
  //  answer: "Le paiement en ligne est une option disponible mais non obligatoire. Vous pouvez choisir de payer directement en salon si vous le préférez. Pour les services nécessitant un acompte, le paiement en ligne sera requis pour confirmer votre réservation."
    answer: "Le paiement en ligne n'est pas disponible pour le moment. Vous pouvez payer directement en salon."
  },
  {
    question: "Comment gérer mes rendez-vous sur YOKA ?",
    answer: "Dans votre espace client, vous pouvez :\n- Voir tous vos rendez-vous à venir et passés\n- Modifier ou annuler un rendez-vous (selon la politique d'annulation du salon)\n- Recevoir des rappels par email et SMS\n- Donner votre avis après votre prestation\n- Sauvegarder vos salons préférés"
  },
  {
    question: "Comment faire apparaître mon salon ou institut sur YOKA ?",
    answer: "Pour référencer votre établissement sur YOKA :\n1. Créez un compte professionnel\n2. Complétez votre profil avec les informations de votre salon\n3. Ajoutez vos services et vos disponibilités\n4. Une fois validé par notre équipe, votre salon sera visible par nos utilisateurs\n\nNotre équipe est disponible pour vous accompagner dans cette démarche."
  }
];

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative h-screen min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/acceuil.jpg')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">Réservez avec élégance</h1>
          <p className="text-lg text-white/90 mb-8 text-pretty">Simple • Immédiat • 24h/24</p>

          {/* Search Form */}
          <div className="w-full bg-white rounded-lg p-6 shadow-2xl">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide
">UNE FORTE CROISSANCE</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 text-balance">
              Vous êtes un professionnel de la beauté ?<br />
              Découvrez la prise de RDV en ligne !
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">50%</div>
              <p className="text-gray-600">de fréquence sur les rendez-vous pris en ligne</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">4x</div>
              <p className="text-gray-600">moins d'oublis avec les rappels sms des rendez-vous</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">60%</div>
              <p className="text-gray-600">des rendez-vous en ligne pris en dehors des horaires d'ouverture</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">18%</div>
              <p className="text-gray-600">de revenus par client avec la réservation en ligne</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">2,5x</div>
              <p className="text-gray-600">plus de clients récurrents grâce au suivi</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">45%</div>
              <p className="text-gray-600">retours clients positifs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      {/* <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide   ">DÉCOUVREZ NOS</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-balance">Professionnels</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JVU8p4efwwLS0KXUOQZj9Zuc7OghW6.png"
                alt="Peigne professionnel"
                width={600}
                height={400}
                className="rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">Coiffeur</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Envie de changer de tête ou simplement de rafraîchir votre coupe ? Vous avez besoin des conseils d'un
                expert pour sublimer votre style.
              </p>
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white bg-transparent"
              >
                Voir plus
              </Button>
            </div>
          </div>
        </div>
      </section> */}

      {/* instituts section */}
       <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide   ">DÉCOUVREZ NOS</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-balance">Professionnels</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Image
                src="images\yoka1.avif"
                alt="Peigne professionnel"
                width={600}
                 height={300} // ratio différent OK
  style={{ height: "300px", width: "600px" }}
                className="rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-black mb-4">Instituts de Beauté</h3>
              <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                Découvrez des instituts raffinés où expertise, discrétion et bien-être se rencontrent.
Des soins haut de gamme, réalisés par des professionnelles qualifiées, pour sublimer votre peau et révéler votre éclat naturel.
              </p>
              <Link href="/institut-de-beaute">
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white bg-transparent"
              >
                Voir plus
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recruitment Section */}
      {/* <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-x9lTtvwl7uc5C2Gq2GPQM93sJTWOqG.png"
                alt="Équipe YOKA"
                width={600}
                height={400}
                className="rounded-lg"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide   ">PROFESSIONNEL</div>
              <h3 className="text-3xl font-bold text-black mb-4 text-balance">
                YOKA recherche des profils dans toute l'Algérie pour digitaliser le secteur de la beauté
              </h3>
              <p className="text-gray-600 mb-6 italic">Antoine Puymirat - CEO</p>
              <Link href="/offres">
                <Button className="bg-black hover:bg-gray-800 text-white">Découvrir nos offres</Button>
              </Link>
            </div>
          </div>
        </div>
      </section> */}

      {/* Press Section */}
      {/* <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm font-semibold text-blue-400 mb-2 tracking-wide">PRESSE</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">Ils parlent de nous</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white rounded-lg p-8 flex items-center justify-center h-24">
              <span className="text-2xl font-bold text-black tracking-wider">VOGUE</span>
            </div>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center h-24">
              <span className="text-2xl font-bold text-black tracking-wider">GRAZIA</span>
            </div>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center h-24">
              <span className="text-2xl font-bold text-black tracking-wider">ELLE</span>
            </div>
            <div className="bg-white rounded-lg p-8 flex items-center justify-center h-24">
              <span className="text-xl font-bold text-black">marie claire</span>
            </div>
          </div>
        </div>
      </section> */}

      {/* Locations Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center  mb-12">
            <div className="text-sm font-semibold text-purple-600 mb-2 tracking-wide   ">PARTOUT EN ALGÉRIE</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-balance">
              Trouvez votre établissement beauté partout en ALGÉRIE
            </h2>
          </div>
          <div className="text-center text-white">
  <h3 className="text-center mb-6">Nos instituts de beauté populaires en Algérie</h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-4 justify-items-center w-full">
    {[
      "Alger",
      "Oran",
      "Bejaia",
      "Constantine",
      "Annaba",
      "Sétif",
      "Voir plus"
    ].map((city, index, array) => {
      const isLast = index === array.length - 1;

      if (isLast) {
        // Dernier élément → utiliser le Button
        return (
          <Button
            key={city}
            variant="outline"
            asChild
            className="col-span-2 md:col-span-3 border-white text-white bg-transparent mt-8 max-w-[200px]"
          >
            <Link href="/institut-de-beaute">{city}</Link>
          </Button>
        );
      }

      // Les autres éléments restent des Link classiques
      return (
        <Link
          key={city}
          href={`/institut-de-beaute/${slugifySalonName(city)}`}
          className="w-full max-w-[200px] bg-white text-black font-medium py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-center text-sm sm:text-base border border-gray-200 hover:border-gray-300"
        >
          {city}
        </Link>
      );
    })}
  </div>
</div>

          <div>
            {/* <div>
              <h3 className="font-bold text-black mb-4">Coiffeur</h3>
              <p className="text-gray-600 text-sm mb-4">Nos salons de coiffure populaires en Algérie</p>
              <div className="space-y-2">
                {[
                  "Bordeaux",
                  "Lille",
                  "Lyon",
                  "Marseille",
            <div className="text-center text-white">
  <h3 className="text-center mb-6">Nos instituts de beauté populaires en Algérie</h3>
  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-4 justify-items-center w-full">
    {[
      "Alger",
      "Oran",
      "Bejaia",
      "Constantine",
      "Annaba",
      "Sétif",
      "Voir plus"
    ].map((city, index, array) => {
      const isLast = index === array.length - 1;

      if (isLast) {
        // Dernier élément → utiliser le Button
        return (
          <Button
            key={city}
            variant="outline"
            asChild
            className="col-span-2 md:col-span-3 border-white text-white bg-transparent mt-8 max-w-[200px]"
          >
            <Link href="/institut-de-beaute">{city}</Link>
          </Button>
        );
      }

      // Les autres éléments restent des Link classiques
      return (
        <Link
          key={city}
          href={`/institut-de-beaute/${slugifySalonName(city)}`}
          className="w-full max-w-[200px] bg-white text-black font-medium py-3 px-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-center text-sm sm:text-base border border-gray-200 hover:border-gray-300"
        >
          {city}
        </Link>
      );
    })}
  </div>
</div>

            {/* <div>
              <h3 className="font-bold text-black mb-4">Massage</h3>
              <p className="text-gray-600 text-sm mb-4">Nos massages populaires en Algérie</p>
              <div className="space-y-2">
                {[
                  "Bordeaux",
                  "Lille",
                  "Lyon",
                  "Marseille",
                  "Montpellier",
                  "Nantes",
                  "Nice",
                  "Paris",
                  "Strasbourg",
                  "Toulouse",
                ].map((city) => (
                  <Link
                    key={city}
                    href={`/massage/${city.toLowerCase()}`}
                    className="block text-gray-600 hover:text-black text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </section>


      {/* Partner Section */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
          </div>
            <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide   ">Faites partie de la famille
</div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 text-balance">
            Devenir partenaire YOKA <span className="text-sm ml-1 text-gray-500">PRO</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 text-pretty">
            Gagnez en <strong>visibilité</strong> et <strong>développez</strong> votre institut de beauté !
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 mb-12">
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sans engagement
            </div>
            <div className="flex items-center text-gray-700">
              <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Sans commission
            </div>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <Link href="/auth/pro" className="block">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-black">Je suis gérant d'un établissement</h3>
                      <p className="text-gray-600">Coiffure, esthétique, barbier, bien-être...</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link href="/auth/register" className="block">
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-black">Je ne suis pas un professionnel</h3>
                      <p className="text-gray-600">Je souhaite prendre un rendez-vous beauté</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

            {/* FAQ Section */}
      <section className="py-20 bg-gray-50" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-purple-700 mb-2 tracking-wide   ">FAQ</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-8">Les questions fréquentes</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-black rounded-lg border border-gray-700 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center focus:outline-none transition-colors duration-200 bg-black text-white hover:bg-gray-900"
                  aria-expanded={activeIndex === index}
                  aria-controls={`faq-content-${index}`}
                >
                  <ChevronRight
                    className={`h-5 w-5 transition-all duration-200 text-white ${
                      activeIndex === index ? 'rotate-90' : ''
                    }`}
                  />
                  <span className="font-medium text-left px-2">{item.question}</span>
                </button>
                <div 
                  id={`faq-content-${index}`}
                  className={`px-6 pb-4 pt-0 transition-all duration-300 bg-black ${activeIndex === index ? 'block' : 'hidden'}`}
                  aria-hidden={activeIndex !== index}
                >
                  <div className="text-white py-0 pb-2 px-4">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
