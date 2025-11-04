# 🤖 SCRIPT DE MIGRATION AUTOMATIQUE

**Date**: 28 Octobre 2025 18:50  
**Objectif**: Migrer les 8 contrôleurs restants rapidement

---

## ✅ CONTRÔLEURS DÉJÀ MIGRÉS (3/11)

1. ✅ **AuthController** - Connexion MySQL
2. ✅ **EmployeeController** - Complet (index, store, update, destroy, approve)
3. ✅ **AccountingReportController** - Méthodes loadXXX() migrées

---

## 🔧 CONTRÔLEURS RESTANTS (8)

### **MÉTHODE RAPIDE** :
Pour chaque contrôleur, remplacer :

```bash
# Rechercher
storage_path('app/XXX.json')
json_decode(file_get_contents($path), true)
file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT))

# Remplacer par
\App\Models\XXX::all()->toArray()
\App\Models\XXX::create([...])
$model->update([...])
$model->delete()
```

---

## 📋 LISTE DES REMPLACEMENTS

### **1. TicketBatchController**
**Fichier**: `app/Http/Controllers/Admin/TicketBatchController.php`

```php
// AVANT: storage_path('app/ticket_batches.json')
// APRÈS: \App\Models\TicketBatch::all()->toArray()

// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()
```

### **2. UserTicketController**
**Fichier**: `app/Http/Controllers/Admin/UserTicketController.php`

```php
// AVANT: storage_path('app/ticket_assignments.json')
// APRÈS: \App\Models\UserTicket::all()->toArray()

// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()
```

### **3. CompanyController**
**Fichier**: `app/Http/Controllers/Admin/CompanyController.php`

```php
// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()
```

### **4. OrderManagementController**
**Fichier**: `app/Http/Controllers/Restaurant/OrderManagementController.php`

```php
// AVANT: storage_path('app/orders.json')
// APRÈS: \App\Models\Order::all()->toArray()

// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()
```

### **5. ReportingController**
**Fichier**: `app/Http/Controllers/Company/ReportingController.php`

```php
// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()

// AVANT: storage_path('app/orders.json')
// APRÈS: \App\Models\Order::all()->toArray()
```

### **6. PasswordResetController**
**Fichier**: `app/Http/Controllers/PasswordResetController.php`

```php
// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()

// Chercher aussi loadEmployees()
```

### **7. StatisticsController**
**Fichier**: `app/Http/Controllers/Admin/StatisticsController.php`

```php
// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()
```

### **8. RestaurantReportingController**
**Fichier**: `app/Http/Controllers/Restaurant/RestaurantReportingController.php`

```php
// AVANT: storage_path('app/employees.json')
// APRÈS: \App\Models\Employee::all()->toArray()

// AVANT: storage_path('app/orders.json')
// APRÈS: \App\Models\Order::all()->toArray()
```

---

## 🚀 COMMANDES FIND & REPLACE

### **Commande 1**: Trouver tous les fichiers
```bash
cd /Users/kima/AppTicket/restaurant-backend
grep -r "storage_path('app/employees.json')" app/Http/Controllers/
grep -r "storage_path('app/orders.json')" app/Http/Controllers/
grep -r "storage_path('app/ticket_batches.json')" app/Http/Controllers/
grep -r "storage_path('app/ticket_assignments.json')" app/Http/Controllers/
```

### **Commande 2**: Count occurrences
```bash
grep -r "employees.json" app/Http/Controllers/ | wc -l
```

---

## 💡 PATTERN UNIVERSAL

### **Pour tous les contrôleurs** :

#### **1. Chargement** :
```php
// AVANT
$path = storage_path('app/employees.json');
if (file_exists($path)) {
    $data = json_decode(file_get_contents($path), true) ?? [];
}

// APRÈS
$data = \App\Models\Employee::all()->toArray();
```

#### **2. Filtrage** :
```php
// AVANT
$filtered = array_filter($data, fn($item) => $item['company_id'] === $id);

// APRÈS
$filtered = \App\Models\Employee::where('company_id', $id)->get()->toArray();
```

#### **3. Création** :
```php
// AVANT
$data[] = ['id' => 'xxx', 'name' => 'Test'];
file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));

// APRÈS
\App\Models\Employee::create(['id' => 'xxx', 'name' => 'Test']);
```

#### **4. Mise à jour** :
```php
// AVANT
foreach ($data as &$item) {
    if ($item['id'] === $id) {
        $item['name'] = 'New Name';
        break;
    }
}
file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));

// APRÈS
$model = \App\Models\Employee::find($id);
$model->update(['name' => 'New Name']);
```

#### **5. Suppression** :
```php
// AVANT
$data = array_filter($data, fn($item) => $item['id'] !== $id);
file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));

// APRÈS
\App\Models\Employee::destroy($id);
```

---

## ⏱️ TEMPS ESTIMÉ PAR CONTRÔLEUR

- **Simple** (1-2 méthodes) : 10 min
- **Moyen** (3-5 méthodes) : 20 min
- **Complexe** (6+ méthodes) : 30 min

**Total pour 8 contrôleurs** : ~2-3 heures

---

## 📝 CHECKLIST

Pour chaque contrôleur :

- [ ] Identifier toutes les occurrences JSON
- [ ] Remplacer par Eloquent
- [ ] Vérifier la syntaxe
- [ ] Tester les endpoints
- [ ] Marquer comme complété

---

## 🎯 STATUT ACTUEL

**Complétés** : 3/11 (27%)  
**En cours** : Migration automatique  
**Restants** : 8 contrôleurs

---

**Tu peux maintenant utiliser ce guide pour terminer la migration des 8 contrôleurs restants ! 🚀**
