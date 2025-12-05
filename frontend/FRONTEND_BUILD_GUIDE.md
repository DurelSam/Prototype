# 🎨 Guide de Build Frontend - Production

Guide complet pour builder et déployer le frontend React en production.

---

## 📋 Prérequis

Avant de builder le frontend, assurez-vous d'avoir :

- ✅ Node.js installé (version 14 ou supérieure)
- ✅ npm ou yarn installé
- ✅ L'URL de votre backend de production
- ✅ Toutes les dépendances installées

---

## 🔧 Configuration pour la Production

### 1. Configurer le fichier .env.production

Le fichier `.env.production` doit contenir l'URL de votre backend en production :

```env
# URL de l'API Backend en production
REACT_APP_API_URL=https://votre-backend-url.com/api
REACT_APP_BASE_URL=https://votre-backend-url.com
```

**Exemples selon votre plateforme :**

**Render :**
```env
REACT_APP_API_URL=https://votre-app-backend.onrender.com/api
REACT_APP_BASE_URL=https://votre-app-backend.onrender.com
```

**Heroku :**
```env
REACT_APP_API_URL=https://votre-app-backend.herokuapp.com/api
REACT_APP_BASE_URL=https://votre-app-backend.herokuapp.com
```

**VPS avec domaine :**
```env
REACT_APP_API_URL=https://api.votre-domaine.com/api
REACT_APP_BASE_URL=https://api.votre-domaine.com
```

**VPS avec IP :**
```env
REACT_APP_API_URL=http://123.45.67.89:5000/api
REACT_APP_BASE_URL=http://123.45.67.89:5000
```

### 2. Vérifier la configuration API

Le fichier [src/config/api.config.js](src/config/api.config.js) gère automatiquement le basculement entre dev et production :

```javascript
const config = {
  development: {
    apiUrl: 'http://localhost:5000/api',
    baseUrl: 'http://localhost:5000'
  },
  production: {
    // Utilise les variables d'environnement de .env.production
    apiUrl: process.env.REACT_APP_API_URL || 'https://your-production-api.com/api',
    baseUrl: process.env.REACT_APP_BASE_URL || 'https://your-production-api.com'
  }
};

const environment = process.env.NODE_ENV || 'development';
export const API_CONFIG = config[environment];
```

✅ **Aucune modification nécessaire** - Configurez uniquement `.env.production` !

---

## 🚀 Build de Production

### Étapes pour builder le frontend

1. **Installer les dépendances**
   ```bash
   cd frontend
   npm ci
   ```

2. **Configurer .env.production**
   ```bash
   # Éditez le fichier et remplacez les URLs
   nano .env.production
   ```

3. **Lancer le build**
   ```bash
   npm run build
   ```

4. **Vérifier le build**
   ```bash
   # Le dossier "build" doit être créé
   ls -la build/
   ```

### Ce que fait `npm run build`

Le script de build (`react-scripts build`) va :

1. ✅ Définir `NODE_ENV=production`
2. ✅ Lire les variables depuis `.env.production`
3. ✅ Minifier le code JavaScript
4. ✅ Optimiser les assets (images, CSS)
5. ✅ Générer des fichiers statiques dans `build/`
6. ✅ Créer des hash pour le cache busting
7. ✅ Générer un service worker (PWA)

### Structure du dossier build

```
build/
├── index.html          # Page HTML principale
├── static/
│   ├── css/           # CSS minifié avec hash
│   ├── js/            # JavaScript minifié avec hash
│   └── media/         # Images et assets
├── manifest.json      # Manifest PWA
├── favicon.ico
├── logo192.png
└── logo512.png
```

---

## 📦 Déploiement

### Option 1: Netlify (Recommandé pour React)

**Méthode 1: Via l'interface Netlify**

