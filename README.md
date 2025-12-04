# SaaS Multi-tenant MERN - Gestion des Communications

## 📋 Description

Plateforme SaaS Multi-tenant pour la gestion centralisée des communications professionnelles (Outlook + WhatsApp) avec analyse IA via Grok.

## 🎯 Fonctionnalités Principales

- ✅ **Multi-tenant** : Isolation complète des données par entreprise
- 📧 **Agrégation Outlook** : Synchronisation automatique des emails
- 💬 **Intégration WhatsApp** : Via Twilio (BYOT - Bring Your Own Twilio)
- 🤖 **Analyse IA** : Résumé, sentiment, urgence et catégorisation par Grok
- 📊 **Dashboard Kanban** : Vue manager des communications
- ⏰ **Gestion SLA** : Alertes automatiques après 24h
- 📈 **KPIs et Reporting** : Statistiques et graphiques

## 🛠️ Stack Technique

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- JWT pour l'authentification
- AWS S3 pour les pièces jointes

### Frontend
- React 19.2.0
- React Router DOM
- Axios
- Recharts (graphiques)
- @dnd-kit (Kanban)

## 📁 Structure du Projet

```
MERN Prototype/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── Tenant.js
│   │   │   ├── User.js
│   │   │   ├── Communication.js
│   │   │   └── Notification.js
│   │   ├── controllers/
│   │   └── routes/
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── config/
│   │   │   └── api.config.js
│   │   ├── utils/
│   │   │   ├── auth.js
│   │   │   └── helpers.js
│   │   ├── context/
│   │   └── hooks/
│   ├── .env
│   └── package.json
│
├── package.json
└── README.md
```

## 🚀 Installation et Démarrage

### Prérequis

- Node.js (v16 ou supérieur)
- MongoDB Atlas (compte gratuit)
- npm ou yarn

### Installation Complète

1. Cloner le projet et installer toutes les dépendances :

```bash
npm run install-all
```

Ou installer manuellement :

```bash
# Dépendances racine
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Configuration

#### 1. MongoDB Atlas

1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un cluster (M0 gratuit pour le développement)
3. Créer un utilisateur de base de données
4. Whitelist votre IP (0.0.0.0/0 pour accepter toutes les IPs en dev)
5. Obtenir la chaîne de connexion

#### 2. Variables d'Environnement

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/saas-communications?retryWrites=true&w=majority
JWT_SECRET=votre_secret_jwt_super_securise
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)** - Déjà configuré
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_BASE_URL=http://localhost:5000
PORT=3000
```

### Démarrage de l'Application

#### 🎉 Lancement en Une Seule Commande (Recommandé)

Depuis la **racine du projet** :

```bash
npm run dev
```

Cette commande lance automatiquement :
- ✅ Backend sur http://localhost:5000
- ✅ Frontend sur http://localhost:3000

#### Lancement Séparé (Optionnel)

**Backend uniquement :**
```bash
npm run server
# ou
cd backend && npm run dev
```

**Frontend uniquement :**
```bash
npm run client
# ou
cd frontend && npm start
```

## ✅ Vérification de l'Installation

### 1. Tester le Backend

Ouvrir http://localhost:5000/api/health dans votre navigateur.

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "Serveur SaaS Multi-tenant opérationnel",
  "timestamp": "..."
}
```

### 2. Tester la Connexion MongoDB

Depuis le dossier backend :

```bash
node test-connection.js
```

### 3. Tester le Frontend

Ouvrir http://localhost:3000 dans votre navigateur.

L'application React devrait se charger.

## 📦 Scripts Disponibles

### Racine du Projet

| Script | Description |
|--------|-------------|
| `npm run install-all` | Installer toutes les dépendances (racine + backend + frontend) |
| `npm run dev` | Lancer backend ET frontend en mode développement |
| `npm run server` | Lancer uniquement le backend |
| `npm run client` | Lancer uniquement le frontend |
| `npm run build` | Build du frontend pour production |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Démarrer avec nodemon (auto-reload) |
| `npm start` | Démarrer en mode production |

### Frontend

| Script | Description |
|--------|-------------|
| `npm start` | Démarrer en mode développement |
| `npm run build` | Build pour production |
| `npm test` | Lancer les tests |

## 🗄️ Modèles de Données

### Tenant (Entreprise)
- Informations entreprise
- Configuration Twilio (BYOT)
- Paramètres SLA
- Statut abonnement

### User (Utilisateur)
- Authentification (email + password)
- Rôles : Admin, Manager, Employee
- Configuration Outlook (OAuth tokens)
- Lien vers Tenant

### Communication
- Source : Outlook ou WhatsApp
- Contenu et pièces jointes
- Analyse IA (résumé, sentiment, urgence)
- Statut et SLA
- Notes et historique

### Notification
- Alertes SLA breach
- Notifications urgentes
- Statut lu/non lu

## 🔐 Sécurité

- ✅ Mots de passe hashés (à implémenter avec bcrypt)
- ✅ Tokens JWT pour l'authentification
- ✅ Isolation des données par tenant_id
- ✅ Tokens sensibles exclus des réponses API
- ✅ CORS configuré
- ✅ Variables d'environnement pour les secrets

## 📚 API Endpoints (À Implémenter)

### Health
- `GET /api/health` - Vérifier l'état du serveur

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `GET /api/auth/me` - Utilisateur connecté

### Communications
- `GET /api/communications` - Liste des communications
- `GET /api/communications/:id` - Détail communication
- `PATCH /api/communications/:id/status` - Changer le statut

### Notifications
- `GET /api/notifications` - Liste des notifications
- `PATCH /api/notifications/:id/read` - Marquer comme lu

## 🎨 Interface Utilisateur (À Développer)

### Pages Prévues

1. **Login / Register** - Authentification
2. **Dashboard Kanban** - Vue manager des communications
3. **Dashboard KPIs** - Statistiques et graphiques
4. **Communications** - Liste et détails
5. **Paramètres** - Configuration Twilio, utilisateurs

## 📈 Prochaines Étapes

### Sprint 1 (En cours) - Setup & Configuration ✅
- [x] Configuration backend
- [x] Configuration frontend
- [x] Modèles de données
- [x] Connexion MongoDB
- [ ] Routes d'authentification
- [ ] Pages Login/Register

### Sprint 2 - Connecteurs & Ingestion
- [ ] API Twilio Webhook
- [ ] API Outlook OAuth
- [ ] Upload S3

### Sprint 3 - Intelligence IA
- [ ] Intégration Grok API
- [ ] Pipeline d'analyse

### Sprint 4 - Dashboard Kanban & SLA
- [ ] UI Kanban React
- [ ] Cron Job SLA
- [ ] Notifications

### Sprint 5 - KPIs & Finalisation
- [ ] Graphiques Recharts
- [ ] Tests
- [ ] Déploiement AWS

## 🐛 Dépannage

### Erreur de connexion MongoDB
- Vérifier la chaîne de connexion dans `backend/.env`
- Vérifier que votre IP est autorisée dans MongoDB Atlas
- Tester avec `cd backend && node test-connection.js`

### Port déjà utilisé
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Problème de proxy frontend
- Vérifier que `"proxy": "http://localhost:5000"` est dans `frontend/package.json`
- Redémarrer le serveur frontend

## 📞 Support

Pour toute question, consulter la documentation détaillée dans `basic program.txt`

## 📄 Licence

ISC
