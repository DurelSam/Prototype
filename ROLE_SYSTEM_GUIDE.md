# Guide du Système de Rôles - SaaS Multi-Tenant

## 📋 Vue d'ensemble

Le système utilise 4 niveaux de rôles hiérarchiques pour gérer les permissions et les accès dans l'application SaaS multi-tenant.

---

## 🎯 Hiérarchie des Rôles

### 1. SuperUser (Propriétaires du SaaS)
**Niveau**: Le plus élevé
**Nombre**: Illimité (mais généralement 1-3)
**Lié à une entreprise**: ❌ NON

#### Permissions
- ✅ Accès TOTAL à toutes les fonctionnalités
- ✅ Gérer toutes les entreprises (tenants)
- ✅ Créer, modifier, supprimer des UpperAdmin
- ✅ Créer, modifier, supprimer des Admin
- ✅ Créer, modifier, supprimer des Employee
- ✅ Voir toutes les données de toutes les entreprises
- ✅ Configurer les paramètres globaux du système
- ✅ Gérer les abonnements et la facturation
- ✅ Accès aux statistiques globales

#### Comment créer
Le SuperUser ne peut PAS être créé via l'interface d'inscription.
```bash
cd backend
npm run seed-superuser
```

#### Credentials par défaut
```
Email: durelsam157@gmail.com
Password: thursday
```
⚠️ Ces credentials sont sauvegardés dans `SUPERUSER_CREDENTIALS.txt`

---

### 2. UpperAdmin (Admin Principal d'une entreprise)
**Niveau**: Élevé (entreprise)
**Nombre**: UN SEUL par entreprise
**Lié à une entreprise**: ✅ OUI (obligatoire)

#### Permissions
- ✅ Gestion complète de SON entreprise
- ✅ Créer et gérer les Admin de son entreprise
- ✅ Créer et gérer les Employee de son entreprise
- ✅ Accès à toutes les données de son entreprise
- ✅ Configurer les paramètres de l'entreprise
- ✅ Gérer l'abonnement de l'entreprise
- ✅ Voir les statistiques de l'entreprise
- ❌ Pas d'accès aux autres entreprises
- ❌ Ne peut pas créer d'autres UpperAdmin

#### Comment créer
- Via l'interface d'inscription (Register) en sélectionnant "Upper Admin (Company Owner)"
- Ou par un SuperUser via l'interface d'administration

#### Règle importante
⚠️ Il ne peut y avoir qu'un seul UpperAdmin par entreprise. Si vous essayez d'en créer un deuxième, une erreur sera levée.

---

### 3. Admin (Administrateurs d'une entreprise)
**Niveau**: Moyen (entreprise)
**Nombre**: ILLIMITÉ par entreprise
**Lié à une entreprise**: ✅ OUI (obligatoire)

#### Permissions
- ✅ Créer et gérer les Employee de son entreprise
- ✅ Voir les données de son entreprise
- ✅ Gérer les communications de l'entreprise
- ✅ Configurer les intégrations (Outlook, WhatsApp)
- ✅ Voir les rapports et analyses de l'entreprise
- ❌ Ne peut pas créer d'autres Admin
- ❌ Ne peut pas modifier les paramètres de l'entreprise
- ❌ Pas d'accès aux autres entreprises

#### Comment créer
- Via l'interface d'inscription (Register) en sélectionnant "Admin"
- Ou par un UpperAdmin ou SuperUser via l'interface d'administration

---

### 4. Employee (Employés)
**Niveau**: Standard (entreprise)
**Nombre**: ILLIMITÉ par entreprise
**Lié à une entreprise**: ✅ OUI (obligatoire)

#### Permissions
- ✅ Voir ses propres communications
- ✅ Utiliser les fonctionnalités de base
- ✅ Connecter ses comptes Outlook/WhatsApp personnels
- ✅ Voir ses propres statistiques
- ❌ Ne peut pas créer d'autres utilisateurs
- ❌ Ne peut pas voir les données des autres employés
- ❌ Pas d'accès aux paramètres de l'entreprise
- ❌ Pas d'accès aux autres entreprises

#### Comment créer
- Via l'interface d'inscription (Register) en sélectionnant "Employee" (par défaut)
- Ou par un Admin, UpperAdmin ou SuperUser via l'interface d'administration

---

## 🗄️ Structure de la Base de Données

### Collection: users

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  role: String ('SuperUser' | 'UpperAdmin' | 'Admin' | 'Employee'),
  tenant_id: ObjectId (null pour SuperUser, requis pour les autres),
  firstName: String,
  lastName: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Validations automatiques
1. **Email unique**: Un même email ne peut pas être utilisé deux fois
2. **UpperAdmin unique par tenant**: Validation automatique dans le modèle
3. **Tenant_id**: Obligatoire sauf pour SuperUser
4. **Password**: Minimum 6 caractères

---

## 🔐 Authentification et Autorisations

### Token JWT Structure

```javascript
{
  userId: ObjectId,
  role: String,
  tenantId: ObjectId (seulement si l'utilisateur a un tenant)
}
```

### Vérifications lors de la connexion

1. **Compte actif**: `user.isActive === true`
2. **Abonnement valide**: Seulement pour les utilisateurs avec tenant (pas pour SuperUser)
3. **Credentials valides**: Email + Password correct

---

## 📝 Exemples d'Utilisation

### 1. Créer le SuperUser (première fois)

```bash
# Dans le terminal backend
cd backend
npm run seed-superuser
```

