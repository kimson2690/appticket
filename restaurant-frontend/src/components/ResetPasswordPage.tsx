import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    password_confirmation: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setNotification({
        type: 'error',
        message: 'Lien de réinitialisation invalide. Veuillez faire une nouvelle demande.'
      });
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !email) {
      return;
    }

    if (formData.password.length < 8) {
      setNotification({
        type: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setNotification({
        type: 'error',
        message: 'Les mots de passe ne correspondent pas'
      });
      return;
    }

    setLoading(true);
    setNotification(null);

    try {
      const response = await resetPassword(
        email,
        token,
        formData.password,
        formData.password_confirmation
      );

      if (response.success) {
        setNotification({
          type: 'success',
          message: response.message || 'Mot de passe réinitialisé avec succès ! Redirection...'
        });
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erreur réinitialisation:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Vérifier la force du mot de passe
  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, label: '', color: '' };
    if (password.length < 8) return { strength: 1, label: 'Faible', color: 'bg-red-500' };
    
    let strength = 1;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { strength: 2, label: 'Moyen', color: 'bg-yellow-500' };
    if (strength <= 3) return { strength: 3, label: 'Bon', color: 'bg-blue-500' };
    return { strength: 4, label: 'Excellent', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength();

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
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-600">
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {token && email ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Display */}
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Réinitialisation pour</p>
                <p className="font-medium text-gray-900">{email}</p>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum 8 caractères. Utilisez majuscules, chiffres et caractères spéciaux pour plus de sécurité.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.password_confirmation.length > 0 && (
                  <div className="mt-2">
                    {formData.password === formData.password_confirmation ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Les mots de passe correspondent
                      </p>
                    ) : (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                  </div>
                )}
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
                    Réinitialisation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Réinitialiser le mot de passe
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Lien invalide</h3>
              <p className="text-gray-600 mb-4">
                Ce lien de réinitialisation est invalide ou a expiré.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Faire une nouvelle demande
              </button>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Conseil de sécurité :</strong> Choisissez un mot de passe unique que vous n'utilisez pas ailleurs. 
            Évitez les informations personnelles facilement devinables.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
