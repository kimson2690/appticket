<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande rejetée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Empathique -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Commande Non Acceptée</h1>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 500;">Le restaurant n'a pas pu traiter votre demande</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Annulé -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 14px 36px; border-radius: 14px; font-size: 15px; font-weight: 700; box-shadow: 0 12px 35px rgba(245, 158, 11, 0.4);">
                                                Commande annulée
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Contenu -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bonjour {{ $employeeName }},</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.7;">
                                Nous sommes désolés de vous informer que votre commande chez <strong style="color: #ef4444;">{{ $restaurantName }}</strong> n'a pas pu être acceptée. Ne vous inquiétez pas, votre solde a été automatiquement remboursé.
                            </p>
                            
                            <!-- Card Détails -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; margin-bottom: 24px; border: 2px solid #fca5a5; overflow: hidden;">
                                <tr>
                                    <td style="padding: 28px 24px;">
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td width="50%" style="padding: 16px; background: rgba(255,255,255,0.7); border-radius: 12px; margin-right: 8px;">
                                                    <div style="color: #991b1b; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Montant</div>
                                                    <div style="color: #7f1d1d; font-size: 24px; font-weight: 800;">{{ $totalAmount }}<span style="font-size: 14px; opacity: 0.8; margin-left: 4px;">F</span></div>
                                                </td>
                                                <td width="8"></td>
                                                <td width="50%" style="padding: 16px; background: rgba(255,255,255,0.7); border-radius: 12px;">
                                                    <div style="color: #991b1b; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Statut</div>
                                                    <div style="color: #7f1d1d; font-size: 16px; font-weight: 700;">Rejetée</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <div style="background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%); padding: 20px; border-radius: 12px; border: 1px solid #fecaca;">
                                            <div style="color: #991b1b; font-size: 13px; font-weight: 600; margin-bottom: 4px;">Raison du rejet</div>
                                            <div style="color: #7f1d1d; font-size: 15px; font-weight: 600; line-height: 1.5;">{{ $rejectionReason }}</div>
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Lieu de livraison -->
                            @if(isset($deliveryLocation))
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; border: 2px solid #86efac; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <h3 style="margin: 0 0 14px 0; color: #166534; font-size: 17px; font-weight: 700;">📍 Lieu de livraison initialement sélectionné</h3>
                                        <p style="margin: 0 0 10px 0; color: #15803d; font-size: 16px; font-weight: 800;">{{ $deliveryLocation['name'] }}</p>
                                        @if(isset($deliveryLocation['building']) || isset($deliveryLocation['floor']))
                                        <p style="margin: 0 0 10px 0; color: #16a34a; font-size: 14px; font-weight: 600;">
                                            @if(isset($deliveryLocation['building']))<strong>Bâtiment:</strong> {{ $deliveryLocation['building'] }}@endif
                                            @if(isset($deliveryLocation['building']) && isset($deliveryLocation['floor'])) - @endif
                                            @if(isset($deliveryLocation['floor']))<strong>Étage:</strong> {{ $deliveryLocation['floor'] }}@endif
                                        </p>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                            @endif
                            
                            <!-- Card Remboursement -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; margin-bottom: 32px; border: 2px solid #10b981;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 700; line-height: 1.6;">
                                            Remboursement Automatique<br>
                                            <span style="font-size: 14px; font-weight: 600; opacity: 0.9;">Votre solde de {{ $totalAmount }} F a été crédité instantanément sur votre compte.</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Encouragement -->
                            <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 2px solid #c4b5fd; text-align: center;">
                                <p style="margin: 0 0 20px 0; color: #5b21b6; font-size: 16px; font-weight: 600; line-height: 1.6;">
                                    N'hésitez pas à commander à nouveau !<br>
                                    <span style="font-size: 14px; opacity: 0.9;">De nombreux autres restaurants sont disponibles</span>
                                </p>
                                <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4);">
                                    Découvrir les restaurants
                                </a>
                            </div>
                            
                            <div style="text-align: center; padding: 16px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Nous restons à votre disposition pour toute question.
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
