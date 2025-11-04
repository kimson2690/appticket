# 📖 GUIDE DE MIGRATION DES CONTRÔLEURS JSON → MYSQL

**Date**: 28 Octobre 2025  
**Status**: Guide pratique

---

## 🎯 OBJECTIF

Migrer tous les contrôleurs qui utilisent `storage_path('app/*.json')` vers **Eloquent MySQL**.

---

## ✅ CONTRÔLEURS DÉJÀ MIGRÉS

1. ✅ **AuthController** - Connexion via MySQL
2. ⏳ **EmployeeController** - Partiellement migré (index + store)

---

## 📋 CONTRÔLEURS À MIGRER

### **Priority 1** (Critique) :
1. **EmployeeController** - Finir update, destroy, approve
2. **AccountingReportController** - Rapport comptable
3. **OrderManagementController** - Gestion commandes

### **Priority 2** (Important) :
4. **TicketBatchController** - Souches tickets
5. **UserTicketController** - Affectations
6. **CompanyController** - Gestion entreprises

### **Priority 3** (Utile) :
7. **ReportingController** - Rapports
8. **PasswordResetController** - Réinitialisation
9. **StatisticsController** - Statistiques
10. **RestaurantReportingController** - Rapports restaurants

---

## 🔧 PATTERN DE MIGRATION

### **AVANT (JSON)** :
```php
// Charger depuis JSON
$filePath = storage_path('app/employees.json');
$employees = json_decode(file_get_contents($filePath), true) ?? [];

// Filtrer
$filtered = array_filter($employees, function($emp) use ($companyId) {
    return $emp['company_id'] === $companyId;
});

// Sauvegarder
file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));
```

### **APRÈS (MySQL)** :
```php
// Charger depuis MySQL
$employees = \App\Models\Employee::query();

// Filtrer
if ($companyId) {
    $employees->where('company_id', $companyId);
}

$employees = $employees->get();

// Sauvegarder (automatique)
// Eloquent gère la persistence automatiquement
```

---

## 📝 EXEMPLES CONCRETS

### **1. INDEX (Liste)** :
```php
// AVANT
$filePath = storage_path('app/employees.json');
$employees = json_decode(file_get_contents($filePath), true) ?? [];

// APRÈS
$employees = \App\Models\Employee::all();
// ou avec filtre
$employees = \App\Models\Employee::where('company_id', $companyId)->get();
```

### **2. STORE (Création)** :
```php
// AVANT
$employees[] = [
    'id' => 'emp_' . time(),
    'name' => $name,
    'email' => $email
];
file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

// APRÈS
$employee = \App\Models\Employee::create([
    'id' => 'emp_' . time(),
    'name' => $name,
    'email' => $email
]);
```

### **3. UPDATE (Modification)** :
```php
// AVANT
foreach ($employees as &$emp) {
    if ($emp['id'] === $id) {
        $emp['name'] = $name;
        break;
    }
}
file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

// APRÈS
$employee = \App\Models\Employee::find($id);
$employee->update(['name' => $name]);
// ou
$employee->name = $name;
$employee->save();
```

### **4. DESTROY (Suppression)** :
```php
// AVANT
$employees = array_filter($employees, fn($emp) => $emp['id'] !== $id);
file_put_contents($filePath, json_encode($employees, JSON_PRETTY_PRINT));

// APRÈS
$employee = \App\Models\Employee::find($id);
$employee->delete();
// ou
\App\Models\Employee::destroy($id);
```

### **5. FIND (Recherche)** :
```php
// AVANT
$employee = collect($employees)->firstWhere('email', $email);

// APRÈS
$employee = \App\Models\Employee::where('email', $email)->first();
```

### **6. COUNT (Comptage)** :
```php
// AVANT
$count = count($employees);

// APRÈS
$count = \App\Models\Employee::count();
// ou avec filtre
$count = \App\Models\Employee::where('status', 'active')->count();
```

---

## 🚀 PROCÉDURE MIGRATION

### **Pour chaque contrôleur** :

