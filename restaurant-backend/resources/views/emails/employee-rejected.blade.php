<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demande non approuvée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Demande d'inscription</h2>
        
        <p>Bonjour <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Nous vous informons que votre demande d'inscription sur AppTicket pour <strong>{{ $companyName }}</strong> n'a pas été approuvée.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #721c24;">
                ℹ️ Pour plus d'informations, veuillez contacter le gestionnaire de votre entreprise.
            </p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>Cordialement,<br><strong>L'équipe AppTicket</strong></p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2025 AppTicket. Tous droits réservés.</p>
    </div>
</body>
</html>
