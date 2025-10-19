# Scripts de Seed

## Initialiser les plans d'abonnement

Pour initialiser les plans d'abonnement dans la base de données, exécutez :

```bash
npm run seed:plans
```

Ce script va créer ou mettre à jour les 4 plans suivants :

### 1. Plan Découverte (Gratuit)
- **Prix**: 0 DA/mois
- **Code**: `decouverte`
- **Fonctionnalités**:
  - Profil salon sur l'annuaire YOKA
  - Page publique avec lien à partager
  - Gestion manuelle des RDV
  - 1 compte employé

### 2. Plan Starter
- **Prix**: 2,500 DA/mois
- **Code**: `starter`
- **Essai gratuit**: 14 jours
- **Fonctionnalités**:
  - Tout du plan gratuit
  - Gestion complète du planning
  - Rappels automatiques par email
  - 2 comptes employés
  - Statistiques de base
  - Support prioritaire

### 3. Plan Pro
- **Prix**: 4,500 DA/mois
- **Code**: `pro`
- **Essai gratuit**: 14 jours
- **Fonctionnalités**:
  - Tout du plan Starter
  - 5 comptes employés
  - Gestion des absences
  - CRM simplifié
  - Intégration réseaux sociaux
  - Campagnes promotionnelles

### 4. Plan Business
- **Prix**: 10,000 DA/mois
- **Code**: `business`
- **Essai gratuit**: 30 jours
- **Fonctionnalités**:
  - Tout du plan Pro
  - Multi-salons illimité
  - Employés illimités
  - Tableaux de bord avancés
  - Support dédié
  - API d'intégration
  - Outils de comptabilité

## Notes

- Les prix sont stockés en **dinars (DA)** directement dans la base de données
- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans créer de doublons
- Si un plan existe déjà, il sera mis à jour avec les nouvelles valeurs
