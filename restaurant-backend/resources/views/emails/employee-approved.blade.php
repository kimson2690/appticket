<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Compte approuvé</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">🎉 Compte approuvé !</h2>
        
        <p>Bonjour <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Bonne nouvelle ! Votre compte AppTicket a été approuvé par le gestionnaire de <strong>{{ $companyName }}</strong>.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
                ✅ <strong>Vous pouvez maintenant vous connecter et commencer à utiliser l'application.</strong>
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" 
               style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Se connecter à AppTicket
            </a>
        </div>
        
        <p style="text-align: center; font-size: 18px; color: #f97316; font-weight: bold; margin: 30px 0;">
            Bienvenue sur AppTicket ! 🎊
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
