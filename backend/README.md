# Backend - SaaS Multi-tenant MERN

## Description
Backend du système SaaS Multi-tenant pour la gestion centralisée des communications (Outlook + WhatsApp) avec analyse IA.

## Stack Technique
- **Runtime**: Node.js
- **Framework**: Express.js
- **Base de données**: MongoDB (Mongoose)
- **Authentification**: JWT
- **Architecture**: Multi-tenant

## Structure du Projet
```
backend/
├── src/
│   ├── config/
│   │   └── database.js       # Configuration MongoDB
│   ├── models/
│   │   ├── Tenant.js         # Modèle Entreprise
│   │   ├── User.js           # Modèle Utilisateur
│   │   ├── Communication.js  # Modèle Communication
│   │   ├── Notification.js   # Modèle Notification
│   │   └── index.js          # Export centralisé
│   ├── controllers/          # (À créer)
│   └── routes/               # (À créer)
├── server.js                 # Point d'entrée
├── .env                      # Variables d'environnement
├── .gitignore
└── package.json
```

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
- Le fichier `.env` est déjà configuré pour MongoDB Local
- **IMPORTANT**: MongoDB Local est utilisé (pas de MongoDB Atlas)
- La connexion par défaut est : `mongodb://localhost:27017/saas-communications`

## Configuration MongoDB Local

1. **Installer MongoDB Community Edition** :
   - Télécharger depuis [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Suivre les instructions d'installation pour Windows

2. **Créer le répertoire de données** :
   ```bash
   mkdir C:\data\db
   ```

3. **Démarrer MongoDB** (en tant qu'Administrateur) :
   ```bash
   mongod --dbpath "C:\data\db"
   ```

4. **Vérifier la connexion** :
   ```bash
   npm run test-db
   ```

Format de la chaîne de connexion :
```
mongodb://localhost:27017/saas-communications
```

## Démarrage

### Mode développement (avec auto-reload)
```bash
npm run dev
```

### Mode production
```bash
npm start
```

Le serveur démarre sur le port défini dans `.env` (par défaut: 5000)

## Routes Disponibles

### Health Check
- **GET** `/api/health` - Vérifier l'état du serveur

## Modèles de Données

### Tenant (Entreprise)
- Informations de l'entreprise
- Configuration Twilio (BYOT)
- Paramètres SLA

### User (Utilisateur)
- Authentification
- Rôles: Admin, Manager, Employee
- Configuration Outlook

### Communication
- Messages Outlook et WhatsApp
- Analyse IA (résumé, sentiment, urgence)
- Statuts et SLA
- Pièces jointes

### Notification
- Alertes SLA
- Notifications urgentes
- Alertes système

## Variables d'Environnement Requises

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=<votre_uri_mongodb>
JWT_SECRET=<votre_secret_jwt>
FRONTEND_URL=http://localhost:3000
```

## Prochaines Étapes

- [ ] Créer les routes d'authentification
- [ ] Créer les contrôleurs
- [ ] Intégrer l'API Grok pour l'analyse IA
- [ ] Intégrer Twilio pour WhatsApp
- [ ] Intégrer Microsoft Graph API pour Outlook
- [ ] Implémenter les Cron Jobs pour SLA
- [ ] Configurer AWS S3 pour les pièces jointes

## Sécurité

- Les mots de passe sont hashés (à implémenter avec bcrypt)
- Les tokens sensibles ne sont pas retournés par défaut
- Isolation des données par `tenant_id`
- CORS configuré pour le frontend uniquement

## Support

Pour toute question, consulter la documentation du projet dans `basic program.txt`
