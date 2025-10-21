import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ShoppingBag, Users, TrendingUp } from 'lucide-react';

interface ModernLoginProps {
  onShowRegister: () => void;
}

const ModernLogin: React.FC<ModernLoginProps> = ({ onShowRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (email === 'admin@appticket.com' && password === 'admin123') {
        // Stocker les informations de connexion
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', email);
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Recharger la page pour déclencher la redirection
        window.location.reload();
      } else {
        alert('Identifiants incorrects. Veuillez réessayer.');
      }
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen relative" style={{
      background: `
        radial-gradient(1200px 600px at 80% -10%, rgba(249, 115, 22, 0.18), transparent 60%),
        radial-gradient(800px 400px at 20% 110%, rgba(34, 197, 94, 0.14), transparent 60%),
        linear-gradient(180deg, #0b1020 0%, #0a0f1a 100%)
      `
    }}>
      {/* Motif de grille décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="white" strokeOpacity="0.12"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-10 md:px-10 lg:py-16">
        <div className="grid items-stretch gap-8 lg:grid-cols-2 min-h-[600px]">
          {/* Section gauche - Formulaire */}
          <section className="rounded-[28px] bg-white/95 p-6 text-slate-900 backdrop-blur md:p-8 lg:p-10" style={{
            boxShadow: `
              0 8px 28px rgba(2, 6, 23, 0.25),
              0 2px 8px rgba(2, 6, 23, 0.12)
            `
          }}>
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/90 ring-8 ring-orange-200/40">
                <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V9.5C20.1716 9.5 19.5 10.1716 19.5 11C19.5 11.8284 20.1716 12.5 21 12.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V12.5C3.82843 12.5 4.5 11.8284 4.5 11C4.5 10.1716 3.82843 9.5 3 9.5V7Z"/>
                </svg>
              </span>
              <span className="text-xl font-medium tracking-tight text-slate-950">AppTicket</span>
            </div>

            <h1 className="mb-8 text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950">
              Connectez-vous
            </h1>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@appticket.com" 
                    className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Mot de passe</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Options - Se souvenir de moi et Mot de passe oublié */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-slate-600">Se souvenir de moi</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-orange-400 px-4 py-3 text-center text-sm font-medium text-slate-900 shadow-sm transition hover:bg-orange-300 active:bg-orange-400 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                    Connexion...
                  </div>
                ) : (
                  'Se connecter maintenant'
                )}
              </button>

              <p className="pt-2 text-[13px] text-slate-500">
                Pas de compte ? {' '}
                <button
                  type="button"
                  onClick={onShowRegister}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Créer un compte
                </button>
              </p>
            </form>

            {/* Identifiants de test */}
            <div className="mt-6 p-3 bg-orange-50/50 rounded-xl border border-orange-100/50">
              <h3 className="text-xs font-medium text-orange-800 mb-1">🔑 Identifiants de test</h3>
              <div className="text-xs text-orange-700 space-y-0.5">
                <p><strong>Email:</strong> admin@appticket.com</p>
                <p><strong>Mot de passe:</strong> admin123</p>
              </div>
            </div>
          </section>

          {/* Section droite - Browser mockup */}
          <section className="relative flex flex-col">
            {/* Content frame avec image de fond */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 ring-1 ring-white/10 backdrop-blur flex-1 flex flex-col" style={{
              boxShadow: `
                0 8px 28px rgba(2, 6, 23, 0.25),
                0 2px 8px rgba(2, 6, 23, 0.12)
              `,
              backgroundImage: `url('/src/assets/Image_homme.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              {/* Overlay pour améliorer la lisibilité */}
              <div className="absolute inset-0 bg-slate-900/30"></div>
              
              {/* Canvas wrapper - maintenant pleine hauteur */}
              <div className="relative p-6 md:p-8 lg:p-10 flex-1 flex items-center justify-center z-10">
                {/* Container pour les éléments flottants */}
                <div className="relative w-full h-full">

                  {/* Floating circular icons - plus petits et sur les côtés */}
                  <div className="pointer-events-none absolute -right-8 top-16 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite'}}>
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -left-8 top-24 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite', animationDelay: '2s'}}>
                      <Eye className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -left-8 bottom-24 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite', animationDelay: '4s'}}>
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -right-8 bottom-16 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite', animationDelay: '6s'}}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Floating Stat Card A - plus petite et sur le côté */}
                  <div className="absolute -left-12 top-1/3 hidden w-64 rounded-xl border border-white/10 bg-white/95 p-4 text-slate-900 backdrop-blur md:block" style={{
                    boxShadow: `
                      0 4px 16px rgba(2, 6, 23, 0.15),
                      0 1px 4px rgba(2, 6, 23, 0.08)
                    `,
                    animation: 'floaty 8s ease-in-out infinite'
                  }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Tickets vendus</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">2,847</p>
                        <p className="mt-1 text-xs text-emerald-600">+12% vs. mois dernier</p>
                      </div>
                      <div className="relative grid place-items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-full" style={{
                          background: 'conic-gradient(#f97316 64%, rgba(2, 6, 23, 0.85) 0)'
                        }}>
                          <div className="h-9 w-9 rounded-full bg-white" style={{boxShadow: 'inset 0 0 0 4px #0b1220'}}></div>
                        </div>
                        <span className="absolute text-xs font-medium text-slate-900">64%</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stat Card B - plus petite et sur le côté */}
                  <div className="absolute -right-12 bottom-1/4 hidden w-64 rounded-xl border border-white/10 bg-white/95 p-4 text-slate-900 backdrop-blur md:block" style={{
                    boxShadow: `
                      0 4px 16px rgba(2, 6, 23, 0.15),
                      0 1px 4px rgba(2, 6, 23, 0.08)
                    `,
                    animation: 'floaty 8s ease-in-out infinite',
                    animationDelay: '3s'
                  }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Chiffre d'affaires</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">12,450,000 FCFA</p>
                        <p className="mt-1 text-xs text-emerald-600">+24% vs. mois dernier</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-xs font-medium">XOF</span>
                      </div>
                    </div>
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
      </div>
    </div>
  );
};

export default ModernLogin;
