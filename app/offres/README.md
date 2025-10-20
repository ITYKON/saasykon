# Page Offres Professionnelles

## Description
Page publique de présentation des plans d'abonnement pour les professionnels (salons, instituts de beauté).

## URL
`/offres`

## Fonctionnalités

### 🎯 Affichage des plans
- Récupération dynamique des plans depuis la base de données via l'API `/api/public/plans`
- Fallback sur des données par défaut si l'API échoue
- 4 plans disponibles : Découverte, Starter, Pro, Business

### 🎨 Design
- Design moderne et responsive
- Cards avec icônes personnalisées par plan
- Badge "POPULAIRE" sur le plan Pro
- Gradient de couleurs selon le type de plan
- Animations au survol

### 📊 Sections
1. **Hero** - Titre principal et avantages clés
2. **Pricing Cards** - Cartes de présentation des 4 plans
3. **Features** - Fonctionnalités détaillées (6 catégories)
4. **CTA** - Call-to-action pour commencer gratuitement
5. **Footer** - Liens légaux

### 🔗 Liens
- Accessible depuis le bouton "Découvrir nos offres" sur la page d'accueil
- Accessible depuis la page `/auth/pro`
- Tous les boutons CTA redirigent vers `/auth/pro` pour l'inscription

## API Utilisée
`GET /api/public/plans` - API publique (sans authentification) qui retourne les plans actifs

## Données affichées par plan
- Nom du plan
- Prix (en DA)
- Période d'essai gratuit
- Liste des fonctionnalités
- Icône et couleur personnalisées

## Mise à jour
Les plans sont gérés depuis le dashboard admin (`/admin/abonnements`) et automatiquement synchronisés avec cette page.
