# 🚀 PLAN DE MIGRATION JSON → MYSQL

Date: 28 Octobre 2025  
Status: **EN COURS**

---

## 📊 VUE D'ENSEMBLE

### Données à migrer (10 fichiers JSON, ~1.1 MB):
1. ✅ **employees.json** (8.6K) - 16 employés
2. ✅ **orders.json** (45K) - 57 commandes
3. ⏳ **ticket_batches.json** (63K)
4. ⏳ **ticket_assignments.json** (10K)
5. ⏳ **ticket_configurations.json** (85K)
6. ⏳ **menu_items.json** (746K) - Le plus gros
7. ⏳ **daily_menus.json** (2K)
8. ⏳ **notifications.json** (126K)
9. ⚠️  **restaurants.json** (3.5K) - Doublon avec MySQL
10. ⚠️  **password_reset_tokens.json** (2B) - Doublon avec MySQL

---

## ✅ PHASE 1: MIGRATIONS CRÉÉES

### Tables nouvelles créées:
1. ✅ `employees` - Structure complète (id, name, email, password, company_id, department, position, ticket_balance, status, etc.)
2. ✅ `notifications` - Structure complète (id, type, title, message, user_id, role, company_id, read, metadata, etc.)
3. ✅ `orders` - Structure recréée (id, employee_id, restaurant_id, items (JSON), total_amount, ticket_amount_used, status, etc.)

### Tables mises à jour:
- `orders` - Drop & recreate avec structure JSON correcte
- `order_items` - Supprimée (items stockés en JSON dans orders)

---

## ⏳ PHASE 2: MIGRATIONS À CRÉER

### Tables à créer:
1. ⏳ `ticket_batches` - Modifier structure existante
2. ⏳ `user_tickets` (ticket_assignments)
3. ⏳ `ticket_configurations`
4. ⏳ `menu_items` (dishes)
5. ⏳ `daily_menus`

---

## 📝 PHASE 3: MODÈLES ELOQUENT (À CRÉER)

```bash
php artisan make:model Employee
php artisan make:model Order
php artisan make:model TicketBatch
php artisan make:model UserTicket
php artisan make:model TicketConfiguration
php artisan make:model MenuItem
php artisan make:model DailyMenu
php artisan make:model Notification
```

---

## 🔄 PHASE 4: SEEDERS DE MIGRATION

Créer des seeders pour migrer les données JSON → MySQL:

```bash
php artisan make:seeder MigrateEmployeesSeeder
php artisan make:seeder MigrateOrdersSeeder
php artisan make:seeder MigrateTicketBatchesSeeder
php artisan make:seeder MigrateTicketAssignmentsSeeder
php artisan make:seeder MigrateNotificationsSeeder
php artisan make:seeder MigrateMenuItemsSeeder
```

**Logique des seeders:**
1. Lire le fichier JSON
2. Parser les données
3. Insérer en base MySQL (bulk insert si possible)
4. Backup JSON original
5. Logger les résultats

---

## 🔧 PHASE 5: MODIFICATION DES CONTRÔLEURS

### Contrôleurs à modifier (utiliser Eloquent au lieu de JSON):

1. ⏳ `AuthController` → Employee model
2. ⏳ `EmployeeController` → Employee model
3. ⏳ `OrderController` → Order model
4. ⏳ `TicketBatchController` → TicketBatch model
5. ⏳ `UserTicketController` → UserTicket model
6. ⏳ `MenuItemController` → MenuItem model
7. ⏳ `NotificationController` → Notification model
8. ⏳ `AccountingReportController` → Order, TicketBatch, Employee models

**Exemple de changement:**
```php
// AVANT (JSON)
$employees = json_decode(file_get_contents(storage_path('app/employees.json')), true);

// APRÈS (Eloquent)
$employees = Employee::where('company_id', $companyId)->get();
```

---

## 🧪 PHASE 6: TESTS

### Tests à effectuer:
1. ⏳ Test connexion employés
2. ⏳ Test création commande
3. ⏳ Test affectation tickets
4. ⏳ Test notifications
5. ⏳ Test rapport comptable
6. ⏳ Test performances (JSON vs MySQL)

---

## 📦 PHASE 7: BACKUP & NETTOYAGE

1. ⏳ Backup complet des fichiers JSON
2. ⏳ Vérifier intégrité données MySQL
3. ⏳ Supprimer fichiers JSON (ou archiver)
4. ⏳ Nettoyer code inutilisé

---

## 🎯 AVANTAGES DE LA MIGRATION

### Avant (JSON):
❌ Pas de transactions ACID  
❌ Pas de relations (foreign keys)  
❌ Pas d'index → Performances limitées  
❌ Fichiers gitignorés → Pas de backup  
❌ Concurrence problématique  
❌ Requêtes complexes difficiles  

### Après (MySQL):
✅ Transactions ACID garanties  
✅ Relations entre tables (foreign keys)  
✅ Index pour performances optimales  
✅ Backup automatique  
✅ Concurrence gérée nativement  
✅ Requêtes SQL puissantes  
✅ Intégrité des données  
✅ Scalabilité  

---

## 📅 TIMELINE ESTIMÉE

- **Phase 1** (Migrations): ✅ 1h - **TERMINÉ**
- **Phase 2** (Migrations restantes): ⏳ 2h
- **Phase 3** (Modèles Eloquent): ⏳ 1h
- **Phase 4** (Seeders): ⏳ 3h
- **Phase 5** (Modification contrôleurs): ⏳ 4h
- **Phase 6** (Tests): ⏳ 2h
- **Phase 7** (Backup & nettoyage): ⏳ 1h

**Total estimé: ~14 heures de développement**

---

## ⚠️ RISQUES & PRÉCAUTIONS

1. **Perte de données**: Toujours backup avant migration
2. **Downtime**: Prévoir maintenance pendant migration
3. **Rollback**: Garder JSON backup pour rollback si problème
4. **Tests**: Tester en environnement de dev d'abord

---

## 🚀 PROCHAINE ÉTAPE

**Actuellement**: Phase 1 terminée (3 migrations créées)

**Prochaine action**: 
1. Créer les 5 migrations restantes
2. Lancer `php artisan migrate`
3. Créer les modèles Eloquent
4. Créer les seeders de migration

---

**Créé par**: Cascade AI  
**Dernière mise à jour**: 28 Oct 2025
