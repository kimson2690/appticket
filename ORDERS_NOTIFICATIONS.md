# SYSTÈME DE NOTIFICATIONS DE COMMANDES

## 📋 Vue d'ensemble

Extension du système de notifications pour couvrir les événements liés aux commandes de repas et à la gestion des souches de tickets.

---

## 🎯 Événements notifiés

### 1. **COMMANDE CRÉÉE**

#### **Notification pour l'employé (confirmation initiale)**
- **Type:** `success`
- **Titre:** "Commande confirmée"
- **Message:** "Votre commande chez [Restaurant] d'un montant de [Montant]F a été créée avec succès."
- **Destinataire:** Employé qui a passé la commande (`user_id`)
- **Action:** `/employee/orders` (voir mes commandes)
- **Metadata:**
  - `order_id`: ID de la commande
  - `restaurant_name`: Nom du restaurant
  - `total_amount`: Montant total
  - `items_count`: Nombre d'articles

#### **Notification pour le gestionnaire restaurant**
- **Type:** `info`
- **Titre:** "Nouvelle commande"
- **Message:** "[Employé] a passé une commande de [Montant]F chez [Restaurant]."
- **Destinataire:** Gestionnaires restaurant (`role: Gestionnaire Restaurant`)
- **Filtrage:** Par `restaurant_id`
- **Action:** `/admin/orders` (gérer les commandes)
- **Metadata:**
  - `order_id`: ID de la commande
  - `employee_name`: Nom de l'employé
  - `employee_id`: ID de l'employé
  - `restaurant_name`: Nom du restaurant
  - `total_amount`: Montant total
  - `items_count`: Nombre d'articles

---

### 2. **COMMANDE VALIDÉE** ✅ *NOUVEAU*

#### **Notification pour l'employé**
- **Type:** `success`
- **Titre:** "Commande validée ✅"
- **Message:** "Votre commande chez [Restaurant] d'un montant de [Montant]F a été validée par le restaurant. Votre repas est en préparation !"
- **Destinataire:** Employé qui a passé la commande (`user_id`)
- **Action:** `/employee/orders` (voir mes commandes)
- **Metadata:**
  - `order_id`: ID de la commande
  - `restaurant_name`: Nom du restaurant
  - `total_amount`: Montant total
  - `confirmed_by`: Nom du gestionnaire qui a validé
  - `confirmed_at`: Date/heure de validation

---

### 3. **COMMANDE REJETÉE** ❌ *NOUVEAU*

#### **Notification pour l'employé**
- **Type:** `warning`
- **Titre:** "Commande rejetée ❌"
- **Message:** "Votre commande chez [Restaurant] d'un montant de [Montant]F a été rejetée. Raison: [Raison]. Votre solde de tickets a été remboursé."
- **Destinataire:** Employé qui a passé la commande (`user_id`)
- **Action:** `/employee/orders` (voir mes commandes)
- **Metadata:**
  - `order_id`: ID de la commande
  - `restaurant_name`: Nom du restaurant
  - `total_amount`: Montant total
  - `rejection_reason`: Raison du rejet
  - `rejected_by`: Nom du gestionnaire qui a rejeté
  - `rejected_at`: Date/heure de rejet
  - `refunded`: true (confirmation remboursement)

---

### 4. **SOUCHE DE TICKETS CRÉÉE**

#### **Notification pour le gestionnaire**
- **Type:** `success`
- **Titre:** "Souche créée avec succès"
- **Message:** "Une nouvelle souche de [X] tickets d'une valeur totale de [Montant]F a été créée ([Numéro souche])."
- **Destinataire:** Gestionnaires de l'entreprise (`role: Gestionnaire Entreprise`)
- **Filtrage:** Par `company_id`
- **Action:** `/admin/ticket-batches` (voir les souches)
- **Metadata:**
  - `batch_id`: ID de la souche
  - `batch_number`: Numéro de la souche (ex: SOUCHE-E123-20251024-0001)
  - `total_tickets`: Nombre de tickets
  - `ticket_value`: Valeur unitaire
  - `total_value`: Valeur totale
  - `type`: Type de ticket (standard/premium/bonus)

