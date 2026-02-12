import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle, Shield, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Fond dégradé */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Grille */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-3xl bg-white/10 backdrop-blur-2xl p-8 md:p-10 border border-white/20 shadow-2xl" style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
          }}>
            {/* Logo */}
            <div className="mb-8 flex items-center gap-4">
              <div className="relative">
                <img 
                  src="/AppTicket.png" 
                  alt="AppTicket Logo" 
                  className="h-14 w-14 object-contain"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.3))' }}
                />
                <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">AppTicket</span>
                <p className="text-xs text-white/60">Récupération de compte</p>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
                  <Shield className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Mot de passe oublié ?</h1>
                </div>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Pas de problème ! Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Success state */}
            {notification?.type === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Email envoyé !</h2>
                <p className="text-white/60 text-sm leading-relaxed mb-6">{notification.message}</p>
                <Link
                  to="/login"
                  className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error */}
                {notification?.type === 'error' && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{notification.message}</p>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-orange-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre.email@exemple.com"
                      className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-12 py-3.5 text-white text-sm placeholder:text-white/40 outline-none focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/20"
                      required
                    />
                  </div>
                </div>

                {/* Info note */}
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
                  <p className="text-xs text-blue-300 leading-relaxed">
                    <strong>Note :</strong> Le lien de réinitialisation est valide pendant 1 heure. Si vous ne recevez pas l'email, vérifiez votre dossier spam.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="mt-6 w-full relative group rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-orange-500/50 transition-all hover:shadow-xl hover:shadow-orange-500/60 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Envoyer le lien de réinitialisation
                      </>
                    )}
                  </span>
                </button>

                {/* Back to login */}
                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Retour à la connexion
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/40 text-xs">
              Développé avec <span className="text-orange-400">❤️</span> par <span className="text-white/70 font-semibold">KIMA T ARMEL</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
