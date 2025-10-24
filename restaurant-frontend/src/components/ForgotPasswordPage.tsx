import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { forgotPassword } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setNotification({
        type: 'error',
        message: 'Veuillez saisir votre adresse email'
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const response = await forgotPassword(email);

      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Un email de réinitialisation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception.'
        });
        setEmail('');
      }
    } catch (error: any) {
      console.error('Erreur demande réinitialisation:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 px-4 py-8">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-sm border-l-4 ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            Pas de problème ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="votre.email@exemple.com"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Envoyer le lien de réinitialisation
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> Le lien de réinitialisation est valide pendant 1 heure. 
            Si vous ne recevez pas l'email dans quelques minutes, vérifiez votre dossier spam.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
