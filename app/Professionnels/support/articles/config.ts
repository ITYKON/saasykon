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
  }
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(article => article.slug === slug);
}

export function getArticlesByCategory(category: string): Article[] {
  return articles.filter(article => article.category === category);
}
