<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription en attente de validation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Rassurant -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Demande Bien Reçue !</h1>
                                        <p style="margin: 14px 0 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 600;">Votre inscription est en cours de traitement</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge En Attente -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 16px 40px; border-radius: 16px; font-size: 16px; font-weight: 700; box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5); letter-spacing: 0.5px;">
                                                ⏳ EN ATTENTE DE VALIDATION
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">Bonjour {{ $employeeName }} ! 👋</h2>
                            <p style="margin: 0 0 36px 0; color: #6b7280; font-size: 17px; line-height: 1.7; text-align: center;">
                                Merci pour votre inscription ! Votre demande a été <strong style="color: #f59e0b;">bien reçue et enregistrée</strong> dans notre système.
                            </p>
                            
                            <!-- Card Timeline -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; margin-bottom: 28px; border: 3px solid #fbbf24; overflow: hidden;">
                                <tr>
                                    <td style="padding: 36px 28px;">
                                        
                                        <!-- Étape 1 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #065f46; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">ÉTAPE 1 TERMINÉE</div>
                                                    <div style="color: #047857; font-size: 16px; font-weight: 700;">Demande soumise avec succès</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Séparateur -->
                                        <div style="width: 3px; height: 20px; background: linear-gradient(to bottom, #10b981, #f59e0b); margin-left: 20px; margin-bottom: 20px;"></div>
                                        
                                        <!-- Étape 2 -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #92400e; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">ÉTAPE 2 EN COURS</div>
                                                    <div style="color: #b45309; font-size: 16px; font-weight: 700;">Validation par {{ $companyName }}</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <!-- Séparateur -->
                                        <div style="width: 3px; height: 20px; background: linear-gradient(to bottom, #f59e0b, #cbd5e1); margin-left: 20px; margin-bottom: 20px;"></div>
                                        
                                        <!-- Étape 3 -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <div style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">ÉTAPE 3 À VENIR</div>
                                                    <div style="color: #94a3b8; font-size: 16px; font-weight: 700;">Activation du compte</div>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Card Notification -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; margin-bottom: 32px; border: 2px solid #93c5fd;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #1e40af; font-size: 15px; font-weight: 600; line-height: 1.6;">
                                                        <strong>Vous serez informé par email</strong><br>
                                                        <span style="opacity: 0.9;">Dès que le gestionnaire aura validé votre demande, vous recevrez une notification.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Message -->
                            <div style="text-align: center; padding: 20px 0;">
                                <p style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 700;">Merci de votre patience ! ⏰</p>
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Le traitement de votre demande peut prendre de quelques heures à quelques jours.
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
