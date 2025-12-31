# Test Route Detail (Fusion PG + JSON)

## Objectif
Vérifier que l'API reconstitue correctement l'objet complet à partir de la base de données (colonnes légères) et du disque local (contenu lourd).

## Prérequis
- Avoir lancé `npm run split-test` au moins une fois pour générer les JSON.
- Serveur lancé avec `npm run dev`.

## Commande de test

Utilisez `curl` (ou votre navigateur) avec l'ID d'une entreprise existante.

```bash
# Exemple avec un ID (remplacez par un vrai ID de votre base/dossier local-blob)
curl http://localhost:3000/api/businesses/5d40bf50-edec-4b8b-9517-f9db0fe6b4e6
```

## Résultat attendu

Vous devez recevoir un JSON **complet** identique à l'objet original, contenant :
1. Les champs de PostgreSQL : `id`, `owner_user_id`, `status`, `trial_ends_at`.
2. Les champs du JSON local : `public_name`, `logo_url`, `locations` (array), `working_hours` (array), etc.

Si vous recevez une erreur 404, vérifiez que le fichier JSON existe bien dans `local-blob/entities/businesses/<ID>.json`.
