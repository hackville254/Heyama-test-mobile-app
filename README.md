# HEYAMA Objects — Mobile App (Expo)

Application mobile professionnelle pour créer, lister, consulter et supprimer des « objets » avec upload d'image et mises à jour en temps réel via WebSocket.

## Aperçu
- Création d'objet avec sélection d'image depuis la galerie et upload vers S3/MinIO via URL présignée
- Liste avec rafraîchissement, états de chargement/erreur, support mode sombre
- Détail d'objet avec image optimisée (`expo-image` cache, transition)
- Temps réel (Socket.IO) pour créations/suppressions; mode manuel si WS indisponible
- Thème clair/sombre via `useColorScheme` et composants “Themed”

## Stack Technique
- React Native + Expo Router
- `expo-image`, `expo-image-picker`, `expo-file-system`
- Socket.IO client
- TypeScript, ESLint

## Prérequis
- Node.js LTS
- Expo CLI (`npm install -g expo-cli` facultatif)
- Un backend compatible:
  - REST: `GET /objects`, `GET /objects/:id`, `POST /objects`, `DELETE /objects/:id`
  - Upload: `POST /objects/upload-url` retourne `{ uploadUrl, publicUrl, key }`
  - Socket.IO namespace `'/objects'` avec events: `objects.created`, `objects.deleted`

## Démarrage
```bash
npm install
npm run start
# ou
npm run android
npm run ios
npm run web
```

## Configuration
- Définir la base API via `EXPO_PUBLIC_API_BASE` (recommandé):
  - Exemple: `EXPO_PUBLIC_API_BASE=https://votre-backend.example.com`
- Résolution automatique (fallbacks) dans `services/config.ts:4`:
  - Dev Expo: dérive l’hôte de `Constants.expoConfig?.hostUri`
  - Android émulateur: `http://10.0.2.2:3000`
  - iOS simulateur: `http://localhost:3000`
  - Un domaine `ngrok` peut être utilisé pour tests externes

## Flux Upload d’Image
1. `POST /objects/upload-url` pour obtenir une URL présignée
2. `PUT` binaire vers `uploadUrl` (`expo-file-system`)
3. `POST /objects` avec `imageUrl` public

Code côté app:
- `services/api.ts:22` `getUploadUrl`
- `services/upload.ts:5` `putToS3`
- `app/objects/new.tsx:38` enchaîne présign → PUT → POST

## Temps Réel (WebSocket)
- Client Socket.IO sur namespace `'/objects'`
- Écoute `objects.created` et `objects.deleted`
- Bannière “Mode manuel” si la connexion échoue; actions “Rafraîchir” et “Réessayer”

Code côté app:
- `services/socket.ts:6` client et singleton
- `app/objects/index.tsx:44` abonnement et fallback manuel

## Structure du Projet
```
app/
  (tabs)/            # Home/Explore
  objects/           # Liste, création, détail
components/          # UI réutilisable (themed, parallax, etc.)
constants/           # Couleurs, polices
services/            # API, upload, WebSocket, config
```

## Scripts
- `npm run start` — dev server Expo
- `npm run android` — lancer sur émulateur Android
- `npm run ios` — lancer sur simulateur iOS
- `npm run web` — version web
- `npm run lint` — lint avec ESLint

## Bonnes Pratiques UI/UX
- Mode sombre pris en charge sur toutes les pages objets
- Champs avec `returnKeyType="done"` et validation simple
- `KeyboardAvoidingView` + `ScrollView` pour formulaires longs
- Images avec `cachePolicy="disk"` et `transition` pour une meilleure perception

## Dépannage
- Erreur “Network request failed”:
  - Vérifier `EXPO_PUBLIC_API_BASE`
  - Android émulateur: utiliser `http://10.0.2.2:3000`
  - iOS simulateur: utiliser `http://localhost:3000`
  - Autoriser CORS côté backend
- WebSocket indisponible:
  - L’app bascule en “Mode manuel”; utilisez le bouton “Rafraîchir” ou “Réessayer”

## Sécurité
- Ne jamais committer de secrets
- Les URLs présignées expirent; générer côté backend
