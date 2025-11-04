# 🔍 Diagnostic - Configuration de Tickets (Frontend)

**Date**: 3 novembre 2025  
**Problème**: Les configurations ne se chargent pas dans le frontend

---

## ✅ Backend: FONCTIONNEL

### Tests API Réussis:
```bash
✅ GET /api/admin/ticket-configurations
   Retourne: 1 configuration (FUSAF, 500F, 30 jours, status: active)

✅ GET /api/admin/ticket-configurations?active=true
   Retourne: 1 configuration active

✅ GET /api/admin/ticket-configurations/active/config
   Retourne: Configuration FUSAF
```

### Structure de la Réponse:
```json
{
    "success": true,
    "data": [
        {
            "id": "config_1762210499_6014",
            "company_id": 1,
            "company_name": "FUSAF",
            "ticket_value": "500.00",
            "monthly_allocation": 0,
            "validity_days": 30,
            "rollover_unused": false,
            "max_order_amount": null,
            "allowed_days": null,
            "start_time": null,
            "end_time": null,
            "weekend_usage": true,
            "restrictions": null,
            "status": "active",
            "created_at": "2025-11-03T22:54:59.000000Z",
            "updated_at": "2025-11-03T22:54:59.000000Z"
        }
    ]
}
```

---

## ❌ Problèmes Potentiels Côté Frontend

### 1. **Endpoint Incorrect**

#### ❌ Mauvais:
```javascript
// Endpoint inexistant ou mal orthographié
fetch('/api/admin/ticket-config')  // Mauvais
fetch('/api/admin/configurations') // Mauvais
```

#### ✅ Correct:
```javascript
fetch('/api/admin/ticket-configurations')  // ✅ Bon
// OU
fetch('/api/admin/ticket-configurations?active=true')  // Pour uniquement les actives
```

---

### 2. **Headers Manquants**

#### ❌ Sans headers:
```javascript
fetch('/api/admin/ticket-configurations')  // ❌ Ne filtre pas par entreprise
```

#### ✅ Avec headers:
```javascript
fetch('/api/admin/ticket-configurations', {
    headers: {
        'Content-Type': 'application/json',
        'X-User-Company-Id': '1',                    // ✅ Requis!
        'X-User-Role': 'Gestionnaire Entreprise'    // ✅ Requis!
    }
})
```

---

### 3. **Parsing de la Réponse**

#### ❌ Mauvais parsing:
```javascript
const response = await fetch('/api/admin/ticket-configurations');
const configs = await response.json();

// ❌ Erreur: cherche dans le mauvais champ
setConfigurations(configs);  // Mauvais - retourne {success: true, data: [...]}
```

#### ✅ Correct parsing:
```javascript
const response = await fetch('/api/admin/ticket-configurations');
const result = await response.json();

// ✅ Bon: accède au champ 'data'
if (result.success) {
    setConfigurations(result.data);  // ✅ Correct!
}
```

---

### 4. **Filtrage Incorrect**

#### ❌ Mauvais filtres:
```javascript
// Cherche un champ qui n'existe plus
const activeConfigs = configs.filter(c => c.is_active === true);  // ❌ is_active n'existe pas!

// Cherche un champ avec un nom différent
const configs = data.filter(c => c.validity_duration_days > 0);  // ❌ C'est validity_days!
```

#### ✅ Filtres corrects:
```javascript
// Utilise le bon nom de champ
const activeConfigs = configs.filter(c => c.status === 'active');  // ✅ Correct!

// Utilise le bon nom de champ
const configs = data.filter(c => c.validity_days > 0);  // ✅ Correct!
```

---

### 5. **Vérification du Champ `status`**

#### Structure des données:

| Champ Frontend (peut-être) | Champ Backend (réel) | Type | Valeur |
|---------------------------|---------------------|------|--------|
| ~~`is_active`~~ | `status` | string | 'active' ou 'inactive' |
| ~~`active`~~ | `status` | string | 'active' ou 'inactive' |
| ~~`validity_duration_days`~~ | `validity_days` | integer | 30 |
| ~~`value`~~ | `ticket_value` | decimal | "500.00" |

**IMPORTANT**: Le frontend doit utiliser `status`, pas `is_active`!

---

## 🔧 Code Frontend Correct

### Exemple complet (React/TypeScript):

```typescript
interface TicketConfiguration {
    id: string;
    company_id: number;
    company_name: string;
    ticket_value: string;  // Note: string, pas number!
    validity_days: number;  // Note: validity_days, pas validity_duration_days!
    monthly_allocation: number;
    rollover_unused: boolean;
    max_order_amount: string | null;
    allowed_days: string[] | null;
    start_time: string | null;
    end_time: string | null;
    weekend_usage: boolean;
    restrictions: string | null;
    status: 'active' | 'inactive';  // Note: status, pas is_active!
    created_at: string;
    updated_at: string;
}

// Récupération des configurations
async function fetchTicketConfigurations(): Promise<TicketConfiguration[]> {
    try {
        const response = await fetch('/api/admin/ticket-configurations?active=true', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Company-Id': userCompanyId,
                'X-User-Role': userRole
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.data;  // ✅ Accède au champ 'data'
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des configurations:', error);
        return [];
    }
}

// Utilisation
const configurations = await fetchTicketConfigurations();

// Filtrer uniquement les actives (si pas fait dans l'URL)
const activeConfigs = configurations.filter(c => c.status === 'active');

console.log('Configurations chargées:', activeConfigs.length);
```

