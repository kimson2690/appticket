<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle demande d'inscription</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Nouvelle demande d'inscription</h2>
        
        <p>Bonjour,</p>
        
        <p>Une nouvelle demande d'inscription a été reçue pour <strong>{{ $companyName }}</strong>.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
            <h3 style="margin-top: 0; color: #f97316;">Détails de l'employé</h3>
            <p style="margin: 10px 0;">
                <strong>Nom :</strong> {{ $employeeName }}
            </p>
            <p style="margin: 10px 0;">
                <strong>Email :</strong> {{ $employeeEmail }}
            </p>
        </div>
        
        <p>Veuillez vous connecter à AppTicket pour approuver ou rejeter cette demande.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/login" 
               style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Accéder à AppTicket
            </a>
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
