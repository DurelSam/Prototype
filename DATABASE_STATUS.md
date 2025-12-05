# État de la Base de Données - MongoDB Local

## ✅ Configuration Actuelle

### Base de Données
- **Nom**: `prototypedb`
- **Type**: MongoDB Local (pas de MongoDB Atlas)
- **URI**: `mongodb://localhost:27017/prototypedb`
- **Port**: 27017
- **Host**: localhost

### Statut de la Connexion
✅ **MongoDB est EN LIGNE et fonctionnel**

### Informations Serveur
- **Version MongoDB**: 8.0.10
- **Host**: DESKTOP-4K58UUG
- **Uptime**: 14 minutes (lors du dernier test)

### Collections Existantes
La base de données `prototypedb` contient actuellement **2 collections** :

1. **tenants** - Informations des entreprises
2. **users** - Utilisateurs avec leurs rôles

### Collections Automatiques (Mongoose)
Les collections suivantes seront créées automatiquement lors de la première insertion :

- **communications** - Emails et messages WhatsApp
- **aianalyses** - Analyses IA des communications
- **notifications** - Notifications système

## 📊 Statistiques
- **Collections**: 2
- **Taille des données**: 0.00 KB
- **Taille du stockage**: 8.00 KB

## 🚀 Commandes Utiles

### Démarrer MongoDB (Administrateur)
```bash
mongod --dbpath "C:\data\db"
```

### Tester la Connexion
```bash
cd backend
npm run init-db
```

### Démarrer le Backend
```bash
cd backend
npm run dev
```

### Vérifier le Status
```bash
# Vérifier si MongoDB est en cours d'exécution
netstat -an | findstr :27017
```

### Accéder au Shell MongoDB
```bash
mongosh prototypedb
```

### Commandes MongoDB Shell Utiles
```javascript
// Afficher toutes les collections
show collections

// Compter les documents dans une collection
db.users.countDocuments()
db.tenants.countDocuments()

// Voir tous les utilisateurs
db.users.find().pretty()

// Voir tous les tenants
db.tenants.find().pretty()

// Supprimer toutes les données d'une collection (attention !)
db.users.deleteMany({})
```

## 📝 Fichiers de Configuration

### backend/.env
```env
MONGODB_URI=mongodb://localhost:27017/prototypedb
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### backend/src/config/database.js
- Configuré pour MongoDB Local
- Timeout: 5000ms
- Messages d'erreur adaptés au local

## 🗑️ Fichiers Supprimés (Nettoyage)

Les fichiers suivants ont été supprimés car ils n'étaient plus nécessaires :

1. **backend/test-connection.js** - Remplacé par init-mongodb.js
2. **backend/.env** (ancien) - Contenait les credentials MongoDB Atlas
3. **backend/..env** (ancien) - Contenait les credentials MongoDB Atlas
4. **CONFIGURATION_COMPLETE.md** - Documentation obsolète
5. **GUIDE_TEST_MONGODB.md** - Documentation obsolète

## 📦 Fichiers Conservés

- **backend/init-mongodb.js** - Script d'initialisation et test de connexion
- **start-mongodb.bat** - Script pour démarrer MongoDB facilement
- **MONGODB_SETUP.md** - Instructions de configuration MongoDB
- **PAGES_URLS.md** - Liste de toutes les pages de l'application
- **README.md** - Documentation principale du projet

## 🔧 Prochaines Étapes

1. ✅ MongoDB Local configuré et fonctionnel
2. ✅ Base de données `prototypedb` créée
3. ✅ Collections `tenants` et `users` existantes
4. ⏳ Connecter le backend aux routes API
5. ⏳ Tester le flux d'authentification complet
6. ⏳ Ajouter des données de test

## ⚠️ Notes Importantes

- MongoDB doit être démarré manuellement avant de lancer l'application
- Aucune authentification n'est requise pour MongoDB local
- Les données sont stockées dans `C:\data\db`
- La base de données est automatiquement créée lors de la première connexion
- Les collections sont créées automatiquement par Mongoose lors de la première insertion

## 🆘 Dépannage

### MongoDB ne démarre pas
```bash
# Vérifier si le répertoire existe
dir C:\data\db

# Créer le répertoire si nécessaire
mkdir C:\data\db

# Démarrer MongoDB avec verbose
mongod --dbpath "C:\data\db" --verbose
```

### Erreur ECONNREFUSED
- MongoDB n'est pas démarré
- Solution: Lancer `mongod --dbpath "C:\data\db"` en tant qu'administrateur

### Port 27017 déjà utilisé
```bash
# Trouver le processus
netstat -ano | findstr :27017

# Tuer le processus (remplacer PID)
taskkill /PID <numéro_processus> /F
```

---

**Dernière mise à jour**: 5 Décembre 2024
**Base de données**: prototypedb
**Version MongoDB**: 8.0.10
