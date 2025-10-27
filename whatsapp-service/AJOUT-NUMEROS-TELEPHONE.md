# 📞 Ajouter les Numéros de Téléphone

Pour que WhatsApp fonctionne, vous devez ajouter le champ `phone` aux employés et restaurants.

---

## 👤 Employés

### **Méthode 1 : Lors de l'inscription**

Modifiez le formulaire d'inscription pour inclure un champ téléphone.

**Interface RegisterForm (Frontend):**

```typescript
// Ajouter le champ phone
interface RegisterFormData {
  name: string;
  email: string;
  phone: string;  // ← NOUVEAU
  password: string;
  company_id: string;
  // ...
}

// Dans le formulaire JSX
<input
  type="tel"
  name="phone"
  placeholder="Numéro WhatsApp (ex: 771234567)"
  required
  pattern="[0-9]{9,15}"
/>
```

**Backend (EmployeeController.php):**

```php
$validated = $request->validate([
    'name' => 'required|string',
    'email' => 'required|email',
    'phone' => 'required|string|min:9|max:15',  // ← NOUVEAU
    'password' => 'required|string|min:6',
    // ...
]);

$employeeData = [
    'id' => $employeeId,
    'name' => $validated['name'],
    'email' => $validated['email'],
    'phone' => $validated['phone'],  // ← NOUVEAU
    // ...
];
```

---

### **Méthode 2 : Ajouter manuellement dans employees.json**

```json
{
  "id": "emp_123",
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "phone": "221771234567",  ← AJOUTER CETTE LIGNE
  "company_id": "company_1",
  "ticket_balance": 10000,
  // ...
}
```

---

### **Méthode 3 : Script de migration automatique**

Créez un fichier `add-phone-fields.php` dans `restaurant-backend`:

```php
<?php

// Charger employees.json
$employeesFile = 'storage/app/employees.json';
$employees = json_decode(file_get_contents($employeesFile), true);

// Ajouter le champ phone si absent
foreach ($employees as &$employee) {
    if (!isset($employee['phone'])) {
        $employee['phone'] = '';  // Vide par défaut
        echo "Phone ajouté pour: {$employee['name']}\n";
    }
}

// Sauvegarder
file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "\n✅ Champ phone ajouté à tous les employés !\n";
```

**Exécuter:**

```bash
cd restaurant-backend
php add-phone-fields.php
```

---

## 🏪 Restaurants

### **Ajouter dans restaurants.json**

```json
{
  "id": "5",
  "name": "Le Baobab",
  "address": "Dakar, Sénégal",
  "phone": "221771234567",
  "whatsapp_phone": "221771234567",  ← AJOUTER CETTE LIGNE (pour recevoir nouvelles commandes)
  "status": "active",
  // ...
}
```

**Note:** Le champ `whatsapp_phone` est utilisé pour envoyer les nouvelles commandes au restaurant.

---

## 🔧 Modification Interface Gestion Employés

### **Afficher et éditer le téléphone**

Dans `EmployeeManagement.tsx`:

```typescript
// Dans le formulaire de modification
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Numéro WhatsApp
  </label>
  <input
    type="tel"
    value={formData.phone || ''}
    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
    placeholder="221771234567"
    className="w-full px-3 py-2 border rounded-lg"
  />
  <p className="text-xs text-gray-500 mt-1">
    Format: 221771234567 (avec code pays)
  </p>
</div>

// Afficher dans la liste
<div className="flex items-center gap-2 text-sm text-gray-600">
  <Phone className="w-4 h-4" />
  <span>{employee.phone || 'Non renseigné'}</span>
</div>
```

---

## 📱 Format des Numéros

### **Recommandations:**

- **Avec code pays:** `221771234567` (Sénégal)
- **Sans code pays:** `771234567` (le service ajoute 221 automatiquement)
- **International:** `+221771234567` ou `00221771234567`

### **Validation côté frontend:**

```typescript
const validatePhone = (phone: string) => {
  // Nettoyer
  const cleaned = phone.replace(/\D/g, '');
  
  // Vérifier longueur (9-15 chiffres)
  if (cleaned.length < 9 || cleaned.length > 15) {
    return false;
  }
  
  return true;
};
```

---

## ✅ Vérification

Une fois les numéros ajoutés, testez:

```bash
# Test message simple
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "221771234567",
    "message": "Test notification WhatsApp AppTicket !"
  }'
```

**Si vous recevez le message:** ✅ Tout fonctionne !

---

## 🎯 Priorités

### **Étape 1 : Employés actifs**

Ajoutez d'abord les numéros des employés qui passent des commandes.

### **Étape 2 : Restaurants partenaires**

Ajoutez les numéros WhatsApp des restaurants pour qu'ils reçoivent les nouvelles commandes.

### **Étape 3 : Futurs employés**

Rendez le champ téléphone **obligatoire** lors de l'inscription.

---

## 💡 Conseils

- **Demandez le numéro WhatsApp** lors de l'inscription
- **Vérifiez que le numéro existe** sur WhatsApp avant d'enregistrer
- **Formatez automatiquement** les numéros (ajout code pays)
- **Testez avec votre propre numéro** d'abord

---

## 🚫 Problèmes Courants

### **"Numéro non enregistré sur WhatsApp"**

**Solution:** Le numéro n'a pas de compte WhatsApp actif.

### **"Message non envoyé"**

**Solution:** Vérifiez le format du numéro (doit être international).

---

**🎉 Une fois configuré, tous vos employés recevront les notifications WhatsApp automatiquement !**
