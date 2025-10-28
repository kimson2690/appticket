<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande non approuvée</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f3f4f6; min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
                    
                    <!-- Header Respectueux -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 0;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 50px 40px 50px 40px; text-align: center;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Réponse à Votre Demande</h1>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">Concernant votre inscription</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Badge Statut -->
                    <tr>
                        <td style="padding: 30px 40px 30px 40px;">
                            <div style="margin-top: 0; position: relative; z-index: 10;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <div style="display: inline-block; background: #64748b; color: #ffffff; padding: 14px 36px; border-radius: 14px; font-size: 15px; font-weight: 700; box-shadow: 0 12px 35px rgba(100, 116, 139, 0.4);">
                                                Demande non approuvée
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
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 16px; line-height: 1.7;">
                                Nous vous informons que votre demande d'inscription à <strong style="color: #64748b;">{{ $companyName }}</strong> via AppTicket n'a pas été approuvée à ce stade.
                            </p>
                            
                            <!-- Card Information -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 16px; margin-bottom: 28px; border: 2px solid #cbd5e1;">
                                <tr>
                                    <td style="padding: 28px 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #475569; font-size: 15px; font-weight: 600; line-height: 1.6;">
                                                        <strong>Cette décision a été prise par le gestionnaire de l'entreprise.</strong><br>
                                                        <span style="font-weight: 500; opacity: 0.9;">Pour plus d'informations sur les raisons de cette décision, nous vous invitons à contacter directement {{ $companyName }}.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Card Contact -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 16px; margin-bottom: 28px; border: 2px solid #c4b5fd;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="vertical-align: middle;">
                                                    <p style="margin: 0; color: #5b21b6; font-size: 14px; font-weight: 600; line-height: 1.5;">
                                                        <strong>Besoin de clarifications ?</strong><br>
                                                        <span style="opacity: 0.9;">Contactez le service RH de {{ $companyName }} pour discuter de votre situation.</span>
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Card Encouragement -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 28px; border-radius: 16px; margin-bottom: 32px; border: 2px solid #fbbf24; text-align: center;">
                                <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 700; line-height: 1.6;">
                                    Ne vous découragez pas !<br>
                                    <span style="font-size: 14px; font-weight: 600;">D'autres opportunités peuvent se présenter. Restez positif !</span>
                                </p>
                            </div>
                            
                            <div style="text-align: center; padding: 16px 0;">
                                <p style="margin: 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                    Nous vous remercions de l'intérêt porté à AppTicket.
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
