# 📧 PLAN D'IMPLÉMENTATION: IMAP/SMTP EMAIL INTEGRATION

**Date**: 11 Décembre 2025
**Objectif**: Étendre le système de messagerie pour supporter tous les fournisseurs d'email (Gmail, Yahoo, ProtonMail, etc.) via IMAP/SMTP

---

## 🎯 VISION GLOBALE

### Actuellement
- ✅ Microsoft Outlook Email via OAuth2 (fonctionne parfaitement)

### Objectif
- ✅ Microsoft Outlook Email via OAuth2 (comportement existant)
- 🆕 **Autres Emails** via IMAP/SMTP (Gmail, Yahoo, ProtonMail, Custom, etc.)

### Expérience Utilisateur

**Page Integrations:**
```
┌─────────────────────────────────────────────────────┐
│  📧 Email                                           │
│  ─────────────────────────────────────────────────  │
│  Status: Not Connected                              │
│  [Connect Email] ←── Click here                     │
└─────────────────────────────────────────────────────┘
```

**Modal de Sélection du Type d'Email:**
```
┌─────────────────────────────────────────────────────┐
│  Choose Your Email Provider                         │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────┐        │
│  │  🔵 Outlook      │  │  📧 Other Email  │        │
│  │  Microsoft 365   │  │  Gmail, Yahoo... │        │
│  │  OAuth2          │  │  IMAP/SMTP       │        │
│  │  [Connect]       │  │  [Configure]     │        │
│  └──────────────────┘  └──────────────────┘        │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Formulaire IMAP/SMTP (si "Other Email" est choisi):**
```
┌─────────────────────────────────────────────────────┐
│  Configure IMAP/SMTP Email                          │
│  ─────────────────────────────────────────────────  │
│                                                      │
│  Email Address *                                     │
│  [user@gmail.com                            ]       │
│                                                      │
│  Provider (Auto-detect or Custom)                   │
│  [▼ Gmail                                   ]       │
│     - Gmail                                          │
│     - Yahoo Mail                                     │
│     - Outlook.com (IMAP)                             │
│     - ProtonMail                                     │
│     - Custom (Manual Configuration)                  │
│                                                      │
│  Password / App Password *                           │
│  [••••••••••••••                            ]       │
│  ℹ️  Use App Password for Gmail (2FA required)     │
│                                                      │
│  ─── Advanced Settings (Auto-filled) ───            │
│                                                      │
│  IMAP Server:     imap.gmail.com                     │
│  IMAP Port:       993                                │
│  IMAP Security:   SSL/TLS                            │
│                                                      │
│  SMTP Server:     smtp.gmail.com                     │
│  SMTP Port:       587                                │
│  SMTP Security:   STARTTLS                           │
│                                                      │
│  [Test Connection]  [Cancel]  [Save & Sync]         │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## ❓ QUESTIONS À CLARIFIER (ZONES D'OMBRES)

> **IMPORTANT**: Ces questions doivent être résolues avant de commencer l'implémentation pour éviter des retours en arrière coûteux.

### 1. 🔢 Support Multi-Comptes Email

**Question**: Un utilisateur peut-il connecter **plusieurs comptes email** simultanément?

**Options**:
- **Option A**: Un seul compte email à la fois (Outlook OU IMAP/SMTP, mais pas les deux)
  - Si l'utilisateur change de provider, il doit déconnecter l'ancien
  - Plus simple à implémenter
  - Modèle User actuel compatible

- **Option B**: Plusieurs comptes simultanés (Outlook + Gmail + Yahoo en même temps)
  - L'utilisateur peut connecter autant de comptes qu'il veut
  - Nécessite une structure de données différente (array de comptes)
  - Plus complexe mais plus flexible
  - Affichage: emails mélangés ou séparés par compte?

**Impact technique**:
- Option A: Utiliser `emailConfig.activeProvider` (déjà dans le plan)
- Option B: Modifier User.js pour avoir `emailAccounts: []` au lieu de `emailConfig: {}`

**Votre choix**: [ ] A ou [ ] B

---

### 2. 🔄 Migration des Utilisateurs Outlook Existants

**Question**: Pour les utilisateurs qui ont **déjà connecté Outlook via OAuth2**, que peut-on faire?

**Options**:
- **Option A**: Ils restent sur OAuth2 Outlook uniquement (pas de changement possible)
- **Option B**: Ils peuvent **ajouter** un compte IMAP/SMTP en plus de Outlook (si multi-comptes activé)
- **Option C**: Ils peuvent **basculer** de OAuth2 vers IMAP/SMTP pour Outlook
- **Option D**: Ils peuvent faire les deux (basculer OU ajouter)

