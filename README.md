# 🎫 AppTicket - Gestion de Tickets Restaurant

Application complète de gestion de tickets prépayés pour restaurants avec système multi-rôles.

## 🏗️ Architecture

### Backend - Laravel 11
- **API REST** complète
- **Base MySQL** (appticket:3307)
- **Authentification** multi-rôles
- **Gestion des tickets** prépayés

### Frontend - React + TypeScript
- **Interface moderne** avec Vite
- **Tableaux de bord** par rôle
- **Responsive design**

## 👥 Acteurs du Système

### 🔴 Administrateur
- Gestion globale du système
- Création d'entreprises et restaurants
- Supervision des utilisateurs

### 🔵 Gestionnaire Entreprise  
- Gestion des employés
- Création et attribution de tickets
- Configuration des lieux de livraison

### 🟢 Gestionnaire Restaurant
- Gestion des menus et plats
- Validation des commandes
- Suivi des ventes

### 🟡 Utilisateur/Employé
- Consultation des menus
- Passage de commandes avec tickets
- Suivi du solde personnel

### 🟠 Gestionnaire Livraison
- Gestion des livraisons
- Suivi des commandes

## 🗄️ Base de Données

### Tables Principales
- `users` - Utilisateurs avec rôles
- `roles` - Rôles système (5 types)
- `companies` - Entreprises clientes
- `restaurants` - Restaurants partenaires

### Système de Tickets
- `ticket_batches` - Souches de tickets
- `user_tickets` - Tickets individuels

### Gestion Restaurant
- `dishes` - Plats disponibles
- `menus` - Menus jour/semaine
- `orders` - Commandes avec déduction tickets

## 🚀 Installation

### Prérequis
- PHP 8.2+
- Node.js 18+
- MySQL/MariaDB
- Composer

### Backend Laravel
```bash
cd restaurant-backend
composer install
cp .env.example .env
# Configurer la base de données dans .env
php artisan key:generate
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=AdminUserSeeder
php artisan serve
```

### Frontend React
```bash
cd restaurant-frontend
npm install
npm run dev
```

## 🌐 Accès

### URLs
- **Frontend :** http://localhost:5173
- **Backend API :** http://localhost:8000/api

### Connexion Administrateur
- **Email :** admin@appticket.com
- **Mot de passe :** admin123

## 📊 Fonctionnalités

### ✅ Implémenté
- Structure de base de données complète
- Modèles Eloquent avec relations
- Authentification multi-rôles
- Utilisateur administrateur
- Serveurs de développement

### 🔄 En Développement
- Interface de connexion
- Tableaux de bord par rôle
- Gestion des tickets
- Système de commandes
- API REST complète

## 🛠️ Technologies

### Backend
- Laravel 11
- MySQL/MariaDB
- Eloquent ORM
- Laravel Sanctum (auth)

### Frontend  
- React 18
- TypeScript
- Vite
- TailwindCSS (prévu)

## 📝 Documentation

- `ACCES_INTERFACES.md` - Guide d'accès aux interfaces
- `restaurant-backend/README_APPTICKET.md` - Documentation technique
- `restaurant-backend/IDENTIFIANTS_ADMIN.md` - Identifiants admin (local)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

Développé pour la gestion moderne des tickets restaurant avec système multi-entreprises.
