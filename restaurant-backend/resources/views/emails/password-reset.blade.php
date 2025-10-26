<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Sécurité -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Sécurité du Compte</h1>
                                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 500;">Réinitialisation de mot de passe</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Alert -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);">
                                                Demande de réinitialisation
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
                            
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Bonjour {{ $userName }},</h2>
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
                                Vous avez demandé la <strong style="color: #3b82f6;">réinitialisation de votre mot de passe</strong>. Pour des raisons de sécurité, utilisez le lien ci-dessous pour créer un nouveau mot de passe sécurisé.
                            </p>
                            
                            <!-- Card Info Sécurité -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 16px; margin-bottom: 32px; border: 2px solid #93c5fd;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600; line-height: 1.6;">
                                                        <strong>Ce lien est valide pendant 60 minutes.</strong><br>
                                                        <span style="opacity: 0.9;">Après ce délai, vous devrez refaire une demande.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Principal -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $resetUrl }}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 18px 48px; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.5); letter-spacing: 0.3px;">
                                            Réinitialiser mon mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Lien alternatif -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td>
                                        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 13px; font-weight: 600;">
                                            Si le bouton ne fonctionne pas, copiez ce lien :
                                        </p>
                                        <div style="background: #ffffff; padding: 14px; border-radius: 8px; border: 1px dashed #d1d5db; word-break: break-all;">
                                            <a href="{{ $resetUrl }}" style="color: #3b82f6; font-size: 12px; text-decoration: none; font-family: 'Courier New', monospace;">{{ $resetUrl }}</a>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Avertissement Sécurité -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-radius: 12px; border: 2px solid #fca5a5; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 600; line-height: 1.5;">
                                                        <strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
                                                        <span style="opacity: 0.9;">Ignorez cet email. Votre mot de passe reste inchangé et votre compte est sécurisé.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="text-align: center; padding: 16px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                    Pour toute question, n'hésitez pas à nous contacter.
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