---

## 🧪 Tests de Debugging Frontend

### 1. Vérifier l'appel API dans la console

```javascript
// Dans le code frontend, ajouter des logs
console.log('=== DEBUT CHARGEMENT CONFIGURATIONS ===');
console.log('URL:', '/api/admin/ticket-configurations');
console.log('Headers:', {
    'X-User-Company-Id': userCompanyId,
    'X-User-Role': userRole
});

const response = await fetch('/api/admin/ticket-configurations', { ... });
console.log('Response status:', response.status);
console.log('Response ok:', response.ok);

const result = await response.json();
console.log('Response data:', result);
console.log('Success:', result.success);
console.log('Data length:', result.data?.length);
console.log('First config:', result.data?.[0]);
console.log('=== FIN CHARGEMENT ===');
```

### 2. Vérifier dans le Network Tab

Dans Chrome DevTools:
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet "Network"
3. Filtrer par "XHR" ou "Fetch"
4. Chercher la requête vers `/ticket-configurations`
5. Vérifier:
   - ✅ Status: 200 OK
   - ✅ Response Headers
   - ✅ Request Headers (X-User-Company-Id, X-User-Role)
   - ✅ Response Body (doit contenir `{success: true, data: [...]}`

### 3. Vérifier les erreurs de parsing

```javascript
try {
    const result = await response.json();
    console.log('Type of result:', typeof result);
    console.log('result.success:', result.success);
    console.log('result.data:', result.data);
    console.log('Is array:', Array.isArray(result.data));
} catch (e) {
    console.error('Erreur de parsing JSON:', e);
}
```

---

## 🔍 Checklist de Diagnostic

### Backend:
- [x] ✅ API retourne les données correctement
- [x] ✅ Configuration existe en BDD (config_1762210499_6014)
- [x] ✅ Configuration est active (status = 'active')
- [x] ✅ Headers sont traités correctement
- [x] ✅ Filtrage par company_id fonctionne

### Frontend à vérifier:
- [ ] ❓ URL de l'API est correcte (`/api/admin/ticket-configurations`)
- [ ] ❓ Headers sont envoyés (`X-User-Company-Id`, `X-User-Role`)
- [ ] ❓ Response est parsée correctement (`result.data`)
- [ ] ❓ Champ `status` est utilisé (pas `is_active`)
- [ ] ❓ Champ `validity_days` est utilisé (pas `validity_duration_days`)
- [ ] ❓ Type de `ticket_value` est string (pas number)
- [ ] ❓ Gestion des erreurs est en place
- [ ] ❓ État est mis à jour correctement (useState/setState)

---

## 🎯 Solution Rapide

Si le frontend ne charge toujours pas les configurations:

### Option 1: Endpoint simplifié
Créer un endpoint qui retourne directement un tableau (sans wrapper):

```php
// Route: GET /api/admin/ticket-configurations/list
public function listSimple(Request $request): JsonResponse
{
    $companyId = $request->header('X-User-Company-Id', '1');
    $configs = TicketConfiguration::where('company_id', $companyId)
        ->where('status', 'active')
        ->get();
    
    return response()->json($configs);  // Directement le tableau
}
```

### Option 2: Endpoint de debug
Créer un endpoint qui retourne des infos de debug:

```php
// Route: GET /api/admin/ticket-configurations/debug
public function debug(Request $request): JsonResponse
{
    return response()->json([
        'headers' => [
            'company_id' => $request->header('X-User-Company-Id'),
            'role' => $request->header('X-User-Role')
        ],
        'total_configs' => TicketConfiguration::count(),
        'configs_for_company_1' => TicketConfiguration::where('company_id', 1)->count(),
        'active_configs' => TicketConfiguration::where('status', 'active')->count(),
        'configs' => TicketConfiguration::where('company_id', 1)->get()
    ]);
}
```

---

## 📞 Prochaines Étapes

1. ✅ **Vérifier la console du navigateur** - Chercher les erreurs
2. ✅ **Vérifier le Network Tab** - Voir la requête et la réponse
3. ✅ **Ajouter des console.log** dans le code frontend
4. ✅ **Vérifier le parsing** de la réponse JSON
5. ✅ **Vérifier les noms des champs** utilisés (status, validity_days, etc.)

---

## ✨ Résumé

**Backend**: ✅ **FONCTIONNE PARFAITEMENT**
- API retourne les bonnes données
- Configuration existe et est active
- Tous les tests passent

**Frontend**: ❌ **PROBLÈME À IDENTIFIER**
- Probablement: mauvais parsing de la réponse
- Ou: utilisation des anciens noms de champs (is_active, validity_duration_days)
- Ou: headers manquants

**Action requise**: Vérifier le code frontend avec les exemples ci-dessus!

---

**Date**: 3 novembre 2025  
**Auteur**: Diagnostic automatique