**Note**: Si vous choisissez multi-comptes (Question 1 - Option B), alors Option B est logique ici.

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 3. 📤 Envoi d'Emails (SMTP)

**Question**: L'intégration IMAP/SMTP doit-elle supporter l'**envoi d'emails** (SMTP)?

**Options**:
- **Option A**: Lecture seule (IMAP uniquement)
  - L'utilisateur peut voir ses emails reçus
  - Pas d'envoi depuis l'application
  - Plus simple, moins de risques

- **Option B**: Lecture + Envoi (IMAP + SMTP)
  - L'utilisateur peut envoyer des réponses depuis l'app
  - Nécessite une interface d'envoi d'emails
  - Plus complexe mais plus complet

**Impact technique**:
- Option A: Utiliser uniquement `node-imap`
- Option B: Utiliser `node-imap` + `nodemailer` (déjà dans le plan)

**Note**: Pour Outlook OAuth2, l'envoi est-il déjà supporté actuellement?

**Votre choix**: [ ] A ou [ ] B

---

### 4. 📆 Stratégie de Synchronisation Initiale

**Question**: Lors de la **première connexion IMAP**, combien d'emails synchroniser?

**Options**:
- **Option A**: Tous les emails depuis le début
  - Avantage: Historique complet
  - Inconvénient: Peut prendre des heures, gros volume

- **Option B**: 30 derniers jours uniquement
  - Avantage: Rapide, volume raisonnable
  - Inconvénient: Pas d'historique ancien

- **Option C**: 7 derniers jours uniquement
  - Avantage: Très rapide
  - Inconvénient: Historique très limité

- **Option D**: Laisser l'utilisateur choisir (modal avec slider)
  - Avantage: Flexible
  - Inconvénient: Plus complexe

**Note**: Pour les synchronisations suivantes (cron), on ne récupère que les nouveaux emails.

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 5. 🥇 Priorité des Fournisseurs

**Question**: Quel fournisseur email implémenter en **premier** (MVP)?

**Options**:
- **Option A**: Gmail seulement (80% des utilisateurs)
  - Configuration pré-remplie pour Gmail
  - Guide App Password pour Gmail
  - Déploiement rapide

- **Option B**: Gmail + Yahoo (couvre 90% des utilisateurs)
  - 2 configurations pré-remplies
  - 2 guides App Password

- **Option C**: Gmail + Yahoo + Configuration Custom
  - Permet tous les providers d'un coup
  - Plus flexible mais UX moins guidée

- **Option D**: Configuration Custom uniquement (universel dès le départ)
  - Fonctionne pour tout
  - Mais nécessite connaissances techniques de l'utilisateur

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 6. 📎 Gestion des Pièces Jointes

**Question**: Comment gérer les **pièces jointes** des emails IMAP/SMTP?

**Options**:
- **Option A**: Télécharger et stocker dans MongoDB/GridFS
  - Avantage: Accès rapide, disponible même si email supprimé du serveur
  - Inconvénient: Espace disque, coûts de stockage

- **Option B**: Télécharger et stocker dans Azure Blob Storage
  - Avantage: Scalable, pas de limite de taille
  - Inconvénient: Coûts Azure

- **Option C**: Lien uniquement (pas de téléchargement)
  - Avantage: Pas de stockage
  - Inconvénient: Fichier perdu si supprimé du serveur

