<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tickets assignés</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎫 AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Nouveaux tickets reçus !</h2>
        
        <p>Bonjour <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Vous venez de recevoir <strong style="color: #f97316;">{{ $ticketsCount }} ticket(s) restaurant</strong> !</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316; text-align: center;">
            <p style="margin: 10px 0; font-size: 16px;">
                <strong>Valeur unitaire :</strong> <span style="color: #f97316; font-size: 20px; font-weight: bold;">{{ $ticketValue }} F CFA</span>
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 15px 0;">
            <p style="margin: 10px 0; font-size: 20px; font-weight: bold; color: #f97316;">
                💰 Valeur totale : {{ $totalAmount }} F CFA
            </p>
        </div>
        
        <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
                ✅ Vous pouvez maintenant les utiliser pour commander vos repas.
            </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" 
               style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Commander maintenant
            </a>
        </div>
        
        <p style="text-align: center; font-size: 18px; margin: 20px 0;">
            🍽️ Bon appétit !
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
