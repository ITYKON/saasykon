import Link from "next/link";

const MentionsLegales = () => {
  return (
    <div className="bg-white">
      {/* En-tête */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Mentions Légales</h1>
          <p className="text-xl text-gray-700">
            Informations légales et conditions d'utilisation de la plateforme YOKA
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-xl shadow-md p-8">
          {/* Éditeur */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Éditeur du site</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                <strong>YOKA Algérie</strong><br />
                Siège social : Béjaïa, Algérie<br />
                Email : contact@yoka.com<br />
                Téléphone : +213 ......
              </p>
              {/* <p>
                <strong>Directeur de la publication :</strong> [Nom du directeur]<br />
                <strong>Responsable éditorial :</strong> [Nom du responsable]
              </p> */}
              {/* <p>
                SIRET : [Numéro SIRET si applicable]<br />
                NIF : [Numéro d'identification fiscale]
              </p> */}
            </div>
          </section>

          {/* Hébergement */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hébergement</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Le site YOKA est hébergé par :<br />
                <strong>[Nom de l'hébergeur]</strong><br />
                {/* Adresse : [Adresse de l'hébergeur]<br />
                Téléphone : [Téléphone de l'hébergeur] */}
              </p>
            </div>
          </section>

          {/* Objet du site */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Objet du site</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                YOKA est une plateforme SaaS développée par YKON, destinée à connecter les instituts de beauté, 
                coiffeurs et professionnels du bien-être avec leurs clients.
              </p>
              <p>Le site permet :</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>La réservation en ligne de prestations de beauté et de bien-être ;</li>
                <li>La gestion numérique des rendez-vous et des activités des professionnels partenaires ;</li>
                <li>La présentation des services et fonctionnalités de la plateforme YOKA.</li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Propriété intellectuelle</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                L'ensemble des éléments composant le site YOKA (textes, images, logos, vidéos, sons, architecture, 
                charte graphique, base de données, etc.) est la propriété exclusive de YOKA ou de ses partenaires.
              </p>
              <p>
                Toute reproduction, représentation, utilisation ou adaptation, sous quelque forme que ce soit, de tout 
                ou partie des éléments du site sans l'accord écrit préalable de YOKA est strictement interdite et 
                constituerait un acte de contrefaçon sanctionné par les articles 18 bis 08 et suivants du Code de la 
                propriété intellectuelle algérienne.
              </p>
            </div>
          </section>

          {/* Protection des données */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Protection des données personnelles</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Conformément à la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le 
                traitement des données à caractère personnel, les utilisateurs disposent d'un droit d'accès, de rectification, 
                de modification et de suppression de leurs données personnelles.
              </p>
              <p>
                Pour plus d'informations sur la manière dont nous collectons et traitons vos données, veuillez consulter notre 
                <Link href="/politique-de-confidentialite" className="text-primary-600 hover:text-primary-800 ml-1">
                  Politique de confidentialité
                </Link>.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Le site YOKA utilise des cookies afin d'améliorer l'expérience utilisateur, mesurer l'audience et proposer 
                des contenus personnalisés.
              </p>
              <p>
                En naviguant sur notre site, vous acceptez l'utilisation des cookies conformément à notre 
                <Link href="/politique-cookies" className="text-primary-600 hover:text-primary-800 ml-1">
                  Politique relative aux cookies
                </Link>.
              </p>
            </div>
          </section>

          {/* Responsabilité */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsabilité</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                YOKA s'efforce d'assurer la fiabilité, la mise à jour et la disponibilité du site.
              </p>
              <p>
                Toutefois, la société YKON ne saurait être tenue responsable :
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Des erreurs, interruptions ou dysfonctionnements du site ;</li>
                <li>Des dommages directs ou indirects liés à l'utilisation du site ;</li>
                <li>Du contenu publié par les professionnels partenaires.</li>
              </ul>
              <p>
                Les partenaires (instituts, coiffeurs, indépendants, etc.) sont seuls responsables des informations et 
                prestations qu'ils présentent sur la plateforme.
              </p>
            </div>
          </section>

          {/* Accessibilité */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibilité</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                YOKA met tout en œuvre pour garantir un accès continu à ses services. Toutefois, l'accès au site peut 
                être temporairement suspendu pour maintenance ou mise à jour.
              </p>
            </div>
          </section>

          {/* Droit applicable et juridiction compétente */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Droit applicable et juridiction compétente</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Les présentes mentions légales sont régies par le droit algérien.
              </p>
              {/* <p>
                En cas de litige relatif à leur interprétation ou à leur exécution, les tribunaux de Béjaïa (Algérie) 
                seront seuls compétents.
              </p> */}
              <p className="pt-4 text-gray-500">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
