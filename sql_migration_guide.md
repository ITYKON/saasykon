
# Guide de Migration SQL : Slugs pour les Salons

Ce guide détaille les étapes nécessaires pour ajouter la colonne `slug` à la base de données et migrer les données existantes.

## 1. Modifications SQL

Exécutez les commandes SQL suivantes sur votre base de données PostgreSQL pour ajouter la colonne `slug` à la table `businesses`.

```sql
-- 1. Ajouter la colonne slug (nullable pour commencer)
ALTER TABLE "businesses" ADD COLUMN "slug" TEXT;

-- 2. Créer un index unique pour assurer l'unicité des slugs et la rapidité des recherches
CREATE UNIQUE INDEX "businesses_slug_key" ON "businesses"("slug");
```

## 2. Mise à jour de Prisma

Après avoir exécuté les commandes SQL, mettez à jour votre schéma Prisma local en introspectant la base de données :

```bash
npx prisma db pull
```

Cela mettra à jour votre fichier `prisma/schema.prisma` pour inclure le champ `slug` :

```prisma
model businesses {
  // ... autres champs
  slug String? @unique
  // ...
}
```

N'oubliez pas de générer le client Prisma après la mise à jour :
```bash
npx prisma generate
```

## 3. Backfill des Données (Remplissage des slugs manquants)

Pour générer des slugs pour les salons existants, un script a été créé.

### Logique du script
Le script parcourt tous les salons sans slug et en génère un basé sur le format : `[nom-du-salon]-[ville]`.
Si un conflit existe (ex: deux "Salon Beaute" à "Paris"), il ajoute un suffixe incrémental (ex: `salon-beaute-paris-2`).

### Script à exécuter

Si vous avez le script `scripts/backfill-slugs.ts` dans votre projet, exécutez-le via :

```bash
npx ts-node scripts/backfill-slugs.ts
```

Ou en utilisant l'utilitaire de votre projet s'il est configuré différemment.

## 4. Points d'attention

*   **Nullable** : La colonne `slug` est laissée `Nullable` (`String?`) pour faciliter la transition et éviter les erreurs bloquantes lors de la création de la colonne si la table contient déjà des données.
*   **Résilience** : Le code d'application a été mis à jour pour gérer la création de slugs avec une logique de "retry" en cas de collision.
*   **Index** : L'index unique est crucial pour empêcher les doublons au niveau base de données.
