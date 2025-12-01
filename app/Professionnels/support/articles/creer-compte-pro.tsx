import { Metadata } from 'next';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Comment créer mon compte pro sur Yoka',
  description: 'Guide étape par étape pour créer et activer votre compte professionnel Yoka',
};

export default function CreerComptePro() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link 
          href="/Professionnels/support" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Retour à l'aide
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Comment créer mon compte pro sur Yoka</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="prose max-w-none text-gray-700">
            <p className="mb-4">
              Pour créer votre compte pro sur Yoka, il vous suffit de vous inscrire depuis l'Espace Pro en renseignant vos informations de base (nom, email, établissement, téléphone). Une fois l'inscription envoyée, vous recevrez un email contenant un lien qui vous permettra de configurer votre mot de passe et d'activer votre compte.
            </p>
            <p>
              Après l'activation, vous aurez accès à votre tableau de bord Yoka Pro. Vous disposerez ensuite d'un délai de 7 jours pour fournir les documents obligatoires : votre carte d'identité et votre registre de commerce. Ces documents sont nécessaires pour valider définitivement votre compte et débloquer toutes les fonctionnalités.
            </p>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cet article vous a-t-il été utile ?</h2>
            <div className="flex space-x-4">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Oui
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Non
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
