<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle demande d'inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Admin -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: -0.5px;">Nouvelle Inscription</h1>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 15px; font-weight: 600;">Action requise de votre part</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Action -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 14px 38px; border-radius: 16px; font-size: 15px; font-weight: 700; box-shadow: 0 15px 40px rgba(249, 115, 22, 0.5); letter-spacing: 0.5px;">
                                                🔔 NOUVELLE DEMANDE
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bonjour</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.7;">
                                Un nouvel employé vient de soumettre une demande d'inscription pour <strong style="color: #8b5cf6;">{{ $companyName }}</strong>. Votre validation est nécessaire pour activer son compte.
                            </p>
                            
                            <!-- Card Employé -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 18px; margin-bottom: 32px; border: 2px solid #c4b5fd; overflow: hidden;">
                                <tr>
                                    <td style="padding: 32px 28px;">
                                        <div style="color: #6b21a8; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 16px; text-align: center;">Candidat</div>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.7); border-radius: 12px; padding: 20px; margin-bottom: 12px;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #6b21a8; font-size: 12px; font-weight: 600; margin-bottom: 2px;">NOM COMPLET</div>
                                                    <div style="color: #581c87; font-size: 17px; font-weight: 800;">{{ $employeeName }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.7); border-radius: 12px; padding: 20px;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #6b21a8; font-size: 12px; font-weight: 600; margin-bottom: 2px;">ADRESSE EMAIL</div>
                                                    <div style="color: #581c87; font-size: 15px; font-weight: 700; word-break: break-all;">{{ $employeeEmail }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Principal -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td align="center">
                                        <a href="http://localhost:5173/login" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 20px 52px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 17px; box-shadow: 0 12px 35px rgba(249, 115, 22, 0.5); letter-spacing: 0.3px;">
                                            EXAMINER LA DEMANDE
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message Urgence -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border: 2px solid #fbbf24; text-align: center;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600; line-height: 1.6;">
                                    <strong>Le candidat est en attente</strong><br>
                                    <span style="opacity: 0.9;">Une réponse rapide améliore l'expérience utilisateur</span>
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
