# Configuration des variables d'environnement

## Google Maps API

Pour activer la carte interactive sur la page de recherche, vous devez obtenir une clé API Google Maps.

### Étapes :

1. **Créer un projet Google Cloud**
   - Allez sur https://console.cloud.google.com/
   - Créez un nouveau projet ou sélectionnez un projet existant

2. **Activer l'API Maps JavaScript**
   - Dans le menu, allez à "APIs & Services" > "Library"
   - Recherchez "Maps JavaScript API"
   - Cliquez sur "Enable"

3. **Créer une clé API**
   - Allez à "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Copiez la clé générée

4. **Configurer la clé dans votre projet**
   - Créez un fichier `.env.local` à la racine du projet
   - Ajoutez la ligne suivante :
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_clé_api_ici
   ```

5. **Redémarrer le serveur de développement**
   ```bash
   npm run dev
   ```

### Sécurité

Pour la production, il est recommandé de :
- Restreindre la clé API à votre domaine
- Activer uniquement les APIs nécessaires
- Surveiller l'utilisation dans Google Cloud Console

### APIs requises

- Maps JavaScript API
- Geocoding API (optionnel, pour la recherche d'adresses)
- Places API (optionnel, pour l'autocomplétion)

## Autres variables d'environnement

```env
# Database
DATABASE_URL="postgresql://..."

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"

# Autres configurations...
```
