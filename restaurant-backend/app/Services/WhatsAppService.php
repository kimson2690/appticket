<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    private $baseUrl;
    private $enabled;

    public function __construct()
    {
        $this->baseUrl = env('WHATSAPP_SERVICE_URL', 'http://localhost:3001');
        $this->enabled = env('WHATSAPP_ENABLED', false);
    }

    /**
     * Vérifier si le service est actif
     */
    public function isReady()
    {
        if (!$this->enabled) {
            return false;
        }

        try {
            $response = Http::timeout(5)->get("{$this->baseUrl}/health");
            
            if ($response->successful()) {
                $data = $response->json();
                return $data['status'] === 'ready';
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('WhatsApp service health check failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un message WhatsApp simple
     * 
     * @param string $phone Numéro de téléphone (format: 221771234567)
     * @param string $message Message à envoyer
     * @return bool
     */
    public function sendMessage($phone, $message)
    {
        if (!$this->enabled) {
            Log::info('WhatsApp désactivé - Message non envoyé à ' . $phone);
            return false;
        }

        if (empty($phone) || empty($message)) {
            Log::warning('WhatsApp: Téléphone ou message manquant');
            return false;
        }

        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/send", [
                'phone' => $this->formatPhone($phone),
                'message' => $message
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['success']) {
                    Log::info("WhatsApp envoyé avec succès à {$phone}");
                    return true;
                }
            }

            Log::error('WhatsApp envoi échoué: ' . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error('WhatsApp exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoyer un message basé sur un template
     * 
     * @param string $phone
     * @param string $template
     * @param array $data
     * @return bool
     */
    public function sendTemplate($phone, $template, $data)
    {
        if (!$this->enabled) {
            Log::info("WhatsApp désactivé - Template {$template} non envoyé");
            return false;
        }

        if (empty($phone) || empty($template)) {
            Log::warning('WhatsApp: Téléphone ou template manquant');
            return false;
        }

        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/send-template", [
                'phone' => $this->formatPhone($phone),
                'template' => $template,
                'data' => $data
            ]);

            if ($response->successful()) {
                $responseData = $response->json();
                if ($responseData['success']) {
                    Log::info("WhatsApp template '{$template}' envoyé à {$phone}");
                    return true;
                }
            }

            Log::error('WhatsApp template échoué: ' . $response->body());
            return false;

        } catch (\Exception $e) {
            Log::error('WhatsApp template exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Notifier une nouvelle commande (employé)
     */
    public function notifyOrderConfirmation($order, $employee)
    {
        if (empty($employee['phone'])) {
            Log::warning("WhatsApp: Employé {$employee['id']} sans numéro de téléphone");
            return false;
        }

        $data = [
            'employee_name' => $employee['name'],
            'restaurant_name' => $order['restaurant_name'] ?? 'Restaurant',
            'order_id' => $order['id'],
            'total_amount' => number_format($order['total_amount'], 0, '', ' '),
            'delivery_location' => $order['delivery_location']['name'] ?? null,
            'date' => date('d/m/Y à H:i', strtotime($order['created_at'])),
            'items' => array_map(function($item) {
                return [
                    'name' => $item['name'] ?? 'Article',
                    'quantity' => $item['quantity'],
                    'total' => number_format($item['price'] * $item['quantity'], 0, '', ' ')
                ];
            }, $order['items'])
        ];

        return $this->sendTemplate($employee['phone'], 'order_confirmation', $data);
    }

    /**
     * Notifier validation commande (employé)
     */
    public function notifyOrderValidated($order, $employee)
    {
        if (empty($employee['phone'])) {
            return false;
        }

        $data = [
            'employee_name' => $employee['name'],
            'restaurant_name' => $order['restaurant_name'] ?? 'Restaurant',
            'order_id' => $order['id'],
            'total_amount' => number_format($order['total_amount'], 0, '', ' '),
            'delivery_location' => $order['delivery_location']['name'] ?? 'À récupérer',
            'items' => array_map(function($item) {
                return [
                    'name' => $item['name'] ?? 'Article',
                    'quantity' => $item['quantity'],
                    'price' => $item['price']
                ];
            }, $order['items'] ?? [])
        ];

        return $this->sendTemplate($employee['phone'], 'order_validated', $data);
    }

    /**
     * Notifier rejet commande (employé)
     */
    public function notifyOrderRejected($order, $employee)
    {
        if (empty($employee['phone'])) {
            return false;
        }

        $data = [
            'employee_name' => $employee['name'],
            'restaurant_name' => $order['restaurant_name'] ?? 'Restaurant',
            'order_id' => $order['id'],
            'rejection_reason' => $order['rejection_reason'] ?? 'Non spécifiée',
            'items' => array_map(function($item) {
                return [
                    'name' => $item['name'] ?? 'Article',
                    'quantity' => $item['quantity']
                ];
            }, $order['items'] ?? [])
        ];

        return $this->sendTemplate($employee['phone'], 'order_rejected', $data);
    }

    /**
     * Notifier nouvelle commande au restaurant
     */
    public function notifyNewOrderToRestaurant($order, $restaurant, $employee)
    {
        // Le restaurant doit avoir un numéro WhatsApp configuré
        if (empty($restaurant['whatsapp_phone'])) {
            Log::info("Restaurant {$restaurant['id']} sans numéro WhatsApp");
            return false;
        }

        $data = [
            'restaurant_name' => $restaurant['name'],
            'employee_name' => $employee['name'],
            'company_name' => $employee['company_name'] ?? 'Entreprise',
            'order_id' => $order['id'],
            'total_amount' => number_format($order['total_amount'], 0, '', ' '),
            'delivery_location' => $order['delivery_location']['name'] ?? 'Sur place',
            'notes' => $order['notes'] ?? null,
            'items' => array_map(function($item) {
                return [
                    'name' => $item['name'] ?? 'Article',
                    'quantity' => $item['quantity']
                ];
            }, $order['items'])
        ];

        return $this->sendTemplate($restaurant['whatsapp_phone'], 'new_order_restaurant', $data);
    }

    /**
     * Notifier affectation de tickets
     */
    public function notifyTicketsAssigned($employee, $assignment, $batchNumber = null)
    {
        if (empty($employee['phone'])) {
            return false;
        }

        $data = [
            'employee_name' => $employee['name'],
            'tickets_count' => $assignment['tickets_count'],
            'ticket_value' => number_format($assignment['ticket_value'], 0, '', ' '),
            'batch_number' => $batchNumber,
            'validity_start' => date('d/m/Y', strtotime($assignment['validity_start'] ?? 'now')),
            'validity_end' => date('d/m/Y', strtotime($assignment['validity_end'] ?? '+30 days')),
            'new_balance' => number_format($employee['ticket_balance'], 0, '', ' ')
        ];

        return $this->sendTemplate($employee['phone'], 'tickets_assigned', $data);
    }

    /**
     * Formater le numéro de téléphone
     * Exemples:
     * - 71616631 → 22671616631 (Burkina Faso)
     * - +22671616631 → 22671616631
     * - 0022671616631 → 22671616631
     */
    private function formatPhone($phone)
    {
        // Enlever tous les caractères non numériques sauf le +
        $phone = preg_replace('/[^\d+]/', '', $phone);
        
        // Enlever le + ou 00 au début
        $phone = preg_replace('/^(\+|00)/', '', $phone);
        
        // Si le numéro ne commence pas par 226 (code Burkina Faso), l'ajouter
        if (!str_starts_with($phone, '226') && strlen($phone) == 8) {
            $phone = '226' . $phone;
        }
        
        return $phone;
    }
}
