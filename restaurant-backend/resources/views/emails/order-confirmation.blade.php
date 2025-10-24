<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commande confirmée</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🍽️ AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Commande confirmée !</h2>
        
        <p>Bonjour <strong>{{ $employeeName }}</strong>,</p>
        
        <p>Votre commande chez <strong>{{ $restaurantName }}</strong> a bien été enregistrée !</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
            <h3 style="margin-top: 0; color: #f97316;">Détail de votre commande</h3>
            @foreach($orderItems as $item)
                <p style="margin: 10px 0; padding: 8px; background-color: #f9f9f9; border-radius: 4px;">
                    <strong>{{ $item['name'] }}</strong> × {{ $item['quantity'] }} = <span style="color: #f97316; font-weight: bold;">{{ $item['price'] }} F CFA</span>
                </p>
            @endforeach
            <hr style="border: none; border-top: 2px solid #f97316; margin: 15px 0;">
            <p style="font-size: 18px; font-weight: bold; color: #f97316; text-align: right;">
                Total : {{ $totalAmount }} F CFA
            </p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
                ⏳ Votre commande est <strong>en attente de validation</strong> par le restaurant.
            </p>
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
