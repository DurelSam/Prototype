# 🏗️ Guide de la Commande BUILD

Guide complet pour utiliser la commande `npm run build` qui réinitialise complètement la base de données MongoDB en production.

---

## ⚠️ ATTENTION - COMMANDE DANGEREUSE

Cette commande va **SUPPRIMER TOUTE LA BASE DE DONNÉES** et la recréer complètement !

**Utilisez cette commande uniquement si :**
- ✅ C'est votre première initialisation de la production
- ✅ Vous voulez un reset complet de la base de données
- ✅ Vous avez fait un backup de vos données importantes

**NE PAS utiliser si :**
- ❌ Vous avez déjà des données importantes en production
- ❌ Des utilisateurs utilisent activement l'application
- ❌ Vous voulez juste ajouter le SuperUser (utilisez `npm run seed-superuser`)

---

## 📋 Ce que fait la commande BUILD

La commande `npm run build` va exécuter les 5 étapes suivantes :

### ÉTAPE 1: Suppression de la base de données
- Supprime TOUTE la base de données MongoDB
- Tous les utilisateurs, tenants, communications, notifications sont supprimés

### ÉTAPE 2: Création des collections
- Crée les collections :
  - `users` - Tous les utilisateurs (SuperUser, UpperAdmin, Admin, Employee)
  - `tenants` - Les entreprises clientes
  - `communications` - Emails et messages WhatsApp
  - `notifications` - Notifications système

### ÉTAPE 3: Création des index
- Crée tous les index optimisés pour les performances
- Index uniques (email, companyName)
- Index composés (tenant_id + status, etc.)

### ÉTAPE 4: Création du SuperUser
- Crée le compte SuperUser avec :
  - Email: `durelsam157@gmail.com`
  - Password: `thursday`
  - Role: `SuperUser`

### ÉTAPE 5: Vérification finale
- Affiche les statistiques de la base de données
- Vérifie que le SuperUser est bien créé

---

## 🚀 Utilisation

### Mode Normal (avec confirmation)

```bash
cd backend
npm run build
```

Le script va demander une confirmation avant de procéder :

```
⚠️  Cette opération est IRRÉVERSIBLE!

Êtes-vous sûr de vouloir continuer? (yes/no):
```

Tapez `yes` ou `y` pour continuer.

### Mode Force (sans confirmation)

```bash
npm run build:force
```

⚠️ Le script s'exécutera **immédiatement** sans demander de confirmation !

---

## 📝 Configuration requise

### 1. Fichier .env configuré

Assurez-vous que votre fichier `.env` contient les bonnes credentials MongoDB.

**Option A: MongoDB Atlas (URI complète)**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prototypedb
```

**Option B: MongoDB sur VPS (credentials séparés)**
```env
MONGO_USER=votre_username
MONGO_PASS=votre_password
MONGO_HOST=votre_serveur.com
MONGO_DB=prototypedb
```

### 2. MongoDB accessible

Vérifiez que MongoDB est accessible depuis votre machine :

```bash
# Test de connexion (pour MongoDB sur VPS)
mongosh "mongodb://username:password@host:27017/prototypedb?authSource=admin"

# Test de connexion (pour MongoDB Atlas)
mongosh "mongodb+srv://cluster.mongodb.net/prototypedb" --username your_user
```

---

## 📊 Exemple de sortie

Voici ce que vous verrez lors de l'exécution :

```
======================================================================
🏗️  BUILD/INITIALISATION DE LA BASE DE DONNÉES PRODUCTION
======================================================================

⚠️  ATTENTION: Ce script va SUPPRIMER TOUTE la base de données!

🌍 Mode détecté: PRODUCTION
📡 Connexion à: votre-serveur.com
📦 Base de données: prototypedb

⚠️  Cette opération est IRRÉVERSIBLE!

Êtes-vous sûr de vouloir continuer? (yes/no): yes

📡 Connexion à MongoDB...
✅ Connecté à MongoDB: prototypedb

======================================================================
ÉTAPE 1/5: SUPPRESSION DE LA BASE DE DONNÉES
======================================================================
✅ Base de données supprimée complètement

======================================================================
ÉTAPE 2/5: CRÉATION DES COLLECTIONS
======================================================================
✅ Collection créée: users
✅ Collection créée: tenants
✅ Collection créée: communications
✅ Collection créée: notifications

======================================================================
ÉTAPE 3/5: CRÉATION DES INDEX
======================================================================
✅ Index créés pour: users
✅ Index créés pour: tenants
✅ Index créés pour: communications
✅ Index créés pour: notifications

======================================================================
ÉTAPE 4/5: CRÉATION DU SUPERUSER
======================================================================
👤 Création du SuperUser: durelsam157@gmail.com
✅ SuperUser créé avec succès!
   ID: 674d123abc456def78901234
   Email: durelsam157@gmail.com
   Role: SuperUser

======================================================================
ÉTAPE 5/5: VÉRIFICATION FINALE
======================================================================
📊 Statistiques de la base de données:
   - Users: 1
   - Tenants: 0
   - Communications: 0
   - Notifications: 0

✅ SuperUser vérifié: durelsam157@gmail.com

======================================================================
🎉 BUILD TERMINÉ AVEC SUCCÈS!
======================================================================

📋 Résumé:
   ✅ Base de données réinitialisée
   ✅ Collections créées: users, tenants, communications, notifications
   ✅ Index créés et optimisés
   ✅ SuperUser créé et opérationnel

🔐 Credentials SuperUser:
   Email: durelsam157@gmail.com
   Password: thursday

⚠️  IMPORTANT: Changez le mot de passe du SuperUser en production!

======================================================================