---

## 🔧 Implémentation technique

### **Backend - OrderController.php**

```php
use App\Http\Controllers\Admin\NotificationController;

public function store(Request $request)
{
    // ... création de la commande ...
    
    // Récupérer les infos du restaurant
    $restaurants = $this->loadRestaurants();
    $restaurant = collect($restaurants)->firstWhere('id', $validated['restaurant_id']);
    $restaurantName = $restaurant['name'] ?? 'Restaurant';

    // Notification pour l'employé
    NotificationController::createNotification([
        'type' => 'success',
        'title' => 'Commande confirmée',
        'message' => "Votre commande chez $restaurantName d'un montant de {$totalAmount}F a été créée avec succès.",
        'user_id' => $userId,
        'action_url' => '/employee/orders',
        'metadata' => [...]
    ]);

    // Notification pour le gestionnaire du restaurant
    if (isset($restaurant['manager_id'])) {
        NotificationController::createNotification([
            'type' => 'info',
            'title' => 'Nouvelle commande',
            'message' => "$userName a passé une commande de {$totalAmount}F chez $restaurantName.",
            'user_id' => $restaurant['manager_id'],
            'restaurant_id' => $validated['restaurant_id'],
            'action_url' => '/admin/orders',
            'metadata' => [...]
        ]);
    }
}
```

### **Backend - TicketBatchController.php**

```php
public function store(Request $request): JsonResponse
{
    // ... création de la souche ...
    
    // Notification pour le gestionnaire
    $totalValue = $totalTickets * $ticketValue;
    NotificationController::createNotification([
        'type' => 'success',
        'title' => 'Souche créée avec succès',
        'message' => "Une nouvelle souche de {$totalTickets} tickets d'une valeur totale de {$totalValue}F a été créée ($batchNumber).",
        'role' => 'Gestionnaire Entreprise',
        'company_id' => $companyId,
        'action_url' => '/admin/ticket-batches',
        'metadata' => [...]
    ]);
}
```

---

## 📊 Flux de notifications - Commande

```
┌─────────────┐
│  Employé    │
│ passe une   │
│  commande   │
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────────┐              ┌──────────────────┐
│  Notification    │              │  Notification    │
│    Employé       │              │   Gestionnaire   │
│                  │              │   Restaurant     │
│ Type: SUCCESS    │              │ Type: INFO       │
│ "Confirmée"      │              │ "Nouvelle"       │
│ Action: /orders  │              │ Action: /orders  │
└──────────────────┘              └──────────────────┘
       │                                     │
       ▼                                     ▼
  Voir mes                            Gérer les
  commandes                           commandes
```

---

## 📊 Flux de notifications - Souche

```
┌──────────────┐
│ Gestionnaire │
│   crée une   │
│    souche    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│    Notification      │
│   Gestionnaires      │
│   de l'entreprise    │
│                      │
│ Type: SUCCESS        │
│ "Souche créée"       │
│ Action: /batches     │
└──────────────────────┘
       │
       ▼
  Voir toutes
  les souches
```

---

## 🎨 Affichage dans l'interface

### **Exemple - Notification commande (Employé)**

```
┌────────────────────────────────────────────┐
│ 🔔                                      [3]│
└────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────┐
│ Notifications                       [✓] [✕]│
├────────────────────────────────────────────┤
│                                            │
│ ✅ Commande confirmée            Il y a 2m │
│    Votre commande chez Le Baobab d'un      │
│    montant de 2500F a été créée avec       │
│    succès.                                 │
│    → Voir mes commandes                    │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ ✅ Tickets affectés              Il y a 1h │
│    10 tickets d'une valeur de 5000F vous   │
│    ont été affectés.                       │
│                                            │
└────────────────────────────────────────────┘
```

### **Exemple - Notification commande (Gestionnaire restaurant)**

