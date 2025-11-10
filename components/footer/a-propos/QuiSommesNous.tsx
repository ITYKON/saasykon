import Link from "next/link";
import { FaLeaf, FaHandsHelping,  FaUsers, FaRegSmile } from "react-icons/fa";

export const QuiSommesNous = () => {
  return (
    <div className="bg-white py-16">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Qui sommes-nous ?</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            YOKA, bien plus qu'une plateforme de réservation, un partenaire de confiance pour votre beauté et votre bien-être.
          </p>
        </div>
      </div>

      {/* Notre Histoire */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Histoire</h2>
              <p className="text-lg text-gray-600 mb-6">
                Fondée en 2025, Yoka est née d'une vision simple : démocratiser l'accès aux soins de beauté et de bien-être de qualité.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Notre plateforme connecte des milliers de clients à des professionnels qualifiés, offrant une expérience de réservation fluide, personnalisée et sans effort.
              </p>
              <p className="text-lg text-gray-600">
                Chez Yoka, la technologie n'est pas une barrière : c'est un pont entre les talents de la beauté et ceux qui les recherchent.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <img 
                  src="/images/yoka about.jpg" 
                  alt="Salon de beauté YOKA moderne et élégant" 
                  className="rounded-lg w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nos Valeurs */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Nos Valeurs</h2>
            <div className="w-24 h-1 bg-gray-900 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Les fondements qui guident chaque décision et innovation chez YOKA</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-100">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:rotate-6 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">Simplicité</h3>
              <p className="text-gray-600 leading-relaxed">Parce que la technologie doit faciliter la vie, pas la compliquer.</p>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-100">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:-rotate-12 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">Nous repensons chaque détail pour créer des outils utiles et élégants.</p>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-100">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">Confiance</h3>
              <p className="text-gray-600 leading-relaxed">Nous plaçons la transparence et la fiabilité au cœur de chaque fonctionnalité.</p>
            </div>

            <div className="group relative p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-100">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center transform group-hover:translate-y-2 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">Proximité</h3>
              <p className="text-gray-600 leading-relaxed">Nous grandissons aux côtés des salons qui nous font confiance, en restant à l'écoute de leurs besoins.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-6">Prêt à nous rejoindre ?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Découvrez une nouvelle façon de prendre soin de vous avec YOKA.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/pro/register" 
              className="bg-gray-900 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Devenir partenaire
            </Link>
            <Link 
              href="/contact" 
              className="bg-transparent border-2 border-gray-900 text-gray-900 px-8 py-3 rounded-md text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuiSommesNous;
