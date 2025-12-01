'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Briefcase, Users, Search, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ArticleContent from './components/ArticleContent';

// Données des articles (à remplacer par un appel API ou un fichier de données)
const articles = {
  'creer-compte': {
    title: 'Comment créer mon compte pro sur Yoka ?',
    category: 'Gestion du compte',
    content: (
      <div className="space-y-4">
        <p>Pour créer votre compte professionnel sur Yoka, suivez ces étapes simples :</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Cliquez sur le bouton "S'inscrire" en haut à droite de la page d'accueil</li>
          <li>Sélectionnez l'option "Compte Professionnel"</li>
          <li>Remplissez le formulaire avec vos informations professionnelles</li>
          <li>Vérifiez votre adresse email en cliquant sur le lien que vous recevrez</li>
          <li>Complétez votre profil avec les informations de votre établissement</li>
        </ol>
        <p>Une fois ces étapes terminées, votre compte sera en attente de validation par notre équipe.</p>
      </div>
    ),
  },
  'revendiquer-salon': {
    title: 'Comment revendiquer mon salon ?',
    category: 'Services Pro',
    content: (
      <div className="space-y-4">
        <p>La revendication de votre salon sur Yoka vous permet de gérer sa fiche et d'apparaître dans les résultats de recherche :</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Connectez-vous à votre compte professionnel</li>
          <li>Rendez-vous dans la section "Mon établissement"</li>
          <li>Cliquez sur "Revendiquer un salon"</li>
          <li>Recherchez votre salon dans notre base de données</li>
          <li>Si trouvé, suivez la procédure de vérification</li>
          <li>Si non trouvé, ajoutez manuellement les informations de votre salon</li>
        </ol>
        <p>Notre équipe validera votre demande sous 24-48 heures.</p>
      </div>
    ),
  },
  'gerer-clients': {
    title: 'Comment gérer mes clients ?',
    category: 'Gestion des clients',
    content: (
      <div className="space-y-4">
        <p>Yoka vous offre plusieurs outils pour gérer efficacement votre clientèle :</p>
        <h3 className="font-semibold text-lg mt-4">1. Gestion des rendez-vous</h3>
        <p>Consultez, modifiez ou annulez les rendez-vous depuis votre tableau de bord.</p>
        
        <h3 className="font-semibold text-lg mt-4">2. Fiches clients</h3>
        <p>Conservez les informations importantes sur vos clients et leurs préférences.</p>
        
        <h3 className="font-semibold text-lg mt-4">3. Historique des visites</h3>
        <p>Suivez l'historique des visites et des services effectués.</p>
      </div>
    ),
  },
};

// Composant pour afficher la liste des catégories
function CategoriesList({ onArticleClick }: { onArticleClick: (articleId: string) => void }) {
  return (
    <>
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
                    console.log('Recherche pour :', searchTerm);
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
                  <button 
                    onClick={() => onArticleClick('creer-compte')} 
                    className="text-blue-600 hover:underline text-left w-full"
                  >
                    Comment créer mon compte pro sur Yoka ?
                  </button>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#securite" className="text-blue-600 hover:underline">
                    Sécurité et confidentialité
                  </a>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#parametres" className="text-blue-600 hover:underline">
                    Paramètres du compte
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <a href="#tous-articles-comptes" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Voir tous les articles <ChevronRight className="h-4 w-4" />
                </a>
              </div>
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
                  <button 
                    onClick={() => onArticleClick('revendiquer-salon')} 
                    className="text-blue-600 hover:underline text-left w-full"
                  >
                    Comment revendiquer mon salon ?
                  </button>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#tarifs" className="text-blue-600 hover:underline">
                    Nos offres et tarifs
                  </a>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#optimisation" className="text-blue-600 hover:underline">
                    Optimiser son profil Pro
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <a href="#tous-articles-services" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Voir tous les articles <ChevronRight className="h-4 w-4" />
                </a>
              </div>
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
                  <button 
                    onClick={() => onArticleClick('gerer-clients')} 
                    className="text-blue-600 hover:underline text-left w-full"
                  >
                    Comment gérer mes clients ?
                  </button>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#rdv" className="text-blue-600 hover:underline">
                    Gestion des rendez-vous
                  </a>
                </li>
                <li className="border-t border-gray-100 pt-3">
                  <a href="#avis" className="text-blue-600 hover:underline">
                    Gérer les avis clients
                  </a>
                </li>
              </ul>
              <div className="mt-6">
                <a href="#tous-articles-clients" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                  Voir tous les articles <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default function SupportPage() {
  const searchParams = useSearchParams();
  const [currentArticle, setCurrentArticle] = useState<string | null>(null);
  
  // Vérifier si un article est sélectionné dans l'URL
  const articleId = searchParams.get('article');
  
  // Si un article est sélectionné, l'afficher
  if (articleId && articles[articleId as keyof typeof articles]) {
    const article = articles[articleId as keyof typeof articles];
    return (
      <ArticleContent 
        title={article.title}
        content={article.content}
        category={article.category}
        backLink="/Professionnels/support"
      />
    );
  }
  
  // Sinon, afficher la liste des catégories
  return (
    <div className="support-page">
      <CategoriesList onArticleClick={(articleId) => setCurrentArticle(articleId)} />
    </div>
  );
}
