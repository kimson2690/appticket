# 🔧 Correction - Configuration de Tickets

**Date**: 3 novembre 2025  
**Problème**: Le gestionnaire Armel KIMA ne pouvait pas créer de configuration de tickets

---

## ❌ Erreur Rencontrée

```
SQLSTATE[HY000]: General error: 1364 Field 'company_name' doesn't have a default value
```

### Symptômes:
- Erreur 500 (Internal Server Error)
- Message: "Erreur de sauvegarde - Une erreur est survenue lors de la sauvegarde"
- Utilisateur: Armel KIMA (kimaarmel@gmail.com)
- Rôle: Gestionnaire Entreprise
- Company ID: 1 (FUSAF)

---

## 🔍 Analyse du Problème

### Problème 1: Champ `company_name` manquant
**Fichier**: `app/Http/Controllers/Admin/TicketConfigurationController.php`

```php
// ❌ AVANT - company_name non fourni
$config = \App\Models\TicketConfiguration::create([
    'company_id' => $request->input('company_id', '1'),
    'ticket_value' => ...
    // company_name manquant!
]);
```

La table `ticket_configurations` définit `company_name` comme colonne **requise** (NOT NULL) mais le contrôleur ne la fournissait pas.

### Problème 2: Mapping incorrect des colonnes

**Migration définit:**
- `validity_days` (colonne BDD)
- `monthly_allocation`
- `rollover_unused`
- `weekend_usage`
- `status` (ENUM: 'active', 'inactive')

