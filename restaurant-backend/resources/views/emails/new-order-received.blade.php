<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle commande</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Restaurant -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">Nouvelle Commande !</h1>
                                        <p style="margin: 14px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 600;">{{ $restaurantName }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Urgent -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-size: 16px; font-weight: 700; box-shadow: 0 15px 40px rgba(249, 115, 22, 0.6); letter-spacing: 0.5px; animation: pulse 2s infinite;">
                                                🔔 COMMANDE À TRAITER
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Contenu -->
                    <tr>
                        <td style="padding: 50px 40px;">
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">Nouvelle demande client 🎯</h2>
                            <p style="margin: 0 0 36px 0; color: #6b7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                Une commande vient d'être passée par un client. Merci de la traiter rapidement pour garantir une excellente expérience.
                            </p>
                            
                            <!-- Card Client -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; margin-bottom: 24px; border: 2px solid #93c5fd;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #075985; font-size: 12px; font-weight: 600; margin-bottom: 2px;">CLIENT</div>
                                                    <div style="color: #0c4a6e; font-size: 18px; font-weight: 800;">{{ $employeeName }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Card Commande -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 18px; margin-bottom: 28px; border: 3px solid #fbbf24; overflow: hidden;">
                                <tr>
                                    <td style="padding: 28px 24px;">
                                        
                                        <h3 style="margin: 0 0 20px 0; color: #92400e; font-size: 18px; font-weight: 700;">Détails de la commande</h3>
                                        
                                        <!-- Items -->
                                        @foreach($orderItems as $item)
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.9); border-radius: 8px; margin-bottom: 10px; padding: 14px; border: 1px solid #fbbf24;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #78350f; font-weight: 700; font-size: 15px; margin-bottom: 2px;">{{ $item['name'] }}</div>
                                                    <div style="color: #92400e; font-size: 13px;">Quantité: <strong>{{ $item['quantity'] }}</strong></div>
                                                </td>
                                            </tr>
                                        </table>
                                        @endforeach
                                        
                                        <!-- Total -->
                                        <div style="margin-top: 20px; padding-top: 20px; border-top: 3px dashed #fbbf24;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td style="vertical-align: middle;">
                                                        <span style="color: #92400e; font-size: 17px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Total</span>
                                                    </td>
                                                    <td align="right" style="vertical-align: middle;">
                                                        <span style="color: #f97316; font-size: 28px; font-weight: 900; letter-spacing: -1px;">{{ $totalAmount }}<span style="font-size: 18px; opacity: 0.8; margin-left: 4px;">F CFA</span></span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Lieu de livraison -->
                            @if(isset($deliveryLocation))
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; border: 2px solid #86efac; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 14px 0; color: #166534; font-size: 17px; font-weight: 700;">📍 Adresse de livraison</h3>
                                        <p style="margin: 0 0 10px 0; color: #15803d; font-size: 16px; font-weight: 800;">{{ $deliveryLocation['name'] }}</p>
                                        @if(isset($deliveryLocation['building']) || isset($deliveryLocation['floor']))
                                        <p style="margin: 0 0 10px 0; color: #16a34a; font-size: 14px; font-weight: 600;">
                                            @if(isset($deliveryLocation['building']))<strong>Bâtiment:</strong> {{ $deliveryLocation['building'] }}@endif
                                            @if(isset($deliveryLocation['building']) && isset($deliveryLocation['floor'])) - @endif
                                            @if(isset($deliveryLocation['floor']))<strong>Étage:</strong> {{ $deliveryLocation['floor'] }}@endif
                                        </p>
                                        @endif
                                        @if(isset($deliveryLocation['address']))
                                        <p style="margin: 0 0 10px 0; color: #16a34a; font-size: 14px;">📌 {{ $deliveryLocation['address'] }}</p>
                                        @endif
                                        @if(isset($deliveryLocation['instructions']))
                                        <div style="margin: 10px 0 0 0; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 8px; border: 1px dashed #86efac;">
                                            <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 600;">
                                                <strong>⚠️ Instructions de livraison:</strong><br>
                                                <span style="font-weight: 500;">{{ $deliveryLocation['instructions'] }}</span>
                                            </p>
                                        </div>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                            @endif
                            
                            <!-- CTA Actions -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 20px 54px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 17px; box-shadow: 0 12px 35px rgba(16, 185, 129, 0.5); letter-spacing: 0.3px;">
                                            VALIDER OU REJETER
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Temps Réel -->
                            <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 12px; border: 2px solid #fca5a5; text-align: center;">
                                <p style="margin: 0; color: #991b1b; font-size: 15px; font-weight: 700; line-height: 1.6;">
                                    <strong>Action rapide recommandée</strong><br>
                                    <span style="font-weight: 600; opacity: 0.9;">Une réponse sous 10 minutes améliore la satisfaction client</span>
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
