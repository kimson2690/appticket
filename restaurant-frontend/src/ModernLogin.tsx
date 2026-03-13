import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShoppingBag, Users, TrendingUp, Sparkles, Zap, Shield, AlertTriangle, Building2, XCircle } from 'lucide-react';
import { apiService } from './services/api';
import { applyBranding, saveBrandingToStorage } from './utils/themeManager';

interface ModernLoginProps {
  onShowRegister?: () => void;
}

const ModernLogin: React.FC<ModernLoginProps> = ({ onShowRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ message: string; type: 'suspended' | 'inactive' | 'generic' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Tentative de connexion avec:', { identifier, password });
      
      // Utiliser l'API réelle pour l'authentification
      const response = await apiService.login(identifier, password);
      
      console.log('Réponse de l\'API complète:', response);
      console.log('Structure de response.user:', response.user);
      console.log('response.success:', response.success);
      
      // Vérifier si la réponse est valide
      if (!response.success || !response.user) {
        throw new Error('Réponse API invalide');
      }
      
      // Stocker les informations de connexion
      console.log('Stockage des informations utilisateur...');
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userName', response.user.name);
      localStorage.setItem('userId', response.user.id.toString());
      localStorage.setItem('userCompanyId', response.user.company_id?.toString() || '');
      localStorage.setItem('userCompanyName', response.user.company_name || '');
      localStorage.setItem('userRestaurantId', response.user.restaurant_id?.toString() || '');
      localStorage.setItem('restaurantId', response.user.restaurant_id?.toString() || ''); // FIX: Ajout restaurantId pour les gestionnaires
      localStorage.setItem('restaurantName', response.user.restaurant_name || '');
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('mustChangePassword', response.user.must_change_password ? 'true' : 'false');
      localStorage.setItem('orderingEnabled', response.user.ordering_enabled !== false ? 'true' : 'false');
      localStorage.setItem('directPaymentEnabled', response.user.direct_payment_enabled === true ? 'true' : 'false');
      
      // Sauvegarder et appliquer le branding personnalisé
      const branding = (response as any).branding || null;
      saveBrandingToStorage(branding);
      applyBranding(branding);
      
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      console.log('Informations stockées dans localStorage:', {
        isLoggedIn: localStorage.getItem('isLoggedIn'),
        userRole: localStorage.getItem('userRole'),
        userEmail: localStorage.getItem('userEmail'),
        restaurantId: localStorage.getItem('restaurantId')
      });
      
      // Recharger la page pour déclencher la redirection
      console.log('Rechargement de la page...');
      window.location.reload();
      
    } catch (error) {
      console.error('Erreur de connexion détaillée:', error);
      const errorMessage = error instanceof Error ? error.message : 'Identifiants incorrects';
      
      if (errorMessage.toLowerCase().includes('suspendue')) {
        setError({ message: errorMessage, type: 'suspended' });
      } else if (errorMessage.toLowerCase().includes('inactive')) {
        setError({ message: errorMessage, type: 'inactive' });
      } else {
        setError({ message: errorMessage, type: 'generic' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fond dégradé animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        {/* Orbes lumineux animés */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Grille animée */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-orange-400/40 rounded-full animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-purple-400/30 rounded-full animate-ping" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      {/* Style global pour animations */}
      <style>{`
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.3); }
          50% { box-shadow: 0 0 40px rgba(249, 115, 22, 0.6); }
        }
      `}</style>

      <div className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 min-h-[700px]">
          {/* Section gauche - Formulaire avec Glassmorphism */}
          <section className="rounded-3xl bg-white/10 backdrop-blur-2xl p-8 md:p-10 lg:p-12 border border-white/20 shadow-2xl" style={{
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.1)
            `
          }}>
            {/* Logo animé */}
            <div className="mb-10 flex items-center gap-4">
              <div className="relative">
                <img 
                  src="/AppTicket.png" 
                  alt="AppTicket Logo" 
                  className="h-16 w-16 object-contain"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.3))' }}
                />
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 animate-pulse" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">AppTicket</span>
                <p className="text-xs text-white/60 mt-0.5">Gestion intelligente</p>
              </div>
            </div>

            {/* Titre avec gradient */}
            <div className="mb-10">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent mb-3">
                Bon retour ! 👋
              </h1>
              <p className="text-white/60 text-sm">Connectez-vous pour accéder à votre espace</p>
            </div>

            {/* Message d'erreur stylisé */}
            {error && (
              <div className={`mb-6 rounded-2xl border-2 p-5 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out] ${
                error.type === 'suspended'
                  ? 'bg-red-500/10 border-red-500/30'
                  : error.type === 'inactive'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    error.type === 'suspended'
                      ? 'bg-red-500/20'
                      : error.type === 'inactive'
                        ? 'bg-amber-500/20'
                        : 'bg-red-500/15'
                  }`}>
                    {error.type === 'suspended' ? (
                      <Building2 className="w-5 h-5 text-red-400" />
                    ) : error.type === 'inactive' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold mb-1 ${
                      error.type === 'suspended'
                        ? 'text-red-300'
                        : error.type === 'inactive'
                          ? 'text-amber-300'
                          : 'text-red-300'
                    }`}>
                      {error.type === 'suspended'
                        ? 'Entreprise suspendue'
                        : error.type === 'inactive'
                          ? 'Entreprise inactive'
                          : 'Erreur de connexion'}
                    </h3>
                    <p className="text-white/60 text-xs leading-relaxed">{error.message}</p>
                    {(error.type === 'suspended' || error.type === 'inactive') && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Contactez votre administrateur pour plus d'informations</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                  >
                    <XCircle className="w-4 h-4 text-white/40 hover:text-white/70" />
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire moderne */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label className="mb-2 block text-xs font-semibold text-white/80 uppercase tracking-wider">Identifiant</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400 group-focus-within:text-orange-300 transition-colors" />
                  <input 
                    type="text" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="fatimata@techcorp.bf ou +22670123456" 
                    autoComplete="username"
                    className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-12 py-4 text-white placeholder:text-white/40 outline-none transition-all focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/20 hover:bg-white/10"
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="mb-2 block text-xs font-semibold text-white/80 uppercase tracking-wider">Mot de passe</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400 group-focus-within:text-orange-300 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full rounded-2xl border-2 border-white/10 bg-white/5 px-12 py-4 text-white placeholder:text-white/40 outline-none transition-all focus:border-orange-500/50 focus:bg-white/10 focus:ring-4 focus:ring-orange-500/20 hover:bg-white/10"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Options avec design moderne */}
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 text-orange-500 focus:ring-2 focus:ring-orange-500 border-white/20 rounded-lg bg-white/5 cursor-pointer"
                  />
                  <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Se souvenir de moi</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-400 hover:text-orange-300 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-orange-400 after:transition-all hover:after:w-full"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="mt-6 w-full relative group rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center text-base font-bold text-white shadow-lg shadow-orange-500/50 transition-all hover:shadow-xl hover:shadow-orange-500/60 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Se connecter
                    </>
                  )}
                </span>
              </button>

              {/* Lien d'inscription */}
              <p className="text-white/70">
                Pas encore de compte ? {' '}
                <Link
                  to="/register"
                  className="text-orange-400 hover:text-orange-300 font-semibold transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Créer un compte</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </p>
            </form>

            {/* Identifiants de test */}
            <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-orange-400" />
                <h3 className="text-xs font-bold text-white/90 uppercase tracking-wider">Identifiants de test</h3>
              </div>
              <div className="text-sm text-white/70 space-y-1 font-mono">
                <p className="flex items-center gap-2">
                  <span className="text-white/50">Email:</span>
                  <span className="text-orange-300">admin@appticket.com</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-white/50">Mot de passe:</span>
                  <span className="text-orange-300">admin123</span>
                </p>
              </div>
            </div>
          </section>

          {/* Section droite - Présentation moderne */}
          <section className="relative flex flex-col">
            {/* Content frame avec design moderne */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 backdrop-blur-sm flex-1 flex flex-col" style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
              `,
              background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(30, 41, 59, 0.4) 100%)',
            }}>
              {/* Overlay dégradé dynamique */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-500/10 to-blue-500/20"></div>
              
              {/* Effet de verre cassé animé */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(249, 115, 22, 0.2) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
                  `,
                  animation: 'pulse 8s ease-in-out infinite'
                }}></div>
              </div>
              
              {/* Contenu principal */}
              <div className="relative p-8 md:p-10 lg:p-12 flex-1 flex flex-col justify-center z-10">
                {/* Message d'accueil héro */}
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                    Gérez vos tickets
                    <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">en toute simplicité</span>
                  </h2>
                  <p className="text-lg text-white/70 max-w-xl mx-auto">
                    Une solution complète pour la gestion des tickets restaurant, du suivi des commandes et de la satisfaction client.
                  </p>
                </div>

                {/* Badges de fonctionnalités */}
                <div className="grid grid-cols-2 gap-4 mb-12">
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ShoppingBag className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Commandes en ligne</h3>
                    <p className="text-white/60 text-sm">Passez vos commandes facilement</p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Gestion d'équipe</h3>
                    <p className="text-white/60 text-sm">Gérez vos employés efficacement</p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">Statistiques</h3>
                    <p className="text-white/60 text-sm">Suivez vos performances</p>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold mb-1">100% Sécurisé</h3>
                    <p className="text-white/60 text-sm">Vos données protégées</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Glow */}
            <div className="pointer-events-none absolute -inset-8 -z-[1] blur-3xl">
              <div className="h-full w-full rounded-full bg-gradient-to-tr from-orange-400/10 via-sky-400/10 to-fuchsia-400/10"></div>
            </div>
          </section>
        </div>

        {/* Footer - Développeur */}
        <div className="relative mt-8 text-center">
          <p className="text-white/40 text-sm">
            Développé avec{' '}
            <span className="text-orange-400 animate-pulse">❤️</span>
            {' '}par{' '}
            <span className="text-white/70 font-semibold">KIMA T ARMEL</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModernLogin;
