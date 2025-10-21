# AppTicket - Application de Gestion de Tickets Restaurant

## Configuration Base de Données
- **Nom**: appticket
- **Port**: 3307
- **Utilisateur**: root

## Structure des Tables

### 1. Tables Principales (Acteurs et Rôles)
- `roles` - Rôles système (Admin, Gestionnaire, Utilisateur)
- `users` - Comptes utilisateurs avec rôles
- `companies` - Entreprises clientes
- `restaurants` - Restaurants partenaires

### 2. Tables de Tickets
- `ticket_batches` - Souches de tickets générées
- `user_tickets` - Tickets individuels assignés aux utilisateurs

### 3. Tables Menus et Plats
- `dishes` - Plats disponibles par restaurant
- `menus` - Menus du jour/semaine
- `menu_dishes` - Table pivot menu ↔ plat

### 4. Tables Commandes
- `orders` - Commandes passées
- `order_items` - Détails des commandes

### 5. Tables Utilitaires
- `delivery_places` - Lieux de livraison par entreprise
- `transactions` - Historique des transactions

## Acteurs Principaux

### Administrateur (ADM)
- Gestion globale du système
- Création d'entreprises et restaurants
- Gestion des utilisateurs

### Gestionnaire d'Entreprise (ENT)
- Gestion des employés de l'entreprise
- Création et attribution de tickets
- Configuration des lieux de livraison

### Gestionnaire de Restaurant (RES)
- Gestion des menus et plats
- Validation des commandes
- Suivi des ventes

### Utilisateur/Employé (USR)
- Consultation des menus
- Passage de commandes avec tickets
- Suivi du solde de tickets

### Gestionnaire de Livraison (LIV) - Optionnel
- Gestion des livraisons
- Suivi des commandes à livrer

## Flux Principal

1. **Admin** crée une entreprise et un restaurant
2. **Gestionnaire Entreprise** crée des employés et génère des tickets
3. **Gestionnaire Restaurant** crée des menus avec des plats
4. **Utilisateur** consulte les menus et passe des commandes
5. **Gestionnaire Restaurant** valide les commandes
6. **Livraison** effectue la livraison (optionnel)

## Configuration Laravel

### Migrations
Toutes les migrations sont créées selon le schéma fourni avec les relations appropriées.

### Modèles
- Relations Eloquent configurées
- Scopes et accesseurs ajoutés
- Logique métier intégrée

### Seeders
- RoleSeeder pour initialiser les rôles de base

## Prochaines Étapes
1. Créer les contrôleurs API
2. Implémenter l'authentification multi-rôles
3. Développer le frontend React
4. Intégrer la logique métier des tickets