```
┌────────────────────────────────────────────┐
│ 🔔                                      [2]│
└────────────────────────────────────────────┘
      │
      ▼
┌────────────────────────────────────────────┐
│ Notifications                       [✓] [✕]│
├────────────────────────────────────────────┤
│                                            │
│ ℹ️  Nouvelle commande            Il y a 5m │
│    KIMA Astrid a passé une commande de     │
│    2500F chez Le Baobab.                   │
│    → Gérer les commandes                   │
│                                            │
├────────────────────────────────────────────┤
│                                            │
│ ℹ️  Nouvelle commande           Il y a 15m │
│    NANA Jean a passé une commande de       │
│    1500F chez Le Baobab.                   │
│                                            │
└────────────────────────────────────────────┘
```

### **Exemple - Notification souche (Gestionnaire entreprise)**

```
┌────────────────────────────────────────────┐
│ ℹ️  Souche créée avec succès     Il y a 10m│
│                                            │
│    Une nouvelle souche de 50 tickets       │
│    d'une valeur totale de 25,000F a été    │
│    créée (SOUCHE-E123-20251024-0001).      │
│    → Voir les souches                      │
│                                            │
└────────────────────────────────────────────┘
```

---

## 📈 Cas d'usage

### **Scénario 1 : Commande d'un employé**

1. **Astrid** (employée) passe une commande de **Poulet Yassa (2500F)** chez **Le Baobab**
2. ✅ **Notification SUCCESS** pour Astrid : "Commande confirmée..."
3. ℹ️ **Notification INFO** pour le gestionnaire du restaurant : "Astrid a passé une commande..."
4. Astrid clique sur la notification → Redirigé vers `/employee/orders`
5. Gestionnaire clique sur sa notification → Redirigé vers `/admin/orders`

### **Scénario 2 : Création de souche**

1. **Gestionnaire** crée une souche de **50 tickets × 500F = 25,000F**
2. ✅ **Notification SUCCESS** pour tous les gestionnaires de l'entreprise
3. Message contient le numéro de souche : **SOUCHE-E123-20251024-0001**
4. Clic sur notification → Redirigé vers `/admin/ticket-batches`
5. La souche apparaît dans la liste avec toutes ses informations

---

## 🔄 Intégration avec le système existant

### **Notifications déjà existantes :**
- ✅ Inscription employé (pending)
- ✅ Approbation employé
- ✅ Rejet employé
- ✅ Affectation tickets (individuelle)
- ✅ Affectation tickets (groupée)

### **Nouvelles notifications ajoutées :**
- ✅ Commande créée (employé)
- ✅ Commande créée (gestionnaire restaurant)
- ✅ Souche créée (gestionnaire entreprise)

---

## 🎯 Filtrage des notifications

| Événement | Destinataire | Filtrage |
|-----------|--------------|----------|
| **Commande confirmée** | Employé | `user_id` = employé |
| **Nouvelle commande** | Gestionnaire restaurant | `user_id` = manager_id du restaurant |
| **Souche créée** | Gestionnaires entreprise | `role` = "Gestionnaire Entreprise" ET `company_id` |

---

## 📊 Statistiques possibles

Avec ces notifications, on peut tracker :
- **Nombre de commandes** par restaurant
- **Montant total** des commandes
- **Nombre de souches** créées
- **Valeur totale** des tickets distribués
- **Taux d'engagement** (notifications lues vs non lues)

---

## 🚀 Évolutions futures possibles

### **Commandes :**
- ❌ Commande annulée
- 🔄 Commande en préparation
- ✅ Commande prête
- 🚚 Commande livrée
- ⭐ Demande d'évaluation

### **Tickets :**
- ⏰ Tickets bientôt expirés (7 jours avant)
- 🎉 Renouvellement automatique de tickets
- 💰 Solde tickets faible (< 1000F)

### **Système :**
- 📢 Annonces importantes
- 🎁 Promotions spéciales
- 🆕 Nouvelles fonctionnalités

---

## ✅ Résumé

Le système de notifications de commandes permet de :
1. ✅ **Confirmer les commandes** aux employés
2. ✅ **Alerter les gestionnaires** des nouvelles commandes
3. ✅ **Informer sur les souches** créées
4. ✅ **Tracer toutes les actions** importantes
5. ✅ **Améliorer l'expérience** utilisateur

**Tous les événements critiques sont maintenant notifiés de manière cohérente et élégante !** 🎉
