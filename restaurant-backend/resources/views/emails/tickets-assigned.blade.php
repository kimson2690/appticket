<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tickets assignés</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Nouveaux Tickets</h1>
                                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Vos tickets restaurant sont disponibles</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Success -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #f97316; color: #ffffff; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);">
                                                Tickets crédités
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bonjour {{ $employeeName }},</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Bonne nouvelle ! Vous avez reçu <strong style="color: #10b981;">{{ $ticketsCount }} ticket(s) restaurant</strong> sur votre compte.
                            </p>
                            
                            <!-- Card Tickets avec effet visuel -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; overflow: hidden; margin-bottom: 24px; border: 2px solid #10b981;">
                                <tr>
                                    <td style="padding: 32px 24px;">
                                        
                                        <!-- Statistiques -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="padding: 16px; text-align: center; border-right: 2px dashed #10b981;">
                                                    <div style="color: #047857; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Nombre de tickets</div>
                                                    <div style="color: #065f46; font-size: 32px; font-weight: 800; line-height: 1;">{{ $ticketsCount }}</div>
                                                </td>
                                                <td width="50%" style="padding: 16px; text-align: center;">
                                                    <div style="color: #047857; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 8px;">Valeur unitaire</div>
                                                    <div style="color: #065f46; font-size: 28px; font-weight: 800; line-height: 1;">{{ $ticketValue }}<span style="font-size: 16px; opacity: 0.7; margin-left: 4px;">F</span></div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Total avec style premium -->
                                        <div style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border-radius: 16px; border: 2px solid #a7f3d0; text-align: center;">
                                            <div style="color: #047857; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">
                                                Valeur Totale
                                            </div>
                                            <div style="color: #10b981; font-size: 40px; font-weight: 900; letter-spacing: -1px;">
                                                {{ $totalAmount }}
                                                <span style="font-size: 20px; opacity: 0.8; margin-left: 4px;">F CFA</span>
                                            </div>
                                        </div>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Info Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; border: 1px solid #c4b5fd; margin-bottom: 32px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #5b21b6; font-size: 14px; font-weight: 600; line-height: 1.5;">
                                                        Ces tickets sont immédiatement disponibles pour commander vos repas dans les restaurants partenaires.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5); letter-spacing: 0.3px;">
                                            Commander maintenant
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="text-align: center; padding: 24px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                    Profitez bien de vos tickets !
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
