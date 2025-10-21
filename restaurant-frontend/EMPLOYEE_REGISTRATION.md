# 👤 Inscription Employé AppTicket

## 🎯 **Vue d'ensemble**

Page d'inscription spécialement conçue pour les **employés d'entreprise** souhaitant créer leur compte pour accéder aux tickets restaurant de leur organisation.

## 🔐 **Restriction d'Accès**

### Rôles Autorisés
- ✅ **Employé/Utilisateur** : Auto-inscription possible
- ❌ **Gestionnaire Entreprise** : Créé par l'administrateur
- ❌ **Gestionnaire Restaurant** : Créé par l'administrateur  
- ❌ **Gestionnaire Livraison** : Créé par l'administrateur
- ❌ **Administrateur** : Créé par l'administrateur système

### Processus de Création
```
Employés → Auto-inscription avec sélection d'entreprise
Autres rôles → Création par l'administrateur dans l'interface admin
```

## 📋 **Formulaire d'Inscription**

### Champs Requis
```tsx
- Prénom * (text)
- Nom * (text)
- Email * (email avec validation)
- Téléphone * (tel)
- Entreprise * (select depuis liste)
- Mot de passe * (min 6 caractères)
- Confirmation * (doit correspondre)
- Conditions * (checkbox obligatoire)
```

### Sélection d'Entreprise
```typescript
const companies = [
  { id: '1', name: 'TechCorp Sénégal' },
  { id: '2', name: 'Restaurant Le Baobab' },
  { id: '3', name: 'Entreprise Dakar Foods' },
  { id: '4', name: 'Société Teranga Meals' },
  { id: '5', name: 'Groupe Hospitality Plus' }
];
```

## 🎨 **Interface Utilisateur**

### Note Explicative
```tsx
<div className="bg-blue-50 rounded-xl border border-blue-200">
  <h3>Information importante</h3>
  <p>Cette inscription est réservée aux employés d'entreprise. 
     Les autres rôles sont créés par l'administrateur système.</p>
</div>
```

### Sélection d'Entreprise
- **Icône Building2** : Identification visuelle claire
- **Liste déroulante** : Entreprises pré-configurées
- **Message d'aide** : "Votre entreprise n'est pas dans la liste ? Contactez votre administrateur."
- **Validation** : Sélection obligatoire

## 🔍 **Validation du Formulaire**

### Règles Spécifiques
```typescript
const validateForm = (): boolean => {
  // Validation standard des champs personnels
  if (!formData.firstName.trim()) newErrors.firstName = 'Prénom requis';
  if (!formData.lastName.trim()) newErrors.lastName = 'Nom requis';
  if (!formData.email.trim()) newErrors.email = 'Email requis';
  
  // Validation spécifique entreprise
  if (!formData.companyId) newErrors.companyId = 'Entreprise requise';
  
  // Validation sécurité
  if (!formData.password || formData.password.length < 6) 
    newErrors.password = 'Minimum 6 caractères';
  if (formData.password !== formData.confirmPassword) 
    newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    
  return Object.keys(newErrors).length === 0;
};
```

## 🏢 **Gestion des Entreprises**

### Source des Données
```typescript
// Actuellement en dur, à terme depuis l'API
const companies = await fetch('/api/companies/active');
```

### Critères d'Affichage
- **Entreprises actives** : Seulement celles autorisant l'auto-inscription
- **Ordre alphabétique** : Tri par nom d'entreprise
- **Statut validé** : Entreprises approuvées par l'admin

### Cas d'Usage
1. **Entreprise trouvée** : Inscription directe
2. **Entreprise manquante** : Message de contact admin
3. **Entreprise inactive** : Non affichée dans la liste

## 🔄 **Flux d'Inscription**

### Étapes du Processus
```
1. Employé accède à la page d'inscription
2. Remplit ses informations personnelles
3. Sélectionne son entreprise dans la liste
4. Définit son mot de passe
5. Accepte les conditions d'utilisation
6. Soumission du formulaire
7. Validation côté client
8. Envoi vers l'API backend
9. Création du compte avec rôle "user"
10. Email de confirmation (optionnel)
11. Redirection vers la connexion
```

### États Post-Inscription
- **Statut initial** : `pending` (en attente de validation)
- **Rôle assigné** : `user` (employé)
- **Entreprise liée** : ID de l'entreprise sélectionnée
- **Permissions** : Accès aux tickets de son entreprise

## 🎯 **Objectifs UX**

### Simplicité
- **Processus guidé** : Étapes claires et logiques
- **Validation temps réel** : Feedback immédiat
- **Messages d'aide** : Guidance contextuelle
- **Design cohérent** : Aligné avec la page de connexion

### Sécurité
- **Validation stricte** : Tous les champs requis
- **Mots de passe sécurisés** : Minimum 6 caractères
- **Entreprises contrôlées** : Liste pré-approuvée
- **Conditions obligatoires** : Acceptation des CGU

## 📱 **Responsive Design**

### Desktop (> 1024px)
- **Layout 2 colonnes** : Feature slider + formulaire
- **Formulaire large** : Champs en grille 2x2 pour nom/prénom
- **Espacement généreux** : Confort visuel optimal

### Mobile (< 1024px)
- **Layout vertical** : Formulaire pleine largeur
- **Champs empilés** : Un par ligne pour lisibilité
- **Touch-friendly** : Tailles appropriées pour tactile

## 🔧 **Intégration Backend**

### Endpoint d'Inscription
```typescript
POST /api/auth/register
{
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  password: string,
  companyId: string,
  role: 'user' // Automatiquement assigné
}
```

### Réponse Attendue
```typescript
{
  success: boolean,
  message: string,
  user?: {
    id: number,
    email: string,
    status: 'pending' | 'active'
  }
}
```

## 🚀 **Évolutions Futures**

### Améliorations Prévues
- **API dynamique** : Chargement des entreprises depuis la base
- **Validation email** : Vérification du domaine d'entreprise
- **Upload avatar** : Photo de profil optionnelle
- **Départements** : Sélection du service dans l'entreprise

### Fonctionnalités Avancées
- **Invitation par email** : Lien d'inscription personnalisé
- **Code d'invitation** : Validation par code entreprise
- **Géolocalisation** : Vérification de la localisation
- **Intégration SSO** : Connexion via systèmes d'entreprise

La page d'inscription employé AppTicket offre maintenant une expérience ciblée et sécurisée pour l'onboarding des utilisateurs finaux ! 👤✨
