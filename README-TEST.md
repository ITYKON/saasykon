# Test Split Vertical (PG + JSON Local)

Ce document décrit comment tester le Proof of Concept (POC) de split vertical des données `businesses`.

## Objectif
Vérifier qu'on peut séparer les données "lourdes" de la table `businesses` dans des fichiers JSON locaux, tout en conservant une API transparente qui reconstruit l'objet complet.

## Prérequis
- Node.js installé
- PostgreSQL lancé et accessible via `DATABASE_URL`
- Dépendances installées (`npm install`)

## Instructions

### 1. Lancer le script de migration (Split)
Ce script va lire la base de données actuelle et générer les fichiers JSON pour chaque entreprise dans `local-blob/entities/businesses/`.

```bash
npm run split-test
```

Vous devriez voir des logs indiquant `✅ biz <uuid>`.
Vérifiez que le dossier `local-blob/entities/businesses/` contient bien des fichiers `.json`.

### 2. Démarrer le serveur Next.js
Pour tester l'API qui lit/fusionne les données.

```bash
npm run dev
```

### 3. Tester l'API (Lecture fusionnée)
Utilisez `curl` ou votre navigateur pour interroger l'API avec un ID d'entreprise existant (récupéré des logs du script ou de la base).

Exemple :
```bash
# Remplacez UUID par un vrai ID existant
curl http://localhost:3000/api/businesses/123e4567-e89b-12d3-a456-426614174000
```

### Résultat attendu
L'objet JSON retourné doit être complet (contenir `public_name`, `locations`, `working_hours`, etc.) et identique à ce que vous auriez eu avant, mais :
- Les champs "clés" (`id`, `status`, etc.) viennent de PostgreSQL.
- Le reste (`description`, `locations`, etc.) vient du fichier JSON local.
