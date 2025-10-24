<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription en attente de validation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Inscription en attente de validation</h2>
        
        <p>Bonjour <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Votre demande d'inscription sur AppTicket a bien été reçue !</p>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
                ⏳ <strong>Votre compte est actuellement en attente de validation</strong> par le gestionnaire de <strong>{{ $companyName }}</strong>.
            </p>
        </div>
        
        <p>Vous recevrez un email de confirmation dès que votre compte sera approuvé.</p>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Merci de votre patience.
        </p>
        
        <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
            <p>Cordialement,<br><strong>L'équipe AppTicket</strong></p>
        </div>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© 2025 AppTicket. Tous droits réservés.</p>
    </div>
</body>
</html>
