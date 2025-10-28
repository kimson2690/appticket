<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande confirmée</title>
    <style>
        @media (prefers-color-scheme: dark) {
            .dark-mode-bg { background-color: #1a1a1a !important; }
            .dark-mode-text { color: #e5e5e5 !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <!-- Container Principal -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header avec Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 0; position: relative;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center; position: relative;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">AppTicket</h1>
                                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Votre solution tickets restaurant</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Statut (Overlap) -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
                                                Commande confirmée
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Contenu Principal -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            
                            <!-- Message Personnel -->
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bonjour {{ $employeeName }},</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Votre commande chez <strong style="color: #f97316;">{{ $restaurantName }}</strong> a été enregistrée avec succès !
                            </p>
                            
                            <!-- Card Commande -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; overflow: hidden; margin-bottom: 24px; border: 1px solid #fcd34d;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 20px 0; color: #92400e; font-size: 18px; font-weight: 700;">Détails de la commande</h3>
                                        
                                        <!-- Items -->
                                        @foreach($orderItems as $item)
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin-bottom: 12px; padding: 16px; border: 1px solid #e5e7eb;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #1f2937; font-weight: 600; font-size: 15px; margin-bottom: 4px;">{{ $item['name'] }}</div>
                                                    <div style="color: #6b7280; font-size: 13px;">Quantité: {{ $item['quantity'] }}</div>
                                                </td>
                                                <td align="right" style="vertical-align: middle;">
                                                    <div style="color: #f97316; font-weight: 700; font-size: 16px;">{{ $item['price'] }}<span style="font-size: 13px; opacity: 0.8; margin-left: 2px;">F</span></div>
                                                </td>
                                            </tr>
                                        </table>
                                        @endforeach
                                        
                                        <!-- Total -->
                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #fbbf24;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="vertical-align: middle;">
                                                        <span style="color: #92400e; font-size: 16px; font-weight: 700;">Total</span>
                                                    </td>
                                                    <td align="right" style="vertical-align: middle;">
                                                        <span style="color: #f97316; font-size: 24px; font-weight: 800;">{{ $totalAmount }}<span style="font-size: 16px; opacity: 0.8; margin-left: 4px;">F CFA</span></span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Lieu de livraison -->
                            @if(isset($deliveryLocation))
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 1px solid #86efac; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 700;">📍 Lieu de livraison</h3>
                                        <p style="margin: 0 0 8px 0; color: #15803d; font-size: 15px; font-weight: 700;">{{ $deliveryLocation['name'] }}</p>
                                        @if(isset($deliveryLocation['building']) || isset($deliveryLocation['floor']))
                                        <p style="margin: 0 0 8px 0; color: #16a34a; font-size: 14px;">
                                            @if(isset($deliveryLocation['building']))<strong>Bâtiment:</strong> {{ $deliveryLocation['building'] }}@endif
                                            @if(isset($deliveryLocation['building']) && isset($deliveryLocation['floor'])) - @endif
                                            @if(isset($deliveryLocation['floor']))<strong>Étage:</strong> {{ $deliveryLocation['floor'] }}@endif
                                        </p>
                                        @endif
                                        @if(isset($deliveryLocation['address']))
                                        <p style="margin: 0 0 8px 0; color: #16a34a; font-size: 13px;">{{ $deliveryLocation['address'] }}</p>
                                        @endif
                                        @if(isset($deliveryLocation['instructions']))
                                        <p style="margin: 0; color: #166534; font-size: 12px; font-style: italic; padding: 8px; background: rgba(255,255,255,0.5); border-radius: 6px;">
                                            <strong>Instructions:</strong> {{ $deliveryLocation['instructions'] }}
                                        </p>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                            @endif
                            
                            <!-- Statut Alert -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; border: 1px solid #93c5fd; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600; line-height: 1.5;">
                                                        Votre commande est <strong>en attente de validation</strong> par le restaurant.<br>
                                                        <span style="opacity: 0.8;">Vous recevrez un email dès la confirmation.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Final -->
                            <div style="text-align: center; padding: 24px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                    Merci de votre confiance et bon appétit ! 🍽️
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 16px 0; color: #1f2937; font-weight: 700; font-size: 14px;">L'équipe AppTicket</p>
                                        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Burkina Faso</p>
                                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">© 2025 AppTicket. Tous droits réservés.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
    
</body>
</html>
