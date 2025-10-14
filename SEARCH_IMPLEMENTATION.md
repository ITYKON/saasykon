# Implémentation du système de recherche

## Vue d'ensemble

Le système de recherche permet aux utilisateurs de trouver des salons de beauté en fonction de plusieurs critères :
- **Requête textuelle** : Nom du salon, services proposés
- **Localisation** : Ville, adresse, code postal
- **Catégorie** : Type d'établissement (coiffeur, barbier, manucure, etc.)

## Architecture

### Backend (API)

#### 1. `/api/search` - API de recherche principale
**Fichier** : `app/api/search/route.ts`

**Paramètres** :
- `q` : Requête de recherche (nom, description, services)
- `location` : Localisation (ville, adresse, code postal)
- `category` : Code de catégorie
- `page` : Numéro de page (pagination)
- `pageSize` : Nombre de résultats par page (défaut: 20)

**Fonctionnalités** :
- Recherche full-text sur les noms de salons et services
- Filtrage géographique via les business_locations et cities
- Filtrage par catégorie
- Tri par note moyenne et date de création
- Pagination
- Enrichissement des données (badges Premium, Top, Nouveau)

**Exemple de requête** :
```
GET /api/search?q=coupe&location=Paris&category=coiffeur&page=1
```

#### 2. `/api/categories` - API des catégories
**Fichier** : `app/api/categories/route.ts`

**Fonctionnalités** :
- Récupère toutes les catégories uniques utilisées par les businesses actifs
- Retourne un mapping code → nom lisible

**Exemple de réponse** :
```json
{
  "categories": [
    { "code": "barbier", "name": "Barbier" },
    { "code": "coiffeur", "name": "Coiffeur" },
    { "code": "institut", "name": "Institut de beauté" }
  ]
}
```

### Frontend

#### 1. Composant `SearchForm`
**Fichier** : `components/search-form.tsx`

Composant réutilisable pour la barre de recherche.

**Props** :
- `initialQuery` : Valeur initiale du champ de recherche
- `initialLocation` : Valeur initiale de la localisation
- `initialCategory` : Catégorie présélectionnée
- `showCategory` : Afficher ou non le sélecteur de catégorie
- `className` : Classes CSS personnalisées

**Utilisation** :
```tsx
// Page d'accueil (sans catégories)
<SearchForm />

// Page de recherche (avec catégories)
<SearchForm 
  initialQuery={query}
  initialLocation={location}
  initialCategory={category}
  showCategory={true}
/>
```

#### 2. Page de recherche
**Fichier** : `app/search/page.tsx`

Page affichant les résultats de recherche avec :
- Barre de recherche persistante
- Grille de cartes de salons
- Badges (Premium, Top, Nouveau)
- Pagination
- États de chargement

#### 3. Page d'accueil
**Fichier** : `app/page.tsx`

Intègre le composant `SearchForm` dans la section hero.

## Base de données

### Tables utilisées

1. **businesses** : Informations principales des salons
   - `public_name`, `legal_name`, `description`
   - `category_code` : Code de catégorie
   - `archived_at`, `deleted_at` : Soft delete

2. **business_locations** : Adresses des salons
   - `address_line1`, `address_line2`
   - `postal_code`, `city_id`
   - `latitude`, `longitude`

3. **cities** : Villes
   - `name`, `wilaya_number`

4. **services** : Services proposés
   - `name`, `description`
   - Relation avec `service_variants` pour les prix et durées

5. **ratings_aggregates** : Notes agrégées
   - `rating_avg`, `rating_count`

6. **subscriptions** : Abonnements
   - Relation avec `plans` pour déterminer si Premium

## Flux de recherche

1. **Utilisateur saisit une recherche** sur la page d'accueil
2. **Redirection** vers `/search?q=...&location=...`
3. **Chargement des résultats** via l'API `/api/search`
4. **Affichage** des résultats avec filtres actifs
5. **Possibilité de raffiner** la recherche avec les catégories

## Carte interactive

### Composant `SearchMap`
**Fichier** : `components/search-map.tsx`

Carte Google Maps intégrée avec :
- Marqueurs pour chaque salon
- Couleurs différentes pour Premium (bleu) vs Standard (rouge)
- Clic sur marqueur = scroll vers le salon dans la liste
- Centrage automatique basé sur les résultats
- Fallback élégant si pas de clé API

**Configuration requise** :
- Clé API Google Maps dans `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- Voir `ENV_SETUP.md` pour les instructions

### Fonctionnalités
- Position sticky (reste visible au scroll)
- Responsive (masquée sur mobile/tablette)
- Zoom et navigation interactifs
- Clustering automatique des marqueurs proches

## Améliorations futures possibles

- [x] Carte interactive Google Maps
- [ ] Recherche géographique par rayon (km)
- [ ] Filtres avancés (prix, note minimale, disponibilité)
- [ ] Recherche par services spécifiques
- [ ] Autocomplete sur les villes avec Google Places
- [ ] Sauvegarde des recherches récentes
- [ ] Tri personnalisé (distance, prix, note)
- [ ] Recherche vocale
- [ ] Suggestions de recherche
- [ ] Clustering des marqueurs sur la carte
- [ ] Infowindow au survol des marqueurs

## Tests recommandés

1. Recherche par nom de salon
2. Recherche par service (ex: "coupe")
3. Recherche par ville
4. Filtrage par catégorie
5. Combinaison de filtres
6. Pagination
7. Recherche sans résultats
8. Performance avec beaucoup de résultats