### 2. Se connecter comme SuperUser

```
URL: http://localhost:3000/login
Email: durelsam157@gmail.com
Password: thursday
```

### 3. Créer une entreprise avec UpperAdmin

```
URL: http://localhost:3000/register
Company Name: Mon Entreprise
Email: admin@monentreprise.com
Password: ********
Role: Upper Admin (Company Owner)
```

### 4. Créer un Admin pour l'entreprise

```
URL: http://localhost:3000/register
Company Name: Mon Entreprise (même nom)
Email: manager@monentreprise.com
Password: ********
Role: Admin
```

### 5. Créer un Employee

```
URL: http://localhost:3000/register
Company Name: Mon Entreprise (même nom)
Email: employee@monentreprise.com
Password: ********
Role: Employee
```

---

## 🛠️ Méthodes Utiles du Modèle User

```javascript
// Vérifier si c'est un SuperUser
user.isSuperUser()  // true/false

// Vérifier si c'est un UpperAdmin
user.isUpperAdmin()  // true/false

// Vérifier si c'est un Admin
user.isAdmin()  // true/false

// Vérifier si l'utilisateur a des droits d'administration
user.hasAdminRights()  // true pour SuperUser, UpperAdmin, Admin

// Obtenir le nom complet
user.getFullName()  // "John Doe" ou "email@example.com"
```

---

## 🔄 Flux de Données

### Inscription

```mermaid
User → Register Page → Backend API → Create Tenant (if new) → Create User → Send JWT Token
```

### Connexion

```mermaid
User → Login Page → Backend API → Validate Credentials → Check Subscription → Send JWT Token
```

---

## 🚨 Règles de Sécurité

### 1. Protection des Routes

Toutes les routes protégées vérifient:
- Token JWT valide
- Utilisateur actif
- Abonnement valide (sauf SuperUser)
- Permissions appropriées

### 2. Isolation des Données

- SuperUser: Voit TOUTES les données
- UpperAdmin/Admin/Employee: Voient UNIQUEMENT les données de leur `tenant_id`

### 3. Validation des Permissions

Avant toute action:
```javascript
// Exemple de vérification
if (user.role !== 'SuperUser' && user.tenant_id !== resource.tenant_id) {
  return res.status(403).json({ error: 'Accès non autorisé' });
}
```

---

## 📊 Matrice des Permissions

| Action                          | SuperUser | UpperAdmin | Admin | Employee |
|---------------------------------|-----------|------------|-------|----------|
| Voir toutes les entreprises     | ✅        | ❌         | ❌    | ❌       |
| Créer une entreprise            | ✅        | ❌         | ❌    | ❌       |
| Créer UpperAdmin                | ✅        | ❌         | ❌    | ❌       |
| Créer Admin                     | ✅        | ✅         | ❌    | ❌       |
| Créer Employee                  | ✅        | ✅         | ✅    | ❌       |
| Modifier paramètres entreprise  | ✅        | ✅         | ❌    | ❌       |
| Voir données de l'entreprise    | ✅        | ✅         | ✅    | ✅       |
| Gérer abonnement                | ✅        | ✅         | ❌    | ❌       |
| Voir stats globales             | ✅        | ❌         | ❌    | ❌       |
| Connecter Outlook/WhatsApp      | ✅        | ✅         | ✅    | ✅       |

---

## 🧪 Tests

### Vérifier la création du SuperUser

```bash
# Connexion à MongoDB
mongosh prototypedb

# Vérifier le SuperUser
db.users.findOne({ role: 'SuperUser' })
```

### Vérifier qu'il n'y a qu'un UpperAdmin par tenant

```bash
# Dans mongosh
db.users.aggregate([
  { $match: { role: 'UpperAdmin' } },
  { $group: { _id: '$tenant_id', count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
# Devrait retourner 0 résultat
```

---

## 📂 Fichiers Modifiés

1. **backend/src/models/User.js** - Modèle mis à jour avec 4 rôles
2. **backend/src/controllers/authController.js** - Logique d'authentification adaptée
3. **backend/seed-superuser.js** - Script de création du SuperUser
4. **frontend/src/pages/Register.js** - Options de rôles mises à jour
5. **SUPERUSER_CREDENTIALS.txt** - Credentials du SuperUser (NE PAS SUPPRIMER)

---

## ⚠️ Notes Importantes

1. **SuperUser ne peut pas être créé via l'interface web** - Utilisez `npm run seed-superuser`
2. **Un seul UpperAdmin par entreprise** - Validation automatique
3. **Credentials du SuperUser** - Sauvegardés dans SUPERUSER_CREDENTIALS.txt
4. **Changez le mot de passe en production** - "thursday" est un mot de passe de développement
5. **Activez 2FA en production** - Pour plus de sécurité

---

## 🔄 Migration depuis l'ancien système

Si vous avez des utilisateurs avec les anciens rôles (Manager):

```javascript
// Script de migration (à exécuter une fois)
db.users.updateMany(
  { role: 'Manager' },
  { $set: { role: 'Admin' } }
)
```

---

## 📞 Support

Pour toute question sur le système de rôles :
- Consultez ce guide
- Vérifiez les credentials dans SUPERUSER_CREDENTIALS.txt
- Consultez DATABASE_STATUS.md pour l'état de la base de données

---

**Dernière mise à jour**: 5 Décembre 2024
**Version**: 1.0.0
**Base de données**: prototypedb
