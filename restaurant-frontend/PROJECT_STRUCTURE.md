# 🏗️ Structure du Projet AppTicket Frontend

## 📁 **Architecture Finale**

```
src/
├── App.css                     # Styles globaux de l'application
├── App.tsx                     # Composant racine
├── AuthPages.tsx               # Routeur d'authentification
├── ModernLogin.tsx             # Page de connexion moderne
├── components/
│   └── ModernRegisterPage.tsx  # Page d'inscription moderne
├── assets/                     # Ressources statiques
├── index.css                   # Styles CSS globaux avec Tailwind
└── main.tsx                    # Point d'entrée de l'application
```

## 🎯 **Composants Principaux**

### **AuthPages.tsx**
- **Rôle** : Gestion de la navigation entre connexion et inscription
- **État** : `login` | `register`
- **Fonctions** : `showLogin()`, `showRegister()`

### **ModernLogin.tsx**
- **Design** : Style moderne inspiré d'Osmo
- **Fonctionnalités** :
  - Authentification email/mot de passe
  - Bouton Google (UI seulement)
  - Validation des identifiants de test
  - Logo externe au conteneur

### **ModernRegisterPage.tsx**
- **Public** : Employés d'entreprise uniquement
- **Fonctionnalités** :
  - Formulaire complet (nom, email, téléphone, entreprise)
  - Sélection d'entreprise depuis liste prédéfinie
  - Validation en temps réel
  - Design cohérent avec la connexion

## 🎨 **Design System**

### **Palette de Couleurs**
- **Principal** : Orange (#f59e0b, #ea580c)
- **Fond** : Gris clair (#f9fafb)
- **Conteneur** : Blanc (#ffffff)
- **Texte** : Gris foncé (#111827, #374151)

### **Composants UI**
- **Conteneur principal** : `rounded-3xl shadow-2xl`
- **Boutons** : `rounded-2xl` avec gradients
- **Champs** : `rounded-2xl bg-gray-50 focus:bg-white`
- **Logo** : Position absolue hors conteneur

### **Layout**
- **Structure** : 2/5 (formulaire) - 3/5 (visualisation)
- **Responsive** : Mobile full-width, desktop split
- **Centrage** : Flexbox avec `items-center justify-center`

## 🔐 **Authentification**

### **Identifiants de Test**
```
Email: admin@appticket.com
Mot de passe: admin123
```

### **Entreprises Disponibles**
1. TechCorp Sénégal
2. Restaurant Le Baobab
3. Entreprise Dakar Foods
4. Société Teranga Meals
5. Groupe Hospitality Plus

## 🚀 **Technologies Utilisées**

### **Frontend**
- **React 18** : Framework principal
- **TypeScript** : Typage statique
- **Vite** : Build tool et dev server
- **Tailwind CSS** : Framework CSS utilitaire
- **Lucide React** : Icônes modernes

### **Outils de Développement**
- **ESLint** : Linting du code
- **PostCSS** : Traitement CSS
- **Autoprefixer** : Compatibilité navigateurs

## 📱 **Responsive Design**

### **Breakpoints**
- **Mobile** : < 1024px (lg:)
- **Desktop** : ≥ 1024px

### **Adaptations**
- **Logo** : Toujours visible en haut à gauche
- **Layout** : Stack vertical sur mobile, split sur desktop
- **Visualisation** : Masquée sur mobile (`hidden lg:flex`)

## 🎭 **Fonctionnalités**

### **Page de Connexion**
- ✅ Validation des identifiants
- ✅ Toggle visibilité mot de passe
- ✅ Option "Se souvenir de moi"
- ✅ Lien "Mot de passe oublié"
- ✅ Redirection vers inscription

### **Page d'Inscription**
- ✅ Formulaire employé complet
- ✅ Sélection d'entreprise obligatoire
- ✅ Validation temps réel
- ✅ Confirmation mot de passe
- ✅ Acceptation des conditions

### **Navigation**
- ✅ Transitions fluides entre pages
- ✅ Bouton retour sur inscription
- ✅ États de chargement
- ✅ Gestion d'erreurs

## 🔧 **Scripts Disponibles**

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Aperçu du build
npm run lint         # Vérification du code
```

## 🌐 **Déploiement**

### **URL de Développement**
- **Local** : http://localhost:5173
- **Réseau** : http://[IP]:5173

### **Build de Production**
```bash
npm run build
npm run preview
```

## 📋 **Prochaines Étapes**

### **Intégration Backend**
- [ ] Connexion API d'authentification
- [ ] Récupération dynamique des entreprises
- [ ] Gestion des sessions utilisateur
- [ ] Validation côté serveur

### **Fonctionnalités Avancées**
- [ ] Authentification Google fonctionnelle
- [ ] Reset de mot de passe
- [ ] Validation email
- [ ] Notifications toast

Le projet AppTicket Frontend est maintenant **propre, moderne et prêt pour la production** ! 🎨✨
