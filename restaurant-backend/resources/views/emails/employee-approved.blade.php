<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte approuvé</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Célébration -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 0; position: relative;">
                            <!-- Confettis decoratifs -->
                            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.5) 35px, rgba(255,255,255,.5) 70px);"></div>
                            
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center; position: relative;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 900; letter-spacing: -1px;">Félicitations ! 🎉</h1>
                                        <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.95); font-size: 17px; font-weight: 600;">Votre compte a été approuvé avec succès</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Bienvenue -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-size: 16px; font-weight: 700; box-shadow: 0 15px 40px rgba(249, 115, 22, 0.5); letter-spacing: 0.5px;">
                                                ✨ COMPTE ACTIVÉ ✨
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">Bonjour {{ $employeeName }} !</h2>
                            <p style="margin: 0 0 40px 0; color: #6b7280; font-size: 17px; line-height: 1.7; text-align: center;">
                                Excellente nouvelle ! Votre demande d'inscription a été <strong style="color: #10b981;">approuvée par {{ $companyName }}</strong>. Vous faites maintenant partie de notre communauté !
                            </p>
                            
                            <!-- Card Accès -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; margin-bottom: 32px; border: 3px solid #10b981; overflow: hidden;">
                                <tr>
                                    <td style="padding: 40px 32px; text-align: center;">
                                        <div style="color: #047857; font-size: 15px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px;">Accès Complet Débloqué</div>
                                        <p style="margin: 0 0 28px 0; color: #065f46; font-size: 16px; font-weight: 600; line-height: 1.7;">
                                            Vous avez maintenant accès à toutes les fonctionnalités de la plateforme :<br>
                                            • Commander des repas<br>
                                            • Gérer vos tickets<br>
                                            • Consulter votre historique
                                        </p>
                                        
                                        <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 20px 54px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 17px; box-shadow: 0 12px 35px rgba(16, 185, 129, 0.5); letter-spacing: 0.3px;">
                                            SE CONNECTER MAINTENANT
                                        </a>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Bienvenue -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 32px; border-radius: 16px; margin-bottom: 32px; border: 2px solid #fbbf24; text-align: center;">
                                <p style="margin: 0; color: #92400e; font-size: 22px; font-weight: 800; line-height: 1.5;">
                                    Bienvenue dans l'équipe AppTicket !
                                </p>
                                <p style="margin: 16px 0 0 0; color: #78350f; font-size: 15px; font-weight: 600; line-height: 1.6;">
                                    Nous sommes ravis de vous compter parmi nous.<br>
                                    Profitez pleinement de tous nos services !
                                </p>
                            </div>
                            
                            <div style="text-align: center; padding: 20px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Besoin d'aide ? Notre équipe est là pour vous accompagner.
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
