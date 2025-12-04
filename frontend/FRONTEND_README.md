# Frontend - SaaS Multi-tenant MERN

## Description
Interface React pour le système SaaS Multi-tenant de gestion centralisée des communications.

## Stack Technique
- **Framework**: React 19.2.0
- **Routing**: React Router DOM 7.10.0
- **HTTP Client**: Axios 1.13.2
- **Styling**: CSS (à développer avec Tailwind ou Material-UI)
- **État Global**: Context API (à implémenter)

## Structure du Projet
```
frontend/
├── public/
├── src/
│   ├── components/       # Composants réutilisables
│   ├── pages/            # Pages de l'application
│   ├── services/         # Services API
│   │   └── api.js        # Client API configuré
│   ├── config/           # Configuration
│   │   └── api.config.js # Config URL Backend
│   ├── utils/            # Utilitaires
│   │   ├── auth.js       # Gestion authentification
│   │   └── helpers.js    # Fonctions utilitaires
│   ├── context/          # Context React
│   ├── hooks/            # Custom hooks
│   ├── App.js            # Composant principal
│   └── index.js          # Point d'entrée
├── .env                  # Variables d'environnement
└── package.json
```

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
- Le fichier `.env` est déjà configuré
- Modifier si nécessaire l'URL du backend

## Configuration

### Variables d'environnement (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BASE_URL=http://localhost:5000
PORT=3000
```

### Proxy Backend
Le fichier `package.json` contient déjà un proxy vers le backend :
```json
"proxy": "http://localhost:5000"
```

## Démarrage

### Mode développement
```bash
npm start
```
L'application s'ouvrira sur http://localhost:3000

### Build production
```bash
npm run build
```

## Services API Disponibles

Le fichier `services/api.js` expose les services suivants :

### Health Check
```javascript
import api from './services/api';
api.healthCheck();
```

### Authentification
```javascript
api.auth.login(credentials);
api.auth.register(userData);
api.auth.logout();
api.auth.getCurrentUser();
```

### Tenants
```javascript
api.tenants.getAll();
api.tenants.getById(id);
api.tenants.create(data);
api.tenants.update(id, data);
api.tenants.delete(id);
```

### Communications
```javascript
api.communications.getAll(params);
api.communications.getById(id);
api.communications.updateStatus(id, status);
```

### Notifications
```javascript
api.notifications.getAll();
api.notifications.getUnreadCount();
api.notifications.markAsRead(id);
api.notifications.markAllAsRead();
```

## Utilitaires

### Authentification (utils/auth.js)
```javascript
import { setAuthToken, isAuthenticated, isManager } from './utils/auth';

// Sauvegarder le token
setAuthToken(token);

// Vérifier si connecté
if (isAuthenticated()) { ... }

// Vérifier le rôle
if (isManager()) { ... }
```

### Helpers (utils/helpers.js)
```javascript
import { formatDate, getSentimentColor, formatSLATime } from './utils/helpers';

// Formater une date
formatDate(new Date());

// Obtenir la couleur selon le sentiment
getSentimentColor('Positive');

// Formater le temps restant SLA
formatSLATime(slaDueDate);
```

## Fonctionnalités à Implémenter

### Pages
- [ ] Login / Register
- [ ] Dashboard Manager (Vue Kanban)
- [ ] Dashboard KPIs
- [ ] Liste des communications
- [ ] Détail d'une communication
- [ ] Paramètres entreprise
- [ ] Gestion des utilisateurs

### Composants
- [ ] Kanban Board
- [ ] Communication Card
- [ ] Graphiques (Recharts)
- [ ] Formulaire de connexion
- [ ] Barre de navigation
- [ ] Notifications dropdown

### Context
- [ ] AuthContext (gestion utilisateur connecté)
- [ ] CommunicationsContext (liste des communications)
- [ ] NotificationsContext (notifications en temps réel)

## Dépendances Recommandées (à installer)

```bash
# UI Library
npm install @mui/material @emotion/react @emotion/styled

# ou Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Charts
npm install recharts

# Drag and Drop (Kanban)
npm install @dnd-kit/core @dnd-kit/sortable

# Date management
npm install date-fns

# Toast notifications
npm install react-hot-toast
```

## Connexion Backend

Le frontend est configuré pour communiquer avec le backend sur `http://localhost:5000`

### Tester la connexion
```javascript
import api from './services/api';

api.healthCheck()
  .then(response => console.log('Backend connecté:', response.data))
  .catch(error => console.error('Erreur connexion:', error));
```

## Architecture Multi-tenant

Chaque requête API inclut automatiquement :
- Le token JWT (si disponible) dans les headers
- Le `tenant_id` est géré côté backend via le JWT

## Sécurité

- Les tokens JWT sont stockés dans localStorage
- Intercepteur Axios pour ajouter automatiquement le token
- Redirection automatique vers /login si 401
- Suppression du token si déconnexion

## Prochaines Étapes

1. Installer une UI library (Material-UI ou Tailwind)
2. Créer les pages de base (Login, Dashboard)
3. Implémenter le Kanban Board
4. Intégrer les graphiques
5. Ajouter les Context pour la gestion d'état
6. Implémenter le routing
7. Tester la connexion avec le backend

## Support

Pour toute question, consulter la documentation du projet dans `basic program.txt`
