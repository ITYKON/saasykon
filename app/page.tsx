"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SearchForm } from "@/components/search-form";
import Link from "next/link";
import Image from "next/image";

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
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            // backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-mI0dWUhJXFiiWuNqKuNdrc4zhCnc7w.png')`,
            backgroundImage: `url('https://i.pinimg.com/736x/28/93/12/28931203342e717fa057bc511086c404.jpg')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">Réservez en beauté</h1>
          <p className="text-lg text-white/90 mb-8 text-pretty">Simple • Immédiat • 24h/24</p>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-lg p-6 shadow-2xl">
            <SearchForm />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">UNE FORTE CROISSANCE</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4 text-balance">
              Vous êtes un professionnel de la beauté ?<br />
              Découvrez la prise de RDV en ligne !
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">+ 50%</div>
              <p className="text-gray-600">de fréquence sur les rdv pris en ligne</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">4x</div>
              <p className="text-gray-600">moins d'oublis avec les rappels sms des rendez-vous</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">50%</div>
              <p className="text-gray-600">des rdv en ligne pris en dehors des horaires d'ouverture</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">+50 000</div>
              <p className="text-gray-600">professionnels nous font confiance</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">5 RDV</div>
              <p className="text-gray-600">pris chaque seconde sur YOKA</p>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-lg">
              <div className="text-4xl font-bold text-black mb-2">&gt; 5 milliards €</div>
              <p className="text-gray-600">de chiffre d'affaires généré</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professionals Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">DÉCOUVREZ NOS</div>
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
      </section>

      {/* Recruitment Section */}
      <section className="py-20 bg-white">
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
              <div className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">PROFESSIONNEL</div>
              <h3 className="text-3xl font-bold text-black mb-4 text-balance">
                YOKA recherche des profils dans toute la France pour digitaliser le secteur de la beauté
              </h3>
              <p className="text-gray-600 mb-6 italic">Antoine Puymirat - CEO</p>
              <Link href="/offres">
                <Button className="bg-black hover:bg-gray-800 text-white">Découvrir nos offres</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Press Section */}
      <section className="py-20 bg-black">
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
      </section>

      {/* Locations Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">PARTOUT EN FRANCE</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-8 text-balance">
              Trouvez votre établissement beauté partout en France
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <h3 className="font-bold text-black mb-4">Coiffeur</h3>
              <p className="text-gray-600 text-sm mb-4">Nos salons de coiffure populaires en France</p>
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
                    href={`/coiffeur/${city.toLowerCase()}`}
                    className="block text-gray-600 hover:text-black text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-black mb-4">Barbier</h3>
              <p className="text-gray-600 text-sm mb-4">Nos barbiers populaires en France</p>
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
                    href={`/barbier/${city.toLowerCase()}`}
                    className="block text-gray-600 hover:text-black text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-black mb-4">Manucure</h3>
              <p className="text-gray-600 text-sm mb-4">Nos salons de manucure populaires en France</p>
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
                    href={`/manucure/${city.toLowerCase()}`}
                    className="block text-gray-600 hover:text-black text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-black mb-4">Institut</h3>
              <p className="text-gray-600 text-sm mb-4">Nos instituts de beauté populaires en France</p>
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
                    href={`/institut/${city.toLowerCase()}`}
                    className="block text-gray-600 hover:text-black text-sm"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-black mb-4">Massage</h3>
              <p className="text-gray-600 text-sm mb-4">Nos massages populaires en France</p>
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
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50" id="faq">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-semibold text-blue-600 mb-2 tracking-wide">FAQ</div>
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-8">Les questions fréquentes</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none"
                  aria-expanded={activeIndex === index}
                  aria-controls={`faq-content-${index}`}
                >
                  <span className="font-medium text-black text-left">{item.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${activeIndex === index ? 'transform rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  id={`faq-content-${index}`}
                  className={`px-6 pb-4 pt-0 transition-all duration-300 ${activeIndex === index ? 'block' : 'hidden'}`}
                  aria-hidden={activeIndex !== index}
                >
                  <div className="text-gray-600">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <div className="text-2xl font-bold text-black tracking-wide mb-2">
              YOKA
              <span className="text-sm ml-1 text-gray-500">PRO</span>
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 text-balance">
            Devenir partenaire YOKA Pro
          </h2>
          <p className="text-xl text-gray-600 mb-8 text-pretty">
            Soyez visibles auprès de <strong>14 millions d'utilisateurs</strong>.
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
            <Link href="/pro/register" className="block">
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

      <Footer />
    </div>
  )
}
