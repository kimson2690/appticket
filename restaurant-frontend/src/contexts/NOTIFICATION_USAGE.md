# 🔔 Système de Notifications - Guide d'Utilisation

## 📦 Installation

Le système de notifications est déjà intégré dans `App.tsx`. Il enveloppe toute l'application.

## 🎯 Utilisation Basique

### 1. Importer le hook

```typescript
import { useNotification } from '../contexts/NotificationContext';
```

### 2. Utiliser dans votre composant

```typescript
const MyComponent = () => {
  const { success, error, warning, info } = useNotification();

  const handleSave = async () => {
    try {
      await saveData();
      success('Sauvegarde réussie', 'Les données ont été enregistrées avec succès');
    } catch (err) {
      error('Erreur de sauvegarde', 'Impossible d\'enregistrer les données');
    }
  };

  return <button onClick={handleSave}>Sauvegarder</button>;
};
```

## 🎨 Types de Notifications

### ✅ Success (Succès)
```typescript
success('Opération réussie', 'Les données ont été sauvegardées');
// Couleur: Vert
// Icône: CheckCircle
// Durée par défaut: 4 secondes
```

### ❌ Error (Erreur)
```typescript
error('Erreur', 'Une erreur s\'est produite');
// Couleur: Rouge
// Icône: XCircle
// Durée par défaut: 4 secondes
```

### ⚠️ Warning (Avertissement)
```typescript
warning('Attention', 'Cette action est irréversible');
// Couleur: Orange
// Icône: AlertTriangle
// Durée par défaut: 4 secondes
```

### ℹ️ Info (Information)
```typescript
info('Information', 'Nouvelle version disponible');
// Couleur: Bleu
// Icône: Info
// Durée par défaut: 4 secondes
```

## ⚙️ Options Avancées

### Durée Personnalisée
```typescript
// Notification qui reste 10 secondes
success('Titre', 'Message', 10000);

// Notification permanente (ne se ferme pas automatiquement)
success('Titre', 'Message', 0);
```

### Notification Personnalisée
```typescript
const { showNotification } = useNotification();

showNotification({
  type: 'success',
  title: 'Titre personnalisé',
  message: 'Message détaillé',
  duration: 5000,
  position: 'bottom-right'
});
```

### Positions Disponibles
```typescript
type Position = 
  | 'top-right'      // ↗️ Haut droite (défaut)
  | 'top-center'     // ⬆️ Haut centre
  | 'top-left'       // ↖️ Haut gauche
  | 'bottom-right'   // ↘️ Bas droite
  | 'bottom-center'  // ⬇️ Bas centre
  | 'bottom-left'    // ↙️ Bas gauche
```

## 📋 Exemples d'Utilisation Courants

