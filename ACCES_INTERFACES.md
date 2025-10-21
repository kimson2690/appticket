# 🌐 Accès aux Interfaces AppTicket

## 🎯 **URLs d'Accès**

### 🖥️ **Frontend React (Interface Utilisateur)**
```
http://localhost:5173
```
- **Framework :** React + TypeScript + Vite
- **Port :** 5173
- **Statut :** ✅ Démarré

### 🔧 **Backend Laravel (API)**
```
http://localhost:8000
```
- **Framework :** Laravel 11
- **Port :** 8000
- **API Base :** http://localhost:8000/api
- **Statut :** ✅ Démarré

### 🗄️ **Base de Données MySQL**
```
Host: 127.0.0.1
Port: 3307
Database: appticket
User: root
```
- **Statut :** ✅ Connectée

## 🚀 **Démarrage des Services**

### Frontend React
```bash
cd /Users/kima/AppTicket/restaurant-frontend
npm run dev
```

### Backend Laravel
```bash
cd /Users/kima/AppTicket/restaurant-backend
php artisan serve
```

## 👤 **Connexion Administrateur**

### 🔐 **Identifiants**
- **Email :** admin@appticket.com
- **Mot de passe :** admin123
- **Rôle :** Administrateur

## 🎭 **Interfaces par Rôle**

### 🔴 **Administrateur**
- Gestion globale du système
- Création d'entreprises et restaurants
- Gestion des utilisateurs
- Statistiques globales

### 🔵 **Gestionnaire Entreprise**
- Gestion des employés
- Création de tickets
- Configuration des lieux de livraison
- Statistiques entreprise

### 🟢 **Gestionnaire Restaurant**
- Gestion des menus et plats
- Validation des commandes
- Suivi des ventes

### 🟡 **Utilisateur/Employé**
- Consultation des menus
- Passage de commandes
- Suivi du solde de tickets

### 🟠 **Gestionnaire Livraison**
- Gestion des livraisons
- Suivi des commandes

## 📱 **Fonctionnalités Disponibles**

### ✅ **Actuellement Opérationnel**
- Base de données configurée
- Modèles et relations créés
- Utilisateur admin créé
- Serveurs démarrés

### 🔄 **En Développement**
- Interface de connexion
- Tableaux de bord par rôle
- Gestion des tickets
- Système de commandes

## 🛠️ **Développement**

### Arrêter les serveurs
```bash
# Frontend : Ctrl+C dans le terminal
# Backend : Ctrl+C dans le terminal
```

### Redémarrer
```bash
# Frontend
npm run dev

# Backend  
php artisan serve
```
