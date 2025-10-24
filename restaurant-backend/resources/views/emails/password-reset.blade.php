<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f97316; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AppTicket</h1>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; margin-top: 0;">Réinitialisation de mot de passe</h2>
        
        <p>Bonjour <strong>{{ $userName }}</strong>,</p>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte AppTicket.</p>
        
        <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $resetUrl }}" 
               style="background-color: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Réinitialiser mon mot de passe
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
        </p>
        <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; border-radius: 5px; word-break: break-all; font-size: 12px;">
            <a href="{{ $resetUrl }}" style="color: #f97316;">{{ $resetUrl }}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
                ⏱️ <strong>Ce lien est valide pendant 60 minutes.</strong>
            </p>
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
                🔒 Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.
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
