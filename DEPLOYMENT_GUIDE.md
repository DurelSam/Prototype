# 🚀 Guide de Déploiement - Production

Guide complet pour déployer votre application MERN en production avec MongoDB authentifié.

---

## 📋 Table des Matières

1. [Configuration MongoDB](#configuration-mongodb)
2. [Configuration Backend](#configuration-backend)
3. [Configuration Frontend](#configuration-frontend)
4. [Déploiement](#déploiement)
5. [Vérifications](#vérifications)
6. [Sécurité](#sécurité)

---

## 🗄️ Configuration MongoDB

### Option 1: MongoDB Atlas (Recommandé pour débutants)

1. **Créer un compte MongoDB Atlas**
   - Allez sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un cluster gratuit (M0)

2. **Configurer l'accès réseau**
   - Database Access → Add New Database User
   - Notez le username et password
   - Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)

3. **Récupérer l'URI de connexion**
   - Cliquez sur "Connect" → "Connect your application"
   - Copiez l'URI (format: `mongodb+srv://...`)

4. **Dans votre .env de production**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prototypedb?retryWrites=true&w=majority
   ```

### Option 2: MongoDB sur VPS/Serveur Dédié

1. **Installer MongoDB sur votre serveur**
   ```bash
   # Ubuntu/Debian
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   ```

2. **Créer un utilisateur administrateur**
   ```bash
   mongosh
   ```
   ```javascript
   use admin
   db.createUser({
     user: "admin_user",
     pwd: "votre_mot_de_passe_fort",
     roles: [{ role: "root", db: "admin" }]
   })
   ```

3. **Activer l'authentification**
   ```bash
   sudo nano /etc/mongod.conf
   ```
   Ajoutez:
   ```yaml
   security:
     authorization: enabled
   ```

4. **Redémarrer MongoDB**
   ```bash
   sudo systemctl restart mongod
   sudo systemctl enable mongod
   ```

5. **Dans votre .env de production**
   ```env
   # NE PAS définir MONGODB_URI, utilisez les variables séparées
   MONGO_USER=admin_user
   MONGO_PASS=votre_mot_de_passe_fort
   MONGO_HOST=votre_ip_serveur_ou_domaine
   MONGO_DB=prototypedb
   ```

---

## 🔧 Configuration Backend

### 1. Préparer le fichier .env de production

**Sur votre serveur de production**, créez le fichier `.env` :

```bash
cd /chemin/vers/votre/backend
nano .env
```

**Copiez le contenu de `.env.production` et remplissez vos vraies credentials :**

```env
# Configuration du serveur
PORT=5000
NODE_ENV=production

# MongoDB Production (Option selon votre choix ci-dessus)
# Option A: MongoDB Atlas (URI directe)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/prototypedb

# Option B: MongoDB sur VPS (Credentials séparés)
# MONGO_USER=admin_user
# MONGO_PASS=votre_mot_de_passe
# MONGO_HOST=123.45.67.89
# MONGO_DB=prototypedb

# JWT (⚠️  CHANGEZ CETTE CLÉ !)
JWT_SECRET=votre_cle_secrete_ultra_forte_et_unique_12345
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=https://votre-domaine.com
```

### 2. Installer les dépendances

```bash
cd backend
npm ci --production
```

### 3. Initialiser la base de données (BUILD)

⚠️ **PREMIÈRE INITIALISATION UNIQUEMENT** - Cette commande supprime TOUTE la base de données !

```bash
# Initialisation complète de la base de données
npm run build
```

Cette commande va :
- ✅ Supprimer toute la base de données
- ✅ Créer toutes les collections (users, tenants, communications, notifications)
- ✅ Créer tous les index optimisés
- ✅ Créer le SuperUser automatiquement

**Ou en mode force (sans confirmation) :**
```bash
npm run build:force
```

**Alternative (si vous voulez juste créer le SuperUser sans reset) :**
```bash
npm run seed-superuser
```

📚 **Voir le guide complet :** [BUILD_COMMAND_GUIDE.md](backend/BUILD_COMMAND_GUIDE.md)

### 4. Démarrer le backend avec PM2 (Process Manager)

```bash
# Installer PM2 globalement
npm install -g pm2

# Démarrer l'application
pm2 start server.js --name "backend-saas"

# Sauvegarder la configuration
pm2 save

# Démarrage automatique au boot
pm2 startup
```

**Commandes utiles PM2:**
```bash
pm2 status              # Voir le status
pm2 logs backend-saas   # Voir les logs
pm2 restart backend-saas  # Redémarrer
pm2 stop backend-saas   # Arrêter
```

---

## 🎨 Configuration Frontend

### 1. Configurer l'URL de l'API

Dans `frontend/.env.production` :

```env
REACT_APP_API_URL=https://api.votre-domaine.com
# ou
REACT_APP_API_URL=http://votre-ip-serveur:5000
```

### 2. Build de production

```bash
cd frontend
npm ci
npm run build
```

### 3. Servir le frontend

**Option A: Avec Nginx (Recommandé)**

```bash
# Installer Nginx
sudo apt-get install nginx

# Copier les fichiers build
sudo cp -r build/* /var/www/html/

# Configurer Nginx
sudo nano /etc/nginx/sites-available/default
```

Configuration Nginx:
```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo systemctl restart nginx
```

**Option B: Avec le serveur Node.js `serve`**

```bash
npm install -g serve
serve -s build -l 3000
```

---

## 🚀 Déploiement Complet

### Checklist de déploiement

- [ ] MongoDB configuré et accessible
- [ ] Fichier `.env` de production créé et rempli
- [ ] JWT_SECRET changé par une clé forte
- [ ] SuperUser créé en production
- [ ] Backend démarré avec PM2
- [ ] Frontend build créé
- [ ] Nginx configuré (ou serveur web)
- [ ] Certificat SSL installé (Let's Encrypt)
- [ ] Firewall configuré
- [ ] Backups MongoDB configurés

### Script de déploiement automatique

Créez `deploy.sh` :

```bash
#!/bin/bash

echo "🚀 Déploiement de l'application..."

# Backend
echo "📦 Installation backend..."
cd backend
npm ci --production
npm run seed-superuser
pm2 restart backend-saas || pm2 start server.js --name "backend-saas"
cd ..

# Frontend
echo "🎨 Build frontend..."
cd frontend
npm ci
npm run build
sudo cp -r build/* /var/www/html/
cd ..

# Nginx
echo "🔄 Redémarrage Nginx..."
sudo systemctl restart nginx

echo "✅ Déploiement terminé!"
pm2 status
```

Rendre exécutable et lancer:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## ✅ Vérifications

### 1. Vérifier MongoDB

```bash
# Si MongoDB Atlas
mongosh "mongodb+srv://cluster.mongodb.net/prototypedb" --username your_user

# Si MongoDB local
mongosh -u admin_user -p --authenticationDatabase admin
```

```javascript
// Vérifier le SuperUser
use prototypedb
db.users.findOne({ role: 'SuperUser' })

// Compter les utilisateurs
db.users.countDocuments()
```

### 2. Vérifier le Backend

```bash
# Logs PM2
pm2 logs backend-saas

# Test de l'API
curl http://localhost:5000/api/health
# ou
curl https://api.votre-domaine.com/api/health
```

### 3. Vérifier le Frontend

Ouvrez votre navigateur:
- Local: `http://votre-ip-serveur`
- Domaine: `https://votre-domaine.com`

Testez la connexion avec le SuperUser:
- Email: `durelsam157@gmail.com`
- Password: `thursday`

---

## 🔒 Sécurité

### 1. Firewall (UFW sur Ubuntu)

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Autoriser le backend (si séparé)
sudo ufw allow 5000/tcp

# Autoriser MongoDB (seulement si nécessaire depuis l'extérieur)
# sudo ufw allow 27017/tcp

# Vérifier le status
sudo ufw status
```

### 2. SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

### 3. Variables d'environnement sécurisées

```bash
# Protéger le fichier .env
chmod 600 .env

# Vérifier les permissions
ls -la .env
# Devrait afficher: -rw------- (600)
```

### 4. MongoDB Sécurité

- ✅ Activer l'authentification
- ✅ Créer des utilisateurs avec des rôles limités
- ✅ Utiliser des mots de passe forts
- ✅ Restreindre l'accès réseau
- ✅ Activer les backups automatiques
- ✅ Chiffrer les connexions (SSL/TLS)

### 5. Backups MongoDB

**Script de backup automatique:**

```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Créer le backup
mongodump --uri="mongodb://user:pass@host:27017/prototypedb" --out="$BACKUP_DIR/$TIMESTAMP"

# Compresser
tar -czf "$BACKUP_DIR/$TIMESTAMP.tar.gz" "$BACKUP_DIR/$TIMESTAMP"
rm -rf "$BACKUP_DIR/$TIMESTAMP"

# Garder seulement les 7 derniers backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "✅ Backup créé: $TIMESTAMP.tar.gz"
```

Ajouter au crontab:
```bash
crontab -e
```
```
# Backup quotidien à 2h du matin
0 2 * * * /chemin/vers/backup-mongodb.sh
```

---

## 🆘 Dépannage

### Erreur de connexion MongoDB

```bash
# Vérifier que MongoDB est démarré
sudo systemctl status mongod

# Vérifier les logs
sudo tail -f /var/log/mongodb/mongod.log

# Tester la connexion
mongosh --host localhost --port 27017
```

### Backend ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs backend-saas

# Vérifier le fichier .env
cat .env | grep MONGO

# Tester manuellement
node server.js
```

### Frontend 502 Bad Gateway

```bash
# Vérifier Nginx
sudo systemctl status nginx
sudo nginx -t

# Vérifier que le backend est accessible
curl http://localhost:5000/api/health
```

---

## 📞 Support

Pour toute question :
- Vérifiez les logs: `pm2 logs`
- Vérifiez MongoDB: `mongosh`
- Vérifiez Nginx: `sudo nginx -t`

---

**Date**: 5 Décembre 2024
**Version**: 1.0.0
**Status**: ✅ Prêt pour production
