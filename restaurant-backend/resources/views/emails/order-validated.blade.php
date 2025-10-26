<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande validée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Success -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Commande Validée !</h1>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 500;">Votre repas est en préparation</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Confirmé -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #f97316; color: #ffffff; padding: 14px 36px; border-radius: 14px; font-size: 15px; font-weight: 700; box-shadow: 0 12px 35px rgba(249, 115, 22, 0.4);">
                                                Confirmée par le restaurant
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Bonne nouvelle {{ $employeeName }} !</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 17px; line-height: 1.7;">
                                Votre commande chez <strong style="color: #10b981;">{{ $restaurantName }}</strong> a été <strong>acceptée et validée</strong>. Le restaurant prépare actuellement votre repas avec soin.
                            </p>
                            
                            <!-- Card Célébration -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; margin-bottom: 32px; border: 3px solid #10b981; overflow: hidden;">
                                <tr>
                                    <td style="padding: 40px 32px; text-align: center;">
                                        <div style="color: #047857; font-size: 15px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px;">Montant Total</div>
                                        <div style="color: #065f46; font-size: 48px; font-weight: 900; letter-spacing: -2px; line-height: 1;">{{ $totalAmount }}
                                            <span style="font-size: 24px; opacity: 0.8; margin-left: 6px;">F CFA</span>
                                        </div>
                                        
                                        <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border-radius: 16px;">
                                            <p style="margin: 0; color: #047857; font-size: 16px; font-weight: 700; line-height: 1.6;">
                                                Votre repas est en cours de préparation<br>
                                                <span style="font-size: 14px; opacity: 0.9;">Le restaurant met tout en œuvre pour vous satisfaire</span>
                                            </p>
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message final -->
                            <div style="text-align: center; padding: 32px 0;">
                                <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 28px; font-weight: 700;">Bon appétit ! 🍽️</p>
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Merci pour votre confiance. Profitez bien de votre repas !
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
