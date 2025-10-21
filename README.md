# 🎫 AppTicket - Système de Gestion de Tickets Restaurant

Application complète de gestion de tickets de restaurant pour entreprises au Sénégal avec interface d'administration moderne.

## 🚀 Fonctionnalités Principales

### 👨‍💼 Administration
- **🔐 Gestion des Rôles & Permissions** : CRUD complet avec système de permissions par catégories
- **🏢 Gestion des Entreprises** : Création, modification, suppression d'entreprises clientes
- **📊 Tableaux de Bord** : Statistiques en temps réel et métriques
- **👥 Gestion des Utilisateurs** : Attribution de rôles et permissions

### 🎯 Système de Tickets
- **💳 Tickets Prépayés** : Système de tickets par entreprise
- **🍽️ Commandes Restaurant** : Gestion des commandes avec déduction automatique
- **🚚 Livraisons** : Suivi des livraisons et statuts
- **📍 Lieux de Livraison** : Configuration des points de livraison

## 🛠️ Technologies

### Frontend
- **React 18** + TypeScript
- **Vite** (Build tool)
- **Tailwind CSS** (Styling)
- **Lucide React** (Icons)

### Backend
- **Laravel 11** + PHP 8.2
- **MySQL** (Base de données)
- **Eloquent ORM** (Relations)
- **API REST** (JSON)

## 📦 Installation

### Prérequis
- PHP 8.2+
- Node.js 18+
- MySQL 8.0+
- Composer

### 🔧 Backend (Laravel)
```bash
cd restaurant-backend

# Installation des dépendances
composer install

# Configuration
cp .env.example .env
php artisan key:generate

# Configuration base de données dans .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=appticket
DB_USERNAME=root
DB_PASSWORD=

# Migrations et seeders
php artisan migrate
php artisan db:seed

# Démarrage du serveur
php artisan serve --port=8001
```

### 🎨 Frontend (React)
```bash
cd restaurant-frontend

# Installation des dépendances
npm install

# Démarrage du serveur de développement
npm run dev
```

## 🔑 Accès Administration

**URL**: http://localhost:5174
**Identifiants**:
- Email: `admin@appticket.com`
- Mot de passe: `admin123`

## 📊 API Endpoints

### Authentification
- `POST /api/login` - Connexion

### Rôles & Permissions
- `GET /api/admin/roles` - Liste des rôles
- `POST /api/admin/roles` - Créer un rôle
- `PUT /api/admin/roles/{id}` - Modifier un rôle
- `DELETE /api/admin/roles/{id}` - Supprimer un rôle
- `GET /api/admin/permissions/all` - Liste des permissions

### Entreprises
- `GET /api/admin/companies` - Liste des entreprises
- `POST /api/admin/companies` - Créer une entreprise
- `PUT /api/admin/companies/{id}` - Modifier une entreprise
- `DELETE /api/admin/companies/{id}` - Supprimer une entreprise

## 🎭 Acteurs du Système

### 👑 Administrateur
- Gestion globale du système
- Configuration des rôles et permissions
- Supervision des entreprises et restaurants

### 🏢 Gestionnaire d'Entreprise
- Gestion des employés de l'entreprise
- Achat et distribution de tickets
- Suivi des consommations

### 🍽️ Gestionnaire de Restaurant
- Gestion des menus et plats
- Traitement des commandes
- Validation des tickets

### 👤 Utilisateur/Employé
- Consultation des menus
- Passage de commandes avec tickets
- Suivi des commandes

### 🚚 Société de Livraison (Optionnel)
- Prise en charge des livraisons
- Mise à jour des statuts de livraison

## 🗄️ Structure de la Base de Données

### Tables Principales
- `users` - Utilisateurs avec rôles
- `roles` - Rôles système avec permissions
- `permissions` - Permissions par catégories
- `companies` - Entreprises clientes
- `restaurants` - Restaurants partenaires
- `ticket_batches` - Lots de tickets
- `user_tickets` - Tickets individuels
- `orders` - Commandes
- `delivery_places` - Lieux de livraison

## 🎨 Interface Utilisateur

### Design System
- **Couleurs**: Orange (primaire), Gris (neutre)
- **Typographie**: System fonts
- **Composants**: Modernes et responsives
- **Icons**: Lucide React
- **Layout**: Sidebar + Header + Content

### Fonctionnalités UI
- **Responsive Design** : Adapté mobile/desktop
- **Dark Mode Ready** : Structure préparée
- **Loading States** : Indicateurs de chargement
- **Error Handling** : Gestion d'erreurs élégante
- **Modals** : Création/modification en overlay

## 🔄 Workflow de Développement

### Git Flow
```bash
# Nouvelle fonctionnalité
git checkout -b feature/nouvelle-fonctionnalite
git add .
git commit -m "✨ Ajout nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

### Tests
```bash
# Backend
php artisan test

# Frontend
npm run test
```

## 📝 Changelog

### Version 2.0.0 (2025-10-21)
- ✨ **Gestion des Rôles & Permissions** : Interface complète CRUD
- 🏢 **Gestion des Entreprises** : Module complet avec API
- 🎨 **Interface Administration** : Design moderne et responsive
- 🔧 **API REST** : Endpoints complets avec validation
- 📊 **Tableaux de Bord** : Statistiques et métriques
- 🔐 **Authentification** : Système de connexion admin

### Version 1.0.0 (2024-XX-XX)
- 🎯 Structure de base du projet
- 🗄️ Modèles de données
- 🔧 Configuration initiale

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

**Développeur**: Kima
**Email**: contact@appticket.sn
**GitHub**: [@kimson2690](https://github.com/kimson2690)

---

🇸🇳 **Fait avec ❤️ au Sénégal**