- **Option D**: Téléchargement à la demande (quand l'utilisateur clique)
  - Avantage: Balance entre A et C
  - Inconvénient: Complexité moyenne

**Note**: Comment gérez-vous actuellement les attachments Outlook?

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 7. ⏱️ Fréquence de Synchronisation

**Question**: Quelle **fréquence de synchronisation** automatique pour IMAP/SMTP?

**Options**:
- **Option A**: Toutes les 5 minutes (quasi temps réel)
  - Avantage: Très réactif
  - Inconvénient: Charge serveur élevée

- **Option B**: Toutes les 10 minutes (le plan suggère ceci)
  - Avantage: Bon équilibre
  - Inconvénient: Délai acceptable pour emails

- **Option C**: Toutes les 15-30 minutes
  - Avantage: Moins de charge
  - Inconvénient: Moins réactif

- **Option D**: Configurable par l'utilisateur (5/10/15/30 min)
  - Avantage: Flexible
  - Inconvénient: Plus complexe

**Note**: Quelle est la fréquence actuelle pour Outlook?

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 8. 🔐 Sécurité des Mots de Passe

**Question**: Le plan propose **AES-256** pour chiffrer les mots de passe IMAP/SMTP. Est-ce suffisant?

**Options**:
- **Option A**: AES-256 avec clé dans .env (le plan actuel)
  - Avantage: Simple, rapide
  - Inconvénient: Si .env compromis, tous les mots de passe le sont

- **Option B**: AES-256 + Azure Key Vault (clé stockée dans Azure)
  - Avantage: Très sécurisé, rotation automatique des clés
  - Inconvénient: Dépendance Azure, coûts

- **Option C**: Encourager OAuth2 pour Gmail/Yahoo (éviter mots de passe)
  - Avantage: Pas de stockage de mot de passe
  - Inconvénient: Complexité OAuth pour chaque provider

- **Option D**: Combinaison A + rotation manuelle des clés

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 9. 🔔 Notifications d'Erreurs de Synchronisation

**Question**: Comment notifier l'utilisateur quand la **synchronisation échoue**?

**Scénarios d'erreur**:
- Mot de passe changé/invalide
- Serveur IMAP indisponible
- Quota dépassé
- Connexion réseau perdue

**Options**:
- **Option A**: Notification in-app uniquement (badge rouge sur Integrations)
- **Option B**: Notification email à l'utilisateur
- **Option C**: Notification in-app + email
- **Option D**: Notification in-app + alerte pour Admin/UpperAdmin du tenant

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 10. 📂 Gestion des Dossiers Email

**Question**: Quels **dossiers email** synchroniser?

**Options**:
- **Option A**: INBOX uniquement
  - Avantage: Simple, clair
  - Inconvénient: Pas de Sent, Spam, etc.

- **Option B**: INBOX + Sent (emails envoyés)
  - Avantage: Historique complet des conversations
  - Inconvénient: Plus de données

- **Option C**: Tous les dossiers (INBOX, Sent, Spam, Drafts, Custom)
  - Avantage: Copie complète de la boîte mail
  - Inconvénient: Volume énorme, complexité

- **Option D**: Laisser l'utilisateur choisir (checkboxes dans le formulaire)
  - Avantage: Flexible
  - Inconvénient: UX plus complexe

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

### 11. 🤖 Analyse IA (Grok) pour IMAP/SMTP

**Question**: L'analyse IA Grok doit-elle s'appliquer **automatiquement** aux emails IMAP/SMTP?

**Options**:
- **Option A**: Oui, analyse automatique comme pour Outlook
  - Tous les emails IMAP/SMTP sont analysés par Grok
  - Cohérence avec le comportement Outlook

- **Option B**: Non, analyse désactivée par défaut (activable manuellement)
  - L'utilisateur décide s'il veut l'analyse IA
  - Économise les crédits API Grok

- **Option C**: Paramètre par compte email
  - Chaque compte peut activer/désactiver l'analyse IA
  - Maximum de flexibilité

**Note**: Y a-t-il des limites de crédits API Grok? Coûts par analyse?

**Votre choix**: [ ] A, [ ] B ou [ ] C

---

### 12. 🖥️ Interface Formulaire IMAP/SMTP

**Question**: Le formulaire de configuration doit-il avoir des **presets automatiques**?

**Options**:
- **Option A**: Dropdown avec presets (Gmail, Yahoo, Outlook, ProtonMail, Custom)
  - Sélectionne Gmail → Auto-remplit imap.gmail.com:993, smtp.gmail.com:587
  - UX simple, guidée
  - Déjà dans le plan

- **Option B**: Formulaire manuel complet (pas de presets)
  - L'utilisateur remplit tout manuellement
  - Plus flexible mais nécessite connaissances techniques

- **Option C**: Détection automatique basée sur l'email
  - Utilisateur entre "john@gmail.com" → App détecte Gmail et remplit auto
  - UX la plus simple
  - Nécessite une base de données de domaines

**Note**: Le plan suggère Option A. Confirmation?

**Votre choix**: [ ] A, [ ] B ou [ ] C

---

### 13. 🎨 Affichage des Communications (Si Multi-Comptes)

**Question** (seulement si Question 1 = Option B): Comment afficher les emails de **plusieurs comptes**?

**Options**:
- **Option A**: Tout mélangé (vue unifiée)
  - Tous les emails de tous les comptes dans une seule liste
  - Avec un tag "Gmail", "Outlook", etc. pour identifier la source

- **Option B**: Onglets par compte
  - Tab "Outlook" | Tab "Gmail" | Tab "Yahoo"
  - Permet de filtrer par compte

- **Option C**: Filtre dropdown
  - "All Accounts" | "Outlook" | "Gmail" | "Yahoo"
  - Flexible

**Votre choix**: [ ] A, [ ] B ou [ ] C

---

### 14. 🔧 Bouton "Test Connection" dans le Formulaire

**Question**: Le formulaire IMAP/SMTP doit-il avoir un bouton **"Test Connection"** avant de sauvegarder?

**Options**:
- **Option A**: Oui, test obligatoire avant sauvegarde (le plan suggère ceci)
  - Utilisateur clique "Test Connection" → Si succès, bouton "Save" s'active
  - Empêche les mauvaises configurations

- **Option B**: Non, sauvegarde directe avec validation backend
  - Utilisateur clique "Save" → Backend teste et retourne erreur si échec
  - Plus rapide mais moins guidé

- **Option C**: Test optionnel
  - Bouton "Test Connection" disponible mais pas obligatoire
  - "Save" possible sans test

**Votre choix**: [ ] A, [ ] B ou [ ] C

---

### 15. 📅 Timeline d'Implémentation

**Question**: Quelle est la **priorité** de cette fonctionnalité?

**Options**:
- **Option A**: Urgent - À déployer cette semaine
  - Implémentation rapide (MVP uniquement)
  - Gmail + Configuration Custom
  - Tests minimaux

- **Option B**: Important - 1-2 semaines
  - Implémentation complète selon le plan (6 phases)
  - Gmail + Yahoo + Custom
  - Tests complets

- **Option C**: Normal - 2-4 semaines
  - Implémentation soignée avec tous les edge cases
  - Tous les providers
  - Documentation complète

- **Option D**: Backlog - Quand le temps le permet

**Votre choix**: [ ] A, [ ] B, [ ] C ou [ ] D

---

## 📝 RÉSUMÉ DES DÉCISIONS REQUISES

Merci de remplir ce tableau avec vos choix:

| # | Question | Votre Choix |
|---|----------|-------------|
| 1 | Multi-comptes email | [ ] A ou [ ] B |
| 2 | Migration utilisateurs Outlook | [ ] A, [ ] B, [ ] C ou [ ] D |
| 3 | Envoi d'emails (SMTP) | [ ] A ou [ ] B |
| 4 | Synchronisation initiale | [ ] A, [ ] B, [ ] C ou [ ] D |
| 5 | Priorité fournisseurs | [ ] A, [ ] B, [ ] C ou [ ] D |
| 6 | Pièces jointes | [ ] A, [ ] B, [ ] C ou [ ] D |
| 7 | Fréquence de sync | [ ] A, [ ] B, [ ] C ou [ ] D |
| 8 | Sécurité mots de passe | [ ] A, [ ] B, [ ] C ou [ ] D |
| 9 | Notifications d'erreurs | [ ] A, [ ] B, [ ] C ou [ ] D |
| 10 | Dossiers email | [ ] A, [ ] B, [ ] C ou [ ] D |
| 11 | Analyse IA Grok | [ ] A, [ ] B ou [ ] C |
| 12 | Interface formulaire | [ ] A, [ ] B ou [ ] C |
| 13 | Affichage multi-comptes (si applicable) | [ ] A, [ ] B ou [ ] C |
| 14 | Bouton Test Connection | [ ] A, [ ] B ou [ ] C |
| 15 | Timeline | [ ] A, [ ] B, [ ] C ou [ ] D |

**Une fois ces questions résolues, l'implémentation pourra commencer sans ambiguïté! 🚀**

---

## 📋 ARCHITECTURE TECHNIQUE

### 1. MODIFICATIONS DU MODÈLE USER

**Fichier**: `backend/src/models/User.js`

**Ajout d'un nouveau champ `emailConfig`:**

```javascript
// Configuration Email Générique (IMAP/SMTP ou Outlook)
emailConfig: {
  // Type de connexion
  provider: {
    type: String,
    enum: ['outlook', 'imap_smtp'],
    default: null
  },

  // Pour Outlook OAuth2 (existant, renommé)
  outlook: {
    accessToken: { type: String, default: null, select: false },
    refreshToken: { type: String, default: null, select: false },
    expiry: { type: Date, default: null },
    isConnected: { type: Boolean, default: false },
    lastSyncDate: { type: Date, default: null },
    linkedEmail: { type: String, default: null }
  },

  // Pour IMAP/SMTP (nouveau)
  imapSmtp: {
    // Informations du compte
    email: { type: String, default: null },

    // Credentials (ENCRYPTED!)
    password: { type: String, default: null, select: false },

    // Configuration IMAP
    imapHost: { type: String, default: null },
    imapPort: { type: Number, default: 993 },
    imapSecure: { type: Boolean, default: true }, // SSL/TLS

    // Configuration SMTP
    smtpHost: { type: String, default: null },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false }, // STARTTLS

    // Métadonnées
    providerName: {
      type: String,
      enum: ['gmail', 'yahoo', 'outlook_imap', 'protonmail', 'custom'],
      default: 'custom'
    },
    isConnected: { type: Boolean, default: false },
    lastSyncDate: { type: Date, default: null },
    lastMailboxCheck: { type: Date, default: null }
  },

  // Champ commun pour savoir quel type est actif
  activeProvider: {
    type: String,
    enum: ['outlook', 'imap_smtp', null],
    default: null
  }
}
```

**Note de Sécurité**: Le mot de passe IMAP/SMTP doit être **CHIFFRÉ** en base de données.

---

### 2. PACKAGES NPM REQUIS

**Installation:**
```bash
cd backend
npm install node-imap mailparser nodemailer imap-simple
npm install dotenv-vault crypto-js  # Pour chiffrement
```

**Packages:**
- `node-imap`: Lecture emails via IMAP
- `mailparser`: Parser les emails
- `nodemailer`: Envoi emails via SMTP
- `imap-simple`: Wrapper simplifié pour IMAP
- `crypto-js`: Chiffrement des mots de passe

---

### 3. SERVICE IMAP/SMTP

**Fichier**: `backend/src/services/imapSmtpService.js` (NOUVEAU)

**Fonctionnalités:**

```javascript
class ImapSmtpService {

  // 1. Tester la connexion IMAP/SMTP
  async testConnection(config) {
    // Test IMAP
    // Test SMTP
    // Retourne success/error
  }

  // 2. Récupérer les emails non lus
  async fetchUnreadEmails(userId) {
    // Connexion IMAP
    // Récupération des emails
    // Parsing
    // Sauvegarde en base (Communication)
  }

  // 3. Récupérer tous les emails depuis une date
  async syncEmailsSince(userId, sinceDate) {
    // Synchronisation massive
  }

  // 4. Envoyer un email via SMTP
  async sendEmail(userId, emailData) {
    // Connexion SMTP
    // Envoi
  }

  // 5. Marquer un email comme lu
  async markAsRead(userId, emailId) {
    // Update via IMAP
  }

  // 6. Récupérer les configurations par défaut
  static getProviderConfig(providerName) {
    // Retourne config pour Gmail, Yahoo, etc.
  }
}
```

**Configurations Pré-définies:**

```javascript
const PROVIDER_CONFIGS = {
  gmail: {
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true,
    setupGuide: 'https://support.google.com/accounts/answer/185833'
  },
  yahoo: {
    imapHost: 'imap.mail.yahoo.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    smtpSecure: false,
    requiresAppPassword: true
  },
  outlook_imap: {
    imapHost: 'outlook.office365.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false
  },
  protonmail: {
    imapHost: '127.0.0.1', // ProtonMail Bridge local
    imapPort: 1143,
    imapSecure: false,
    smtpHost: '127.0.0.1',
    smtpPort: 1025,
    smtpSecure: false,
    requiresBridge: true
  }
};
```

---

### 4. ENCRYPTION SERVICE

**Fichier**: `backend/src/services/encryptionService.js` (NOUVEAU)

**Chiffrement des mots de passe:**

```javascript
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.ENCRYPTION_SECRET;

exports.encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

exports.decrypt = (encryptedText) => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

**Variable d'environnement:**
```env
ENCRYPTION_SECRET=your-super-secret-encryption-key-change-in-production
```

---

### 5. CONTROLLER EMAIL

**Fichier**: `backend/src/controllers/emailController.js` (NOUVEAU)

**Routes:**

```javascript
// Récupérer les configurations disponibles
exports.getProviderConfigs = async (req, res) => {
  // Retourne la liste des providers (Gmail, Yahoo, etc.)
};

// Configuration IMAP/SMTP
exports.configureImapSmtp = async (req, res) => {
  const { email, password, providerName, customConfig } = req.body;

  // 1. Validation
  // 2. Récupération de la config (ou utiliser customConfig)
  // 3. Test de connexion
  // 4. Si succès: Chiffrer le mot de passe
  // 5. Sauvegarder dans User.emailConfig.imapSmtp
  // 6. Lancer la première synchronisation
};

// Tester la connexion
exports.testImapSmtpConnection = async (req, res) => {
  // Test sans sauvegarder
};

// Déconnecter IMAP/SMTP
exports.disconnectImapSmtp = async (req, res) => {
  // Supprimer les credentials
};

// Obtenir les statistiques
exports.getEmailStats = async (req, res) => {
  // Retourne les stats (commun Outlook + IMAP/SMTP)
};

// Synchroniser manuellement
exports.syncEmails = async (req, res) => {
  // Lance une synchro manuelle
};
```

---

### 6. ROUTES

**Fichier**: `backend/src/routes/emailRoutes.js` (NOUVEAU)

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const emailController = require('../controllers/emailController');

// Toutes les routes sont protégées
router.use(protect);

// Configurations disponibles
router.get('/providers', emailController.getProviderConfigs);

// IMAP/SMTP
router.post('/imap-smtp/configure', emailController.configureImapSmtp);
router.post('/imap-smtp/test', emailController.testImapSmtpConnection);
router.delete('/imap-smtp/disconnect', emailController.disconnectImapSmtp);

// Statistiques (commun)
router.get('/stats', emailController.getEmailStats);

// Synchronisation
router.post('/sync', emailController.syncEmails);

module.exports = router;
```

**Monter dans server.js:**
```javascript
app.use('/api/email', require('./src/routes/emailRoutes'));
```

---

### 7. CRON JOB - SYNCHRONISATION AUTOMATIQUE

**Fichier**: `backend/src/services/emailSyncCron.js` (NOUVEAU)

**Logique:**

```javascript
const cron = require('node-cron');
const User = require('../models/User');
const outlookSyncService = require('./outlookSyncService');
const imapSmtpService = require('./imapSmtpService');

// Toutes les 10 minutes
exports.startEmailSyncCron = () => {
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Email Sync Cron Job Started...');

    try {
      // Récupérer tous les utilisateurs avec email connecté
      const users = await User.find({
        $or: [
          { 'emailConfig.outlook.isConnected': true },
          { 'emailConfig.imapSmtp.isConnected': true }
        ]
      });

      for (const user of users) {
        if (user.emailConfig?.activeProvider === 'outlook') {
          // Synchro Outlook
          await outlookSyncService.syncUserEmails(user._id);
        } else if (user.emailConfig?.activeProvider === 'imap_smtp') {
          // Synchro IMAP/SMTP
          await imapSmtpService.fetchUnreadEmails(user._id);
        }
      }

      console.log('✅ Email Sync Completed');
    } catch (error) {
      console.error('❌ Email Sync Error:', error);
    }
  });
};
```

---

### 8. FRONTEND - MODIFICATIONS

#### 8.1 Page Integrations

**Fichier**: `frontend/src/pages/Integrations.js`

**Changements:**

1. **Renommer** "Microsoft Outlook Email" → **"Email"**
2. **Ajouter un modal** de sélection du type (Outlook vs IMAP/SMTP)
3. **Ajouter le formulaire** IMAP/SMTP

**Structure:**

```javascript
const [emailModalType, setEmailModalType] = useState(null); // 'outlook' | 'imap_smtp'
const [showEmailTypeModal, setShowEmailTypeModal] = useState(false);
const [showImapSmtpForm, setShowImapSmtpForm] = useState(false);

const [imapSmtpForm, setImapSmtpForm] = useState({
  email: '',
  password: '',
  provider: 'gmail',
  // Custom config (si provider = 'custom')
  imapHost: '',
  imapPort: 993,
  smtpHost: '',
  smtpPort: 587
});
```

**Flux:**

```javascript
// Clic sur "Connect Email"
const handleConnectEmail = () => {
  setShowEmailTypeModal(true);
};

// Choix du type
const handleChooseEmailType = (type) => {
  setShowEmailTypeModal(false);

  if (type === 'outlook') {
    // Comportement existant
    handleConnectOutlook();
  } else if (type === 'imap_smtp') {
    setShowImapSmtpForm(true);
  }
};

// Soumission IMAP/SMTP
const handleConfigureImapSmtp = async (e) => {
  e.preventDefault();

  // 1. Test de connexion
  const testResponse = await axios.post(`${API_URL}/email/imap-smtp/test`, imapSmtpForm);

  if (testResponse.data.success) {
    // 2. Sauvegarder la configuration
    const configResponse = await axios.post(`${API_URL}/email/imap-smtp/configure`, imapSmtpForm);

    if (configResponse.data.success) {
      alert('Email configuré avec succès!');
      fetchEmailStats();
      setShowImapSmtpForm(false);
    }
  } else {
    alert('Connexion échouée: ' + testResponse.data.message);
  }
};
```

#### 8.2 Composant EmailTypeModal

**Fichier**: `frontend/src/components/EmailTypeModal.js` (NOUVEAU)

```javascript
function EmailTypeModal({ onClose, onChoose }) {
  return (
    <div className="modal-overlay">
      <div className="email-type-modal">
        <h2>Choose Your Email Provider</h2>

        <div className="provider-options">
          <div className="provider-card" onClick={() => onChoose('outlook')}>
            <div className="provider-icon outlook">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h3>Microsoft Outlook</h3>
            <p>Office 365, Outlook.com</p>
            <span className="auth-type">OAuth2</span>
            <button className="btn-primary">Connect</button>
          </div>

          <div className="provider-card" onClick={() => onChoose('imap_smtp')}>
            <div className="provider-icon generic">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <h3>Other Email</h3>
            <p>Gmail, Yahoo, ProtonMail...</p>
            <span className="auth-type">IMAP/SMTP</span>
            <button className="btn-primary">Configure</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 8.3 Composant ImapSmtpForm

**Fichier**: `frontend/src/components/ImapSmtpForm.js` (NOUVEAU)

**Formulaire complet avec:**
- Sélection du provider (Gmail, Yahoo, etc.)
- Auto-remplissage des configurations
- Champs custom pour "Custom"
- Bouton "Test Connection"
- Guide pour App Password (Gmail)

---

## 🔐 SÉCURITÉ

### 1. Chiffrement des Mots de Passe

**IMPORTANT**: Ne JAMAIS stocker les mots de passe en clair!

- ✅ Chiffrer avec `crypto-js` (AES-256)
- ✅ Clé secrète dans `.env`
- ✅ `select: false` sur le champ password

### 2. Validation

- Validation email format
- Test de connexion AVANT sauvegarde
- Gestion des erreurs (mauvais mot de passe, etc.)

### 3. Rate Limiting

- Limiter les tentatives de connexion IMAP/SMTP
- Éviter les brute force

---

## 📊 MODIFICATIONS DU MODÈLE COMMUNICATION

**Aucune modification majeure nécessaire!**

Le champ `source` supporte déjà `"Outlook"`. Il suffit d'ajouter:

```javascript
source: {
  type: String,
  enum: ['Outlook', 'WhatsApp', 'IMAP/SMTP'], // ← Ajout
  required: true
}
```

Ou mieux, utiliser le nom du provider:

```javascript
source: {
  type: String,
  enum: ['Outlook', 'WhatsApp', 'Gmail', 'Yahoo', 'IMAP/SMTP'], // ← Plus spécifique
  required: true
}
```

---

## 🗂️ STRUCTURE DES FICHIERS

### Backend (Nouveaux Fichiers)

```
backend/
├── src/
│   ├── services/
│   │   ├── imapSmtpService.js          ← NOUVEAU
│   │   ├── encryptionService.js        ← NOUVEAU
│   │   ├── emailSyncCron.js            ← NOUVEAU
│   │   └── outlookSyncService.js       (existant)
│   ├── controllers/
│   │   ├── emailController.js          ← NOUVEAU
│   │   └── outlookController.js        (existant)
│   ├── routes/
│   │   ├── emailRoutes.js              ← NOUVEAU
│   │   └── outlookRoutes.js            (existant)
│   └── models/
│       └── User.js                     (modifier)
```

### Frontend (Nouveaux Fichiers)

```
frontend/
├── src/
│   ├── components/
│   │   ├── EmailTypeModal.js           ← NOUVEAU
│   │   ├── ImapSmtpForm.js             ← NOUVEAU
│   │   └── ProviderGuide.js            ← NOUVEAU (optionnel)
│   ├── pages/
│   │   └── Integrations.js             (modifier)
│   └── styles/
│       ├── EmailTypeModal.css          ← NOUVEAU
│       └── ImapSmtpForm.css            ← NOUVEAU
```

---

## 📝 CHECKLIST D'IMPLÉMENTATION

### Phase 1: Backend Infrastructure (Jour 1-2)

- [ ] **1.1** Installer les packages NPM (imap, nodemailer, crypto-js)
- [ ] **1.2** Créer `encryptionService.js`
- [ ] **1.3** Modifier le modèle `User.js` (ajouter `emailConfig`)
- [ ] **1.4** Créer `imapSmtpService.js` (fonctions de base)
- [ ] **1.5** Tester connexion IMAP/SMTP manuellement

### Phase 2: API Endpoints (Jour 2-3)

- [ ] **2.1** Créer `emailController.js`
- [ ] **2.2** Créer `emailRoutes.js`
- [ ] **2.3** Monter les routes dans `server.js`
- [ ] **2.4** Tester les endpoints avec Postman

### Phase 3: Frontend - Modal & Formulaire (Jour 3-4)

- [ ] **3.1** Renommer "Microsoft Outlook Email" → "Email"
- [ ] **3.2** Créer `EmailTypeModal.js`
- [ ] **3.3** Créer `ImapSmtpForm.js`
- [ ] **3.4** Modifier `Integrations.js` pour intégrer les modals
- [ ] **3.5** Créer les styles CSS

### Phase 4: Synchronisation (Jour 4-5)

- [ ] **4.1** Implémenter `fetchUnreadEmails()` dans `imapSmtpService`
- [ ] **4.2** Implémenter `syncEmailsSince()` dans `imapSmtpService`
- [ ] **4.3** Créer `emailSyncCron.js`
- [ ] **4.4** Intégrer le cron job dans `server.js`
- [ ] **4.5** Tester la synchronisation complète

### Phase 5: Intégration IA (Jour 5)

- [ ] **5.1** Modifier `imapSmtpService` pour appeler Grok AI
- [ ] **5.2** Tester l'analyse automatique des emails IMAP/SMTP

### Phase 6: Tests & Documentation (Jour 6)

- [ ] **6.1** Tests unitaires
- [ ] **6.2** Tests d'intégration
- [ ] **6.3** Documentation utilisateur (guide Gmail App Password)
- [ ] **6.4** Mise à jour de `TEST_CREDENTIALS.txt`

---

## 🌟 GUIDES UTILISATEURS À PRÉVOIR

### Guide Gmail App Password

**Fichier**: `frontend/src/guides/GmailAppPasswordGuide.md`

**Contenu:**
1. Activer 2FA sur Google Account
2. Aller dans Paramètres → Sécurité → App Passwords
3. Créer un mot de passe d'application
4. Utiliser ce mot de passe dans le formulaire

### Guide Yahoo App Password

**Similaire à Gmail**

---

## 🎯 PRIORITÉS

### Must Have (Phase 1)
1. ✅ Support Gmail (le plus utilisé)
2. ✅ Support Yahoo
3. ✅ Configuration custom (pour autres providers)

### Nice to Have (Phase 2)
1. ProtonMail Bridge support
2. Multi-comptes (plusieurs emails IMAP/SMTP par user)
3. Filtres avancés (dossiers, labels)

---

## 💡 NOTES IMPORTANTES

### 1. Différence Outlook OAuth2 vs IMAP/SMTP

**Outlook OAuth2 (existant):**
- ✅ Pas de mot de passe stocké
- ✅ Token refresh automatique
- ✅ Plus sécurisé
- ❌ Uniquement Microsoft

**IMAP/SMTP (nouveau):**
- ✅ Fonctionne avec TOUS les providers
- ✅ Configuration flexible
- ❌ Nécessite stockage du mot de passe (chiffré)
- ❌ Requiert App Password (Gmail, Yahoo)

### 2. Limitations IMAP/SMTP

- **Gmail**: Max 2 500 emails/jour
- **Yahoo**: Max 500 emails/jour
- **Rate Limiting**: Respecter les limites des providers

### 3. Performances

- Utiliser `IMAP IDLE` pour push notifications (optionnel)
- Limiter la synchronisation initiale (ex: 30 derniers jours)
- Pagination pour grands volumes

---

## 📞 SUPPORT

En cas de problème:
1. Vérifier les logs backend
2. Vérifier que le mot de passe d'application est correct
3. Vérifier que le firewall n'est pas bloquant
4. Tester la connexion manuellement avec Telnet

---

## 🎉 RÉSULTAT FINAL

**L'utilisateur pourra:**
1. Connecter son **Outlook** via OAuth2 (comme avant)
2. Connecter son **Gmail** via IMAP/SMTP
3. Connecter son **Yahoo** via IMAP/SMTP
4. Connecter **n'importe quel email** avec config custom
5. Voir tous ses emails dans l'interface unifiée
6. Bénéficier de l'analyse IA Grok sur TOUS les emails

**L'application devient vraiment universelle! 🚀**

---

**FIN DU PLAN**