### 1. Formulaire de Création
```typescript
const CreateUserForm = () => {
  const { success, error } = useNotification();

  const handleSubmit = async (data) => {
    try {
      await apiService.createUser(data);
      success(
        'Utilisateur créé',
        `L'utilisateur ${data.name} a été créé avec succès`
      );
    } catch (err) {
      error(
        'Erreur de création',
        'Impossible de créer l\'utilisateur. Vérifiez les données.'
      );
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
};
```

### 2. Suppression avec Confirmation
```typescript
const DeleteButton = ({ item }) => {
  const { success, error, warning } = useNotification();

  const handleDelete = async () => {
    warning(
      'Suppression en cours',
      'L\'élément va être supprimé...',
      2000
    );

    try {
      await apiService.delete(item.id);
      success('Suppression réussie', 'L\'élément a été supprimé');
    } catch (err) {
      error('Erreur', 'Impossible de supprimer l\'élément');
    }
  };

  return <button onClick={handleDelete}>Supprimer</button>;
};
```

### 3. Chargement de Données
```typescript
const DataList = () => {
  const { info, error } = useNotification();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await apiService.fetchData();
      if (data.length === 0) {
        info('Aucune donnée', 'Aucun élément trouvé', 3000);
      }
    } catch (err) {
      error('Erreur de chargement', 'Impossible de charger les données');
    }
  };

  return <div>...</div>;
};
```

### 4. Upload de Fichier
```typescript
const FileUpload = () => {
  const { success, error, warning } = useNotification();

  const handleUpload = async (file) => {
    // Vérification
    if (file.size > 2000000) {
      warning(
        'Fichier trop volumineux',
        'La taille maximale est de 2MB',
        5000
      );
      return;
    }

    try {
      await uploadFile(file);
      success(
        'Upload réussi',
        `${file.name} a été téléchargé avec succès`
      );
    } catch (err) {
      error(
        'Erreur d\'upload',
        'Impossible de télécharger le fichier'
      );
    }
  };

  return <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />;
};
```

### 5. Multiple Notifications
```typescript
const BatchOperation = () => {
  const { success, error } = useNotification();

  const processBatch = async (items) => {
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        await processItem(item);
        successCount++;
      } catch {
        errorCount++;
      }
    }

    // Afficher résultat global
    if (successCount > 0) {
      success(
        'Traitement terminé',
        `${successCount} élément(s) traité(s) avec succès`
      );
    }

    if (errorCount > 0) {
      error(
        'Erreurs détectées',
        `${errorCount} élément(s) n'ont pas pu être traités`
      );
    }
  };

  return <button onClick={() => processBatch(items)}>Traiter tout</button>;
};
```

## 🎯 Bonnes Pratiques

### ✅ À FAIRE
- Utiliser des messages clairs et concis
- Adapter la durée selon l'importance du message
- Utiliser le bon type de notification (success, error, warning, info)
- Donner des détails dans le message secondaire

### ❌ À ÉVITER
- Messages trop longs (> 100 caractères)
- Notifications trop fréquentes (spam)
- Notifications permanentes (duration: 0) sans raison
- Messages techniques incompréhensibles pour l'utilisateur

## 🔧 Configuration Globale

Dans `App.tsx`, vous pouvez configurer :

```typescript
<NotificationProvider
  maxNotifications={5}        // Nombre max de notifications simultanées
  defaultDuration={4000}      // Durée par défaut (4 secondes)
  defaultPosition="top-right" // Position par défaut
>
  {children}
</NotificationProvider>
```

## 🎨 Personnalisation Visuelle

Les notifications utilisent Tailwind CSS. Pour personnaliser :

1. Modifier les couleurs dans `NotificationContext.tsx`
2. Ajuster les animations dans `tailwind.config.js`
3. Changer les icônes (lucide-react)

## 📱 Responsive

Les notifications sont automatiquement responsive :
- Desktop: Largeur fixe (384px / w-96)
- Mobile: Largeur adaptative (max-w-full)
- Padding réduit automatiquement sur petits écrans

## ♿ Accessibilité

- Attribut `role="alert"`
- Attribut `aria-live="polite"`
- Bouton de fermeture avec `aria-label`
- Contraste des couleurs respecté (WCAG)
- Support clavier complet

## 🚀 Performance

- Maximum 5 notifications simultanées par défaut
- Auto-nettoyage après fermeture
- Animations optimisées (GPU)
- File d'attente intelligente
- Groupement par position

## 🐛 Dépannage

### Notifications ne s'affichent pas
1. Vérifier que `NotificationProvider` enveloppe votre composant
2. Vérifier l'import du hook
3. Vérifier la console pour erreurs

### Z-index trop bas
Les notifications utilisent `z-[100]`. Si elles sont masquées :
```typescript
// Augmenter le z-index dans NotificationContainer
className="fixed z-[9999] ..."
```

### Animations saccadées
Vérifier que l'animation `slide-down` est définie dans `tailwind.config.js`

## 📚 API Complète

```typescript
interface NotificationContextType {
  // Afficher notification personnalisée
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  
  // Masquer notification
  hideNotification: (id: string) => void;
  
  // Raccourcis
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
  
  // État actuel
  notifications: Notification[];
}
```

---

**Version:** 1.0.0  
**Créé par:** Expert UI/UX  
**Dernière mise à jour:** 24 octobre 2025