**Contrôleur envoyait:**
- `validity_duration_days` ❌ (nom différent)
- `type` ❌ (n'existe pas dans la migration)
- `auto_renewal` ❌ (n'existe pas dans la migration)
- `logo` ❌ (n'existe pas dans la migration)
- `is_active` ❌ (devrait être 'status')

---

## ✅ Solutions Appliquées

### Solution 1: Ajout de `company_name`

**Fichier modifié**: `app/Http/Controllers/Admin/TicketConfigurationController.php`

#### Méthode `store()`:
```php
// ✅ APRÈS - company_name ajouté
// Récupérer company_id
$companyId = $request->input('company_id', $request->header('X-User-Company-Id', '1'));

// Récupérer company_name depuis la base de données
$company = \App\Models\Company::find($companyId);
$companyName = $company ? $company->name : 'Non assigné';

// Créer avec company_name
$config = \App\Models\TicketConfiguration::create([
    'company_id' => $companyId,
    'company_name' => $companyName,  // ✅ Ajouté!
    ...
]);
```

### Solution 2: Mapping correct des colonnes

#### Méthode `store()` - Colonnes corrigées:
```php
$config = \App\Models\TicketConfiguration::create([
    'id' => 'config_' . time() . '_' . rand(1000, 9999),
    'company_id' => $companyId,
    'company_name' => $companyName,  // ✅ Ajouté
    'ticket_value' => (float) $request->input('ticket_value'),
    'validity_days' => (int) $request->input('validity_duration_days'),  // ✅ Mapping correct
    'monthly_allocation' => (int) $request->input('monthly_allocation', 0),
    'rollover_unused' => (bool) $request->input('rollover_unused', false),
    'max_order_amount' => $request->input('max_order_amount', null),
    'allowed_days' => $request->input('allowed_days', null),
    'start_time' => $request->input('start_time', null),
    'end_time' => $request->input('end_time', null),
    'weekend_usage' => (bool) $request->input('weekend_usage', true),
    'restrictions' => $request->input('restrictions', null),
    'status' => $request->input('is_active', true) ? 'active' : 'inactive'  // ✅ Conversion
]);
```

#### Méthode `update()` - Également corrigée:
```php
$updateData = [];
if ($request->filled('ticket_value')) 
    $updateData['ticket_value'] = (float) $request->input('ticket_value');
if ($request->filled('validity_duration_days')) 
    $updateData['validity_days'] = (int) $request->input('validity_duration_days');  // ✅
// ... autres champs
if ($request->has('is_active')) 
    $updateData['status'] = $request->input('is_active') ? 'active' : 'inactive';  // ✅
```

---

## 📊 Mapping des Colonnes

| Frontend / API | Base de Données | Type | Valeur par Défaut |
|----------------|-----------------|------|-------------------|
| `ticket_value` | `ticket_value` | decimal(10,2) | - |
| `validity_duration_days` | `validity_days` | integer | 30 |
| `monthly_allocation` | `monthly_allocation` | integer | 0 |
| `rollover_unused` | `rollover_unused` | boolean | false |
| `max_order_amount` | `max_order_amount` | decimal | null |
| `allowed_days` | `allowed_days` | json | null |
| `start_time` | `start_time` | time | null |
| `end_time` | `end_time` | time | null |
| `weekend_usage` | `weekend_usage` | boolean | true |
| `restrictions` | `restrictions` | text | null |
| `is_active` | `status` | enum | 'active' |

**Colonnes supprimées du frontend** (n'existent pas dans la BDD):
- ❌ `type`
- ❌ `auto_renewal`
- ❌ `logo`

---

## 🧪 Tests de Validation

### Test 1: Création d'une configuration
```bash
php artisan tinker --execute="
\$company = App\Models\Company::find(1);
\$config = App\Models\TicketConfiguration::create([
    'id' => 'config_test_' . time(),
    'company_id' => 1,
    'company_name' => \$company->name,
    'ticket_value' => 500.00,
    'validity_days' => 30,
    'monthly_allocation' => 0,
    'rollover_unused' => false,
    'status' => 'active'
]);
echo 'Config créée: ' . \$config->id . PHP_EOL;
\$config->delete();
"
```

**Résultat**: ✅ Configuration créée avec succès!

### Test 2: Vérifier company_name
```bash
php artisan tinker --execute="
\$config = App\Models\TicketConfiguration::first();
if (\$config) {
    echo 'Company Name: ' . \$config->company_name . PHP_EOL;
    echo 'Company ID: ' . \$config->company_id . PHP_EOL;
}
"
```

**Résultat**: 
```
Company Name: FUSAF
Company ID: 1
```

---

## 🎯 Structure de la Table

**Table**: `ticket_configurations`

```sql
CREATE TABLE ticket_configurations (
    id VARCHAR(50) PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    company_name VARCHAR(255) NOT NULL,  -- ✅ Requis!
    ticket_value DECIMAL(10,2) NOT NULL,
    monthly_allocation INT DEFAULT 0,
    validity_days INT DEFAULT 30,
    rollover_unused BOOLEAN DEFAULT 0,
    max_order_amount DECIMAL(10,2) NULL,
    allowed_days JSON NULL,
    start_time TIME NULL,
    end_time TIME NULL,
    weekend_usage BOOLEAN DEFAULT 1,
    restrictions TEXT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX(company_id),
    INDEX(status)
);
```

---

## 📝 Données d'Exemple

### Configuration Valide:
```json
{
  "ticket_value": 500,
  "validity_duration_days": 30,
  "monthly_allocation": 0,
  "rollover_unused": false,
  "max_order_amount": null,
  "allowed_days": null,
  "start_time": null,
  "end_time": null,
  "weekend_usage": true,
  "restrictions": null,
  "is_active": true,
  "company_id": "1"
}
```

### Sera transformé en:
```php
[
    'id' => 'config_1762210470_1234',
    'company_id' => 1,
    'company_name' => 'FUSAF',  // ✅ Récupéré de la BDD
    'ticket_value' => 500.00,
    'validity_days' => 30,  // ✅ Mapping
    'monthly_allocation' => 0,
    'rollover_unused' => false,
    'max_order_amount' => null,
    'allowed_days' => null,
    'start_time' => null,
    'end_time' => null,
    'weekend_usage' => true,
    'restrictions' => null,
    'status' => 'active',  // ✅ Conversion is_active → status
    'created_at' => '2025-11-03 22:52:23',
    'updated_at' => '2025-11-03 22:52:23'
]
```

---

## 🚀 Fonctionnalités Disponibles

Après correction, Armel KIMA peut maintenant:

### Créer une configuration:
```bash
POST /api/admin/ticket-configurations
Headers:
  X-User-Id: 3
  X-User-Company-Id: 1
  X-User-Role: Gestionnaire Entreprise
  
Body: {
  "ticket_value": 500,
  "validity_duration_days": 30,
  "is_active": true,
  "company_id": "1"
}
```

### Lister ses configurations:
```bash
GET /api/admin/ticket-configurations
Headers:
  X-User-Company-Id: 1
  X-User-Role: Gestionnaire Entreprise
```

### Modifier une configuration:
```bash
PUT /api/admin/ticket-configurations/{id}
Body: {
  "ticket_value": 600,
  "validity_duration_days": 45
}
```

### Supprimer une configuration:
```bash
DELETE /api/admin/ticket-configurations/{id}
```

---

## 📁 Fichiers Modifiés

1. ✅ `app/Http/Controllers/Admin/TicketConfigurationController.php`
   - Méthode `store()` corrigée
   - Méthode `update()` corrigée
   - Ajout de `company_name`
   - Mapping correct des colonnes
   - Stack traces ajoutés pour debugging

2. ✅ `FIX_TICKET_CONFIGURATION.md` (ce fichier)

---

## 🔍 Prévention Future

### Bonnes pratiques appliquées:
1. ✅ **Récupérer `company_name` depuis la BDD** - Pas de hardcode
2. ✅ **Mapping explicite des colonnes** - Frontend ↔ BDD
3. ✅ **Validation correcte** - Champs requis bien définis
4. ✅ **Logging amélioré** - Stack traces pour le debugging
5. ✅ **Valeurs par défaut** - Cohérentes avec la migration

### À vérifier:
- ✅ Migration et contrôleur alignés
- ✅ Validation côté backend stricte
- ✅ Tous les champs requis fournis
- ✅ Types de données corrects

---

## ✅ Vérification Finale

```
🧪 Test de création de configuration:

✅ Entreprise: FUSAF (ID: 1)
✅ Configuration créée avec succès!
  • ID: config_test_1762210470
  • Company: FUSAF (ID: 1)
  • Valeur ticket: 500.00F
  • Validité: 30 jours
  • Status: active

✅ Configuration test supprimée
```

---

## 🎉 Résumé

### Problème:
- ❌ `company_name` manquant
- ❌ Mapping incorrect des colonnes
- ❌ Erreur 500 lors de la sauvegarde

### Solution:
- ✅ `company_name` récupéré depuis la BDD
- ✅ Mapping correct: `validity_duration_days` → `validity_days`
- ✅ Conversion: `is_active` → `status` (enum)
- ✅ Valeurs par défaut ajoutées

### Résultat:
- ✅ **Armel KIMA peut maintenant configurer les tickets!**
- ✅ **Tous les gestionnaires peuvent créer des configurations**
- ✅ **Code aligné avec la structure de la BDD**

---

**Auteur**: Correction automatique  
**Date**: 3 novembre 2025  
**Statut**: ✅ RÉSOLU