1. **Identifier** les appels JSON :
   ```bash
   grep -n "storage_path.*json" NomController.php
   ```

2. **Lister** les méthodes concernées :
   - index
   - store
   - show
   - update
   - destroy
   - custom methods

3. **Remplacer** selon le pattern :
   - `json_decode()` → `Model::query()`
   - `array_filter()` → `->where()`
   - `$array[]` → `Model::create()`
   - `file_put_contents()` → `->save()` ou `->update()`

4. **Tester** chaque méthode

5. **Supprimer** les helpers JSON (optionnel)

---

## 🎯 CONTRÔLEURS PAR ORDRE DE PRIORITÉ

### **1. AccountingReportController** (URGENT)
**Fichier**: `app/Http/Controllers/Company/AccountingReportController.php`

**Méthodes à migrer** :
- `loadEmployees()` → Utiliser `Employee::all()`
- `loadOrders()` → Utiliser `Order::all()`
- `loadTicketBatches()` → Utiliser `TicketBatch::all()`

**Changements** :
```php
// AVANT
private function loadEmployees()
{
    $path = storage_path('app/employees.json');
    return json_decode(file_get_contents($path), true) ?? [];
}

// APRÈS
private function loadEmployees()
{
    return Employee::all()->toArray();
}
```

### **2. EmployeeController** (Finir)
**Méthodes restantes** :
- `update()` - Ligne ~250
- `destroy()` - Ligne ~380
- `approve()` - Ligne ~430

### **3. TicketBatchController**
**Rechercher** : `ticket_batches.json`
**Remplacer par** : `TicketBatch` model

### **4. UserTicketController**
**Rechercher** : `ticket_assignments.json`
**Remplacer par** : `UserTicket` model

---

## ⚠️ POINTS D'ATTENTION

### **1. IDs non-auto-increment**
Les modèles utilisent des IDs string (`emp_xxx`, `order_xxx`).
Toujours spécifier l'ID lors de la création :
```php
Employee::create([
    'id' => 'emp_' . time() . '_' . rand(1000, 9999),
    // ...
]);
```

### **2. Timestamps**
Eloquent gère `created_at` et `updated_at` automatiquement.
Ne pas les spécifier manuellement.

### **3. Relations**
Certains modèles ont des relations (à ajouter si nécessaire) :
```php
// Dans Employee.php
public function orders()
{
    return $this->hasMany(Order::class, 'employee_id');
}
```

### **4. Validation**
Garder la même validation :
```php
$validated = $request->validate([
    'name' => 'required|string',
    'email' => 'required|email|unique:employees,email',
]);
```

---

## 🧪 TESTS APRÈS MIGRATION

Pour chaque contrôleur migré, tester :

```bash
# Test GET
curl http://localhost:8001/api/admin/employees

# Test POST
curl -X POST http://localhost:8001/api/admin/employees \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com"}'

# Test PUT
curl -X PUT http://localhost:8001/api/admin/employees/emp_123 \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Updated"}'

# Test DELETE
curl -X DELETE http://localhost:8001/api/admin/employees/emp_123
```

---

## 📊 AVANCEMENT ESTIMÉ

**Par contrôleur** : 15-30 minutes  
**Total 10 contrôleurs** : 2.5-5 heures

**Déjà fait** : 2 contrôleurs (~20%)  
**Reste** : 8 contrôleurs (~80%)

---

## 💡 CONSEILS

1. **Migrer progressivement** - Un contrôleur à la fois
2. **Tester immédiatement** - Après chaque migration
3. **Garder backup** - Les JSON sont toujours là
4. **Log les erreurs** - Ajouter des `Log::info()` pour débugger

---

## 🎯 RÉSUMÉ

**Pattern simple** :
- `storage_path('app/*.json')` → `Model::query()`
- `json_decode()` → `::all()` ou `::where()`
- `file_put_contents()` → `->save()` ou `::create()`

**Avantages MySQL** :
- Automatique (pas de file_put_contents)
- Rapide (index)
- Sûr (transactions)
- Scalable

---

**Bon courage pour la suite ! 🚀**
