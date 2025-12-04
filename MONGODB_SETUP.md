# Configuration MongoDB Local

## État actuel
✅ MongoDB v8.0.10 est installé
✅ Configuration .env mise à jour pour utiliser MongoDB local
✅ Script d'initialisation créé

## Étapes pour démarrer MongoDB

### Option 1: Démarrer MongoDB manuellement (RECOMMANDÉ)

1. **Ouvrir un terminal Administrateur** (PowerShell ou CMD)
   - Clic droit sur PowerShell → "Exécuter en tant qu'administrateur"

2. **Créer le dossier de données** (si pas déjà fait):
   ```cmd
   mkdir C:\data\db
   ```

3. **Démarrer MongoDB**:
   ```cmd
   mongod --dbpath "C:\data\db"
   ```

   Laissez cette fenêtre ouverte pendant que vous travaillez avec MongoDB.

### Option 2: Utiliser le script batch

Double-cliquez sur `start-mongodb.bat` à la racine du projet.

### Option 3: Démarrer le service Windows

Si MongoDB est installé comme service Windows:
```cmd
net start MongoDB
```

## Vérifier que MongoDB fonctionne

Une fois MongoDB démarré, testez la connexion:

```bash
cd backend
npm run init-db
```

Vous devriez voir:
```
✅ Connexion réussie à MongoDB local!
📦 Base de données: saas-communications
```

## Collections créées automatiquement

Les collections suivantes seront créées automatiquement lors de la première utilisation:

1. **tenants** - Informations des entreprises
   - companyName
   - subscriptionStatus
   - settings
   - timestamps

2. **users** - Utilisateurs avec leurs rôles
   - tenant_id (référence)
   - email (unique)
   - password (hashé)
   - firstName, lastName
   - role (Employee, Manager, Admin)
   - isActive
   - lastLogin

3. **communications** - Emails et messages WhatsApp
   - tenant_id (référence)
   - type (Email, WhatsApp)
   - from, to
   - subject, body
   - metadata
   - timestamps

4. **aianalyses** - Analyses IA des communications
   - communication_id (référence)
   - tenant_id (référence)
   - analysisType
   - results
   - confidence
   - timestamps

## Structure de la base de données

```
saas-communications/
├── tenants (collection)
├── users (collection)
├── communications (collection)
└── aianalyses (collection)
```

## Commandes utiles

### Tester la connexion
```bash
cd backend
npm run init-db
```

### Démarrer le backend
```bash
cd backend
npm run dev
```

### Se connecter à MongoDB en ligne de commande
```bash
mongosh
use saas-communications
show collections
```

### Voir tous les utilisateurs
```bash
mongosh
use saas-communications
db.users.find().pretty()
```

### Voir toutes les entreprises
```bash
mongosh
use saas-communications
db.tenants.find().pretty()
```

## En cas de problème

### Erreur "ECONNREFUSED"
MongoDB n'est pas démarré. Suivez les étapes ci-dessus pour le démarrer.

### Erreur "Access denied"
Exécutez la commande en tant qu'Administrateur.

### Port 27017 déjà utilisé
Un autre processus utilise le port. Trouvez et arrêtez-le:
```cmd
netstat -ano | findstr :27017
taskkill /PID <PID> /F
```

## Fichiers créés

- ✅ `backend/.env` - Configuration mise à jour avec MongoDB local
- ✅ `backend/init-mongodb.js` - Script d'initialisation
- ✅ `start-mongodb.bat` - Script pour démarrer MongoDB
- ✅ `MONGODB_SETUP.md` - Ce fichier (guide)

## Prochaines étapes

1. Démarrer MongoDB (voir options ci-dessus)
2. Tester avec `npm run init-db`
3. Démarrer le backend avec `npm run dev`
4. Tester l'inscription d'un utilisateur depuis le frontend
5. Vérifier que les données sont bien enregistrées dans MongoDB