1. Allez sur [netlify.com](https://www.netlify.com/)
2. Connectez votre repository GitHub/GitLab
3. Configurez le build :
   - **Build command** : `npm run build`
   - **Publish directory** : `build`
   - **Environment variables** : Ajoutez vos variables `REACT_APP_*`

**Méthode 2: Via Netlify CLI**

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Déployer
cd frontend
netlify deploy --prod --dir=build
```

**Configuration des variables d'environnement sur Netlify :**

1. Site settings → Build & deploy → Environment
2. Ajoutez :
   - `REACT_APP_API_URL` = votre URL backend
   - `REACT_APP_BASE_URL` = votre URL backend

### Option 2: Vercel

**Méthode 1: Via l'interface Vercel**

1. Allez sur [vercel.com](https://vercel.com/)
2. Importez votre projet
3. Configurez :
   - **Framework Preset** : Create React App
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

**Méthode 2: Via Vercel CLI**

```bash
# Installer Vercel CLI
npm install -g vercel

# Déployer
cd frontend
vercel --prod
```

**Configuration des variables d'environnement sur Vercel :**

1. Project Settings → Environment Variables
2. Ajoutez vos variables `REACT_APP_*` pour Production

### Option 3: Render (Static Site)

1. Créez un nouveau **Static Site** sur Render
2. Connectez votre repository
3. Configurez :
   - **Build Command** : `cd frontend && npm install && npm run build`
   - **Publish Directory** : `frontend/build`
4. Ajoutez les variables d'environnement dans l'interface

### Option 4: VPS avec Nginx

**1. Builder localement et transférer**

```bash
# Sur votre machine locale
cd frontend
npm run build

# Transférer vers le VPS
scp -r build/* user@votre-vps:/var/www/html/
```

**2. Configurer Nginx**

```bash
# Sur le VPS
sudo nano /etc/nginx/sites-available/default
```

**Configuration Nginx pour React Router :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    root /var/www/html;
    index index.html;

    # Support de React Router (SPA)
    location / {
        try_files $uri /index.html;
    }

    # Cache pour les assets statiques
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy vers le backend (optionnel si backend sur même serveur)
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
# Redémarrer Nginx
sudo systemctl restart nginx
```

**3. SSL avec Let's Encrypt**

```bash
# Installer Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtenir un certificat
sudo certbot --nginx -d votre-domaine.com

# Le certificat sera renouvelé automatiquement
```

### Option 5: Serveur Node.js (avec serve)

```bash
# Installer serve globalement
npm install -g serve

# Démarrer le serveur de production
cd frontend
serve -s build -l 3000
```

**Avec PM2 (recommandé) :**

```bash
# Installer PM2
npm install -g pm2

# Démarrer avec PM2
pm2 serve build 3000 --name "frontend-saas" --spa

# Sauvegarder
pm2 save

# Démarrage auto au boot
pm2 startup
```

---

## ✅ Vérifications Post-Déploiement

### 1. Tester l'application

Ouvrez votre navigateur et allez sur votre URL de production :

```
https://votre-domaine.com
```

### 2. Vérifier la connexion au backend

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Network**
3. Essayez de vous connecter avec le SuperUser :
   - Email : `durelsam157@gmail.com`
   - Password : `thursday`
4. Vérifiez que les requêtes vont vers votre backend de production

**Exemple de requête attendue :**
```
POST https://votre-backend-url.com/api/auth/login
```

### 3. Tester les routes

Vérifiez que toutes les routes fonctionnent :

- `/` - Page d'accueil
- `/login` - Page de connexion
- `/dashboard` - Dashboard (après connexion)
- `/users` - Gestion des utilisateurs
- `/communications` - Communications

### 4. Vérifier le Console

Ouvrez la console DevTools et assurez-vous qu'il n'y a pas d'erreurs :

- ❌ Pas d'erreurs CORS
- ❌ Pas d'erreurs 404
- ❌ Pas d'erreurs de connexion au backend
- ✅ Les requêtes API fonctionnent

---

## 🔒 Sécurité et Optimisations

### Variables d'environnement

⚠️ **IMPORTANT :** Les variables `REACT_APP_*` sont **incluses dans le build** et **visibles côté client** !

**Ne JAMAIS mettre :**
- ❌ Clés secrètes API
- ❌ Tokens privés
- ❌ Mots de passe
- ❌ Clés de chiffrement

**OK pour mettre :**
- ✅ URL du backend public
- ✅ Identifiants publics (Google Analytics, etc.)
- ✅ Paramètres de configuration publics

### Optimisations de performance

1. **Activer la compression Gzip (Nginx) :**

```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

2. **Cache des assets statiques :**

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **HTTP/2 :**

```nginx
listen 443 ssl http2;
```

---

## 🆘 Dépannage

### Erreur : "Cannot connect to backend"

**Cause :** Le frontend ne peut pas joindre le backend

**Solutions :**
1. Vérifiez que `.env.production` contient la bonne URL
2. Vérifiez que le backend est démarré
3. Vérifiez les CORS sur le backend ([server.js:13-16](../../backend/server.js:13-16))
4. Vérifiez les DevTools → Network pour voir l'URL réelle

### Erreur : "Mixed Content" (HTTP/HTTPS)

**Cause :** Frontend en HTTPS essaie d'appeler un backend en HTTP

**Solutions :**
1. Configurez SSL sur le backend aussi
2. Ou utilisez HTTP pour les deux (développement uniquement)

### Erreur : Routes 404 après refresh

**Cause :** Le serveur web ne connait pas React Router

**Solution Nginx :**
```nginx
location / {
    try_files $uri /index.html;
}
```

**Solution Netlify/Vercel :** Créez `public/_redirects` :
```
/*    /index.html   200
```

### Build échoue

```bash
# Nettoyer le cache et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Checklist de Déploiement

Avant de déployer en production :

- [ ] `.env.production` créé et configuré avec les bonnes URLs
- [ ] `npm run build` fonctionne sans erreurs
- [ ] Dossier `build/` généré correctement
- [ ] Variables d'environnement configurées sur la plateforme de déploiement
- [ ] Backend accessible depuis l'URL de production
- [ ] CORS configuré sur le backend pour accepter le domaine frontend
- [ ] SSL/HTTPS configuré (Let's Encrypt)
- [ ] React Router fonctionne (redirections configurées)
- [ ] Test de connexion avec le SuperUser fonctionne
- [ ] DevTools Console sans erreurs
- [ ] Toutes les routes testées et fonctionnelles

---

## 📚 Commandes Utiles

```bash
# Développement
npm start                    # Démarre le serveur de dev

# Production
npm run build               # Build de production
npm run build && serve -s build  # Build + Test local

# Tests
npm test                    # Lance les tests

# Analyse du bundle
npm install -g source-map-explorer
npm run build
source-map-explorer 'build/static/js/*.js'
```

---

## 📦 Structure des fichiers de configuration

```
frontend/
├── .env                    # Variables de développement (local)
├── .env.production        # Variables de production (build)
├── package.json           # Scripts et dépendances
├── public/
│   ├── index.html        # Template HTML (titre, meta personnalisés)
│   ├── manifest.json     # PWA manifest (nom personnalisé)
│   └── ...               # Autres assets publics
└── src/
    ├── config/
    │   └── api.config.js  # Configuration API (dev/prod)
    └── ...
```

---

**Date** : 5 Décembre 2024
**Version** : 1.0.0
**Status** : ✅ Prêt pour production