👋 Connexion fermée proprement.
```

---

## 🔧 Cas d'Usage

### 1. Première initialisation en production

Vous déployez votre application pour la première fois :

```bash
# 1. Configurer le .env avec les credentials MongoDB de production
nano .env

# 2. Lancer le build
npm run build

# 3. Confirmer en tapant "yes"

# 4. Démarrer l'application
npm start
```

### 2. Reset complet après des tests

Vous avez fait des tests en production et voulez repartir à zéro :

```bash
# Sauvegarde d'abord (optionnel)
mongodump --uri="mongodb://user:pass@host:27017/prototypedb" --out=/backups/avant-reset

# Reset complet
npm run build:force

# Redémarrer l'application
pm2 restart backend-saas
```

### 3. Migration de développement vers production

Vous migrez de local vers production :

```bash
# 1. Modifier le .env pour pointer vers MongoDB de production
# Commentez MONGODB_URI local et activez MONGO_USER, MONGO_PASS, etc.

# 2. Lancer le build
npm run build

# 3. Vérifier que tout est OK
mongosh "mongodb://user:pass@host:27017/prototypedb?authSource=admin"
> use prototypedb
> db.users.find({ role: 'SuperUser' })
```

---

## 🆘 Dépannage

### Erreur: "authentication failed"

```bash
❌ Erreur d'authentification MongoDB
   Vérifiez vos credentials:
   - MONGO_USER: ✅ Défini
   - MONGO_PASS: ❌ Manquant
```

**Solution:** Vérifiez que toutes les variables sont définies dans `.env` :
```env
MONGO_USER=votre_username
MONGO_PASS=votre_password
MONGO_HOST=votre_serveur.com
MONGO_DB=prototypedb
```

### Erreur: "ECONNREFUSED"

```bash
❌ MongoDB est inaccessible
   Mode Production: Vérifiez que le serveur MongoDB est accessible
```

**Solutions possibles:**
1. Vérifiez que MongoDB est démarré sur le serveur
2. Vérifiez le firewall (port 27017 doit être ouvert)
3. Vérifiez que MONGO_HOST est correct
4. Testez la connexion manuellement avec `mongosh`

### Erreur: "ENOTFOUND"

```bash
❌ Hôte MongoDB introuvable
   Vérifiez la variable MONGO_HOST: undefined
```

**Solution:** Ajoutez `MONGO_HOST` dans votre `.env` :
```env
MONGO_HOST=123.45.67.89
# ou
MONGO_HOST=mongodb.example.com
```

### Opération annulée par l'utilisateur

```bash
Êtes-vous sûr de vouloir continuer? (yes/no): no
❌ Opération annulée par l'utilisateur.
```

C'est normal ! Vous avez annulé l'opération. La base de données n'a pas été touchée.

---

## 🔐 Sécurité

### 1. Changez le mot de passe du SuperUser

Le mot de passe par défaut `thursday` est **seulement pour le développement** !

**En production, changez-le immédiatement :**

1. Connectez-vous avec le SuperUser
2. Allez dans les paramètres de profil
3. Changez le mot de passe
4. Ou utilisez mongosh :

```javascript
use prototypedb
db.users.updateOne(
  { email: 'durelsam157@gmail.com' },
  { $set: { password: '$2b$10$nouveau_hash_bcrypt_ici' } }
)
```

### 2. Sauvegardez avant de build

**Toujours faire un backup avant un reset :**

```bash
# Backup complet
mongodump --uri="mongodb://user:pass@host:27017/prototypedb" --out=/backups/$(date +%Y%m%d)

# Restaurer si nécessaire
mongorestore --uri="mongodb://user:pass@host:27017/prototypedb" /backups/20241205
```

### 3. Limitez l'accès

Ne donnez pas accès à cette commande à n'importe qui !

- ✅ Utilisez-la uniquement lors du déploiement initial
- ✅ Ne la lancez jamais en production avec des données actives
- ✅ Protégez vos credentials MongoDB

---

## 📚 Commandes disponibles

| Commande | Description | Confirmation |
|----------|-------------|--------------|
| `npm run build` | Reset complet de la DB | ✅ Oui |
| `npm run build:force` | Reset complet sans confirmation | ❌ Non |
| `npm run seed-superuser` | Crée uniquement le SuperUser | ❌ Non |
| `npm run init-db` | Teste la connexion MongoDB | ❌ Non |
| `npm run dev` | Démarre le backend (développement) | - |
| `npm start` | Démarre le backend (production) | - |

---

## ✅ Checklist avant BUILD en production

- [ ] Backup de la base de données existante fait (si applicable)
- [ ] Fichier `.env` configuré avec les bonnes credentials MongoDB
- [ ] MongoDB accessible et testé avec `mongosh`
- [ ] Vous êtes sûr de vouloir supprimer TOUTES les données
- [ ] L'application backend est arrêtée (`pm2 stop backend-saas`)
- [ ] Vous avez prévenu les utilisateurs (si applicable)

---

## 🎯 Après le BUILD

Une fois le build terminé avec succès :

1. **Vérifier le SuperUser**
   ```bash
   mongosh "mongodb://user:pass@host:27017/prototypedb?authSource=admin"
   > db.users.findOne({ role: 'SuperUser' })
   ```

2. **Changer le mot de passe du SuperUser** (IMPORTANT !)

3. **Démarrer l'application**
   ```bash
   npm start
   # ou avec PM2
   pm2 start server.js --name "backend-saas"
   ```

4. **Tester la connexion**
   - Allez sur votre frontend
   - Connectez-vous avec le SuperUser
   - Vérifiez que tout fonctionne

---

**Date**: 5 Décembre 2024
**Version**: 1.0.0
**Status**: ✅ Prêt pour production
