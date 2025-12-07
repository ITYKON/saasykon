export type Article = {
  slug: string;
  category: 'compte' | 'services' | 'clients';
  title: string;
  description: string;
  content: string[];
};

export const articles: Article[] = [
  {
    slug: 'creer-compte-pro',
    category: 'compte',
    title: 'Comment créer mon compte pro sur Yoka',
    description: 'Guide étape par étape pour créer et activer votre compte professionnel Yoka',
    content: [
      "Pour créer votre compte pro sur Yoka, il vous suffit de vous inscrire depuis l'Espace Pro en renseignant vos informations de base (nom, email, établissement, téléphone). Une fois l'inscription envoyée, vous recevrez un email contenant un lien qui vous permettra de configurer votre mot de passe et d'activer votre compte.",
      "Après l'activation, vous aurez accès à votre tableau de bord Yoka Pro. Vous disposerez ensuite d'un délai de 7 jours pour fournir les documents obligatoires : votre carte d'identité et votre registre de commerce. Ces documents sont nécessaires pour valider définitivement votre compte et débloquer toutes les fonctionnalités."
    ]
  },
  {
    slug: 'securite-confidentialite',
    category: 'compte',
    title: 'Sécurité et confidentialité',
    description: 'Comment nous protégeons vos informations et votre compte Yoka',
    content: [
      "La sécurité de votre compte Yoka est une priorité. Toutes vos informations personnelles et professionnelles sont protégées dès votre inscription. Les données que vous fournissez, comme votre identité ou votre registre de commerce, sont utilisées uniquement pour vérifier votre établissement et sécuriser votre espace pro.",
      "Votre mot de passe est entièrement chiffré et personne, y compris l'équipe Yoka, ne peut y accéder. Pour garantir la sécurité de votre compte, nous vous recommandons d'utiliser un mot de passe fort et de ne jamais le partager. Toutes les actions sensibles (connexion, modification d'informations, récupération de mot de passe) sont protégées par des systèmes de sécurité avancés.",
      "Nous respectons strictement la loi algérienne sur la protection des données personnelles. Vos informations restent confidentielles, sécurisées et ne sont jamais partagées avec des tiers sans votre consentement. Elles sont utilisées uniquement dans le cadre du fonctionnement de la plateforme Yoka."
    ]
  },
  {
    slug: 'verification-compte',
    category: 'compte',
    title: 'Comment Yoka vérifie et valide mon compte ?',
    description: 'Processus de vérification et de validation de votre compte professionnel Yoka',
    content: [
      "Après votre inscription sur Yoka, votre compte doit être vérifié pour garantir la sécurité de la plateforme et confirmer l'identité de votre établissement. Une fois connecté à votre espace pro, vous disposez d'un délai de 7 jours pour envoyer les documents nécessaires : votre carte d'identité et votre registre de commerce.",
      "Notre équipe examine ensuite vos documents afin de vérifier leur authenticité et de valider votre profil professionnel. Cette étape permet de s'assurer que chaque établissement présent sur Yoka est bien réel et conforme aux exigences légales.",
      "Lorsque votre compte est approuvé, vous recevez une confirmation par email et toutes les fonctionnalités deviennent accessibles. Si un document n'est pas conforme, vous serez invité à le renvoyer.",
      "L'ensemble du processus respecte la loi algérienne sur la protection des données personnelles, et vos informations restent strictement confidentielles."
    ]
  },
  {
    slug: 'revendiquer-salon',
    category: 'services',
    title: 'Comment revendiquer mon salon ?',
    description: 'Processus pour revendiquer la gestion de votre salon sur Yoka',
    content: [
      "Lorsque votre salon est disponible à la revendication sur Yoka, vous pouvez en demander l'accès directement depuis la plateforme. Une fois votre demande envoyée, vous recevrez un email contenant un lien pour configurer votre mot de passe et activer votre compte.",
      "Après cette étape, vous aurez accès à votre tableau de bord pendant une durée maximale de 7 jours. Durant cette période, vous devez confirmer votre identité en envoyant les documents nécessaires : votre pièce d'identité et votre registre de commerce.",
      "Si les documents sont validés, votre salon devient officiellement associé à votre compte et toutes les fonctionnalités restent accessibles. Si vous ne fournissez pas les documents dans le délai imparti, ou s'ils ne sont pas conformes, votre accès sera automatiquement retiré."
    ]
  },
  {
    slug: 'offres-tarifs',
    category: 'services',
    title: 'Nos offres et tarifs',
    description: 'Découvrez les offres adaptées à votre salon sur Yoka',
    content: [
      "Yoka propose plusieurs offres adaptées aux besoins des salons. Pour consulter les détails complets, y compris les tarifs, avantages et conditions, vous pouvez visiter la page [Nos Offres](/Professionnels/offres) dans le menu principal.",
      "Depuis votre espace pro, vous pouvez choisir l'offre qui vous convient et suivre votre abonnement en temps réel. Si vous souhaitez changer d'offre ou obtenir une assistance sur la facturation, notre équipe support est là pour vous accompagner."
    ]
  },
  {
    slug: 'optimiser-profil-pro',
    category: 'services',
    title: 'Comment gérer les services et prestations de mon salon ?',
    description: 'Guide pour gérer efficacement vos services et prestations sur Yoka',
    content: [
      "Depuis votre espace pro Yoka, vous pouvez gérer facilement tous les services et prestations proposés par votre salon. Une fois connecté à votre tableau de bord, il vous suffit d'accéder à la section 'Services' pour ajouter, modifier ou supprimer une prestation.",
      "Pour ajouter un nouveau service, vous devez renseigner son nom, sa durée et son prix. Vous pouvez également le classer dans la catégorie qui correspond à votre spécialité afin de permettre aux clients de comprendre rapidement ce que vous proposez.",
      "Si vous souhaitez mettre à jour une prestation existante, vous pouvez modifier ses informations à tout moment : ajuster le tarif, changer la durée ou mettre à jour sa description. En cas de service que vous ne proposez plus, vous pouvez simplement le supprimer.",
      "Une gestion correcte de vos services garantit une meilleure visibilité de votre salon et une expérience plus claire pour vos clients sur Yoka."
    ]
  },
  {
    slug: 'gerer-clients',
    category: 'clients',
    title: 'Comment gérer mes clients ?',
    description: 'Guide pour suivre et gérer efficacement votre clientèle sur Yoka',
    content: [
      "Depuis votre espace pro Yoka, vous pouvez suivre et gérer facilement les clients qui interagissent avec votre salon. Dans votre tableau de bord, la section 'Clients' vous permet de consulter la liste de vos clients, leurs informations de base et leur historique d'interactions avec votre établissement.",
      "Vous pouvez rechercher un client, voir les détails de ses réservations, suivre sa fréquence de visites ou vérifier les prestations qu'il a déjà effectuées. Ces informations vous aident à mieux comprendre leurs besoins et à améliorer votre relation avec eux.",
      "La gestion de vos clients dans Yoka vous permet d'organiser votre activité plus facilement et de maintenir un suivi clair et structuré de votre relation avec votre clientèle."
    ]
  },
  {
    slug: 'gestion-rendez-vous',
    category: 'clients',
    title: 'Gestion des rendez-vous',
    description: 'Guide pour gérer efficacement vos rendez-vous et réservations sur Yoka',
    content: [
      "La gestion des rendez-vous sur Yoka vous permet de suivre facilement toutes les demandes et réservations liées à votre salon. Depuis votre tableau de bord, la section 'Rendez-vous' vous donne une vue d'ensemble de votre planning : demandes en attente, rendez-vous confirmés, annulations et historiques.",
      "Lorsque vous recevez une nouvelle demande, vous pouvez l'accepter ou la refuser directement depuis cette interface. Une fois confirmée, la réservation s'ajoute automatiquement à votre agenda, ce qui vous permet d'organiser votre journée sans confusion.",
      "Vous pouvez également consulter les détails de chaque rendez-vous : service choisi, prix, durée et informations du client. Si un changement survient, vous pouvez mettre à jour le rendez-vous.",
      "Cette gestion centralisée vous aide à garder un planning clair, à éviter les chevauchements et à offrir une meilleure expérience à vos clients."
    ]
  },
  {
    slug: 'gerer-avis-clients',
    category: 'clients',
    title: 'Comment analyser l\'historique et le comportement de mes clients ?',
    description: 'Guide pour comprendre et gérer efficacement les avis de vos clients sur Yoka',
    content: [
      "Dans votre espace pro Yoka, vous pouvez consulter l'historique et le comportement de chacun de vos clients pour mieux comprendre leurs habitudes et améliorer votre service. Depuis la section 'Clients', il vous suffit de sélectionner un client pour accéder à toutes ses informations.",
      "Vous y trouverez son historique complet : les rendez-vous qu'il a effectués, les services qu'il choisit le plus souvent, sa fréquence de visites et les éventuelles notes internes que vous avez ajoutées. Ces données vous permettent d'identifier vos clients réguliers, de repérer leurs préférences et d'adapter vos prestations en conséquence.",
      "L'analyse de cet historique vous aide à offrir une expérience plus personnalisée, à fidéliser vos clients et à organiser votre activité de manière plus efficace."
    ]
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(article => article.slug === slug);
}

export function getArticlesByCategory(category: string): Article[] {
  return articles.filter(article => article.category === category);
}
