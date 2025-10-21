# 🚀 Déploiement AppTicket

## 📋 Informations du Repository

**GitHub :** https://github.com/kimson2690/appticket.git

## 🔧 Installation depuis GitHub

### 1. Cloner le Repository
```bash
git clone https://github.com/kimson2690/appticket.git
cd appticket
```

### 2. Configuration Backend Laravel
```bash
cd restaurant-backend

# Installer les dépendances
composer install

# Configuration environnement
cp .env.example.appticket .env
php artisan key:generate

# Configurer la base de données dans .env
# DB_DATABASE=appticket
# DB_PORT=3307
# DB_USERNAME=root
# DB_PASSWORD=

# Migrations et données initiales
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=AdminUserSeeder

# Démarrer le serveur
php artisan serve
```

### 3. Configuration Frontend React
```bash
cd restaurant-frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## 🌐 Accès Application

- **Frontend :** http://localhost:5173
- **Backend API :** http://localhost:8000/api
- **Admin :** admin@appticket.com / admin123

## 🗄️ Base de Données

### Configuration MySQL
```sql
CREATE DATABASE appticket;
```

### Tables Créées (21 au total)
- `roles` - Rôles système
- `users` - Utilisateurs avec rôles
- `companies` - Entreprises
- `restaurants` - Restaurants partenaires
- `ticket_batches` - Souches de tickets
- `user_tickets` - Tickets individuels
- `dishes` - Plats
- `menus` - Menus restaurant
- `orders` - Commandes
- + Tables système Laravel

## 👥 Rôles Disponibles

1. **Administrateur** - Gestion globale
2. **Gestionnaire Entreprise** - Gestion employés/tickets
3. **Gestionnaire Restaurant** - Gestion menus/commandes
4. **Utilisateur** - Passage de commandes
5. **Gestionnaire Livraison** - Gestion livraisons

## 🔄 Workflow Git

### Développement
```bash
# Créer une branche feature
git checkout -b feature/nom-fonctionnalite

# Développer et commiter
git add .
git commit -m "feat: description de la fonctionnalité"

# Pousser vers GitHub
git push origin feature/nom-fonctionnalite

# Créer une Pull Request sur GitHub
```

### Mise à jour
```bash
# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances si nécessaire
cd restaurant-backend && composer install
cd restaurant-frontend && npm install

# Exécuter les nouvelles migrations
php artisan migrate
```

## 📦 Structure du Projet

```
appticket/
├── restaurant-backend/     # Laravel 11 API
│   ├── app/Models/        # Modèles Eloquent
│   ├── database/migrations/ # Migrations DB
│   ├── database/seeders/  # Seeders
│   └── routes/           # Routes API
├── restaurant-frontend/   # React + TypeScript
│   ├── src/              # Code source
│   └── public/           # Assets publics
├── README.md             # Documentation principale
├── ACCES_INTERFACES.md   # Guide d'accès
└── LICENSE               # Licence MIT
```

## 🛠️ Technologies

- **Backend :** Laravel 11, MySQL, Eloquent ORM
- **Frontend :** React 18, TypeScript, Vite
- **Base de données :** MySQL/MariaDB
- **Authentification :** Laravel Sanctum (prévu)

## 📞 Support

Pour toute question ou problème :
1. Consulter la documentation dans le repository
2. Créer une issue sur GitHub
3. Vérifier les logs Laravel et React
