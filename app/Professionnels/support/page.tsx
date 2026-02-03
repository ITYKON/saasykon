'use client';

import Link from 'next/link';
import { User, Briefcase, Users, Search, ChevronRight } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="support-page">
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Comment pouvons-nous vous aider ?</h1>
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Rechercher des articles d'aide..."
                className="w-full pl-6 pr-12 py-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const searchTerm = (e.target as HTMLInputElement).value.trim();
                    if (searchTerm) {
                      // Implémentez la logique de recherche ici

                    }
                  }
                }}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Carte Gestion du compte */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <User className="h-6 w-6 text-gray-900" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Gestion du compte</h2>
                </div>
                <ul className="space-y-3">
                  <li>
                    <Link href="/Professionnels/support/articles/creer-compte-pro" className="text-blue-600 hover:underline">
                      Comment créer mon compte pro sur Yoka ?
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/securite-confidentialite" className="text-blue-600 hover:underline">
                      Sécurité et confidentialité
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/verification-compte" className="text-blue-600 hover:underline">
                      Comment Yoka vérifie et valide mon compte ?
                    </Link>
                  </li>
                </ul>
                {/* <div className="mt-6">
                  <Link href="#tous-articles-comptes" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Voir tous les articles <ChevronRight className="h-4 w-4" />
                  </Link>
                </div> */}
              </div>

              {/* Carte Services Pro */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Briefcase className="h-6 w-6 text-gray-900" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Services Pro</h2>
                </div>
                <ul className="space-y-3">
                  <li>
                    <Link href="/Professionnels/support/articles/revendiquer-salon" className="text-blue-600 hover:underline">
                      Comment revendiquer mon salon ?
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/offres-tarifs" className="text-blue-600 hover:underline">
                      Nos offres et tarifs
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/optimiser-profil-pro" className="text-blue-600 hover:underline">
                      Comment gérer les services et prestations de mon salon ?
                    </Link>
                  </li>
                </ul>
                {/* <div className="mt-6">
                  <Link href="#tous-articles-services" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Voir tous les articles <ChevronRight className="h-4 w-4" />
                  </Link>
                </div> */}
              </div>

              {/* Carte Gestion des clients */}
              <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-gray-900" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Gestion des clients</h2>
                </div>
                <ul className="space-y-3">
                  <li>
                    <Link href="/Professionnels/support/articles/gerer-clients" className="text-blue-600 hover:underline">
                      Comment gérer mes clients ?
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/gestion-rendez-vous" className="text-blue-600 hover:underline">
                      Gestion des rendez-vous
                    </Link>
                  </li>
                  <li className="border-t border-gray-100 pt-3">
                    <Link href="/Professionnels/support/articles/gerer-avis-clients" className="text-blue-600 hover:underline">
                      Comment analyser l'historique et le comportement de mes clients ?
                    </Link>
                  </li>
                </ul>
                {/* <div className="mt-6">
                  <Link href="#tous-articles-clients" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                    Voir tous les articles <ChevronRight className="h-4 w-4" />
                  </Link>
                </div> */}
              </div>
            </div>
          </div>
        </section>
    </div>
  );
}
