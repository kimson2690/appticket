import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Building2, User, Phone, Briefcase, CreditCard, Calendar } from 'lucide-react';
import { apiService, type Company } from '../services/api';

interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  company_id: string;
  department: string;
  position: string;
  employee_number: string;
  ticket_balance: number;
  status: 'active' | 'inactive' | 'suspended';
  hire_date: string;
  acceptTerms: boolean;
}

interface ModernRegisterPageProps {
  onBackToLogin: () => void;
}

const ModernRegisterPageNew: React.FC<ModernRegisterPageProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company_id: '',
    department: '',
    position: '',
    employee_number: '',
    ticket_balance: 0,
    status: 'active',
    hire_date: '',
    acceptTerms: false
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const companiesData = await apiService.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Nom complet requis';
    if (!formData.email.trim()) newErrors.email = 'Email requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
    if (!formData.phone.trim()) newErrors.phone = 'Téléphone requis';
    if (!formData.password) newErrors.password = 'Mot de passe requis';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!formData.company_id) newErrors.company_id = 'Entreprise requise';
    if (!formData.acceptTerms) newErrors.acceptTerms = true as any;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    setTimeout(() => {
      alert('Inscription réussie ! Un email de confirmation a été envoyé.');
      setIsLoading(false);
      onBackToLogin();
    }, 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
            <pattern id="grid-register" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="white" strokeOpacity="0.12"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-register)"/>
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
            {/* Bouton retour */}
            <button
              onClick={onBackToLogin}
              className="flex items-center text-slate-600 hover:text-orange-600 transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à la connexion
            </button>

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
              Créer un compte
            </h1>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom et Prénom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Prénom</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                      errors.firstName ? 'border-red-300' : ''
                    }`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                      errors.lastName ? 'border-red-300' : ''
                    }`}
                    placeholder="Doe"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                      errors.email ? 'border-red-300' : ''
                    }`}
                    placeholder="john.doe@exemple.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Téléphone */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Téléphone</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                      errors.phone ? 'border-red-300' : ''
                    }`}
                    placeholder="+226 70 12 34 56"
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* Entreprise */}
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">Entreprise</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    className={`w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                      errors.companyId ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Sélectionnez votre entreprise</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                {errors.companyId && <p className="text-red-500 text-xs mt-1">{errors.companyId}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  Votre entreprise n'est pas dans la liste ? Contactez votre administrateur.
                </p>
              </div>

              {/* Mots de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Mot de passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                        errors.password ? 'border-red-300' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-700">Confirmer</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100 ${
                        errors.confirmPassword ? 'border-red-300' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Conditions d'utilisation */}
              <div className="mt-6">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mt-1"
                  />
                  <span className="ml-3 text-sm text-slate-600">
                    J'accepte les{' '}
                    <button type="button" className="text-orange-600 hover:text-orange-700 font-medium">
                      conditions d'utilisation
                    </button>{' '}
                    et la{' '}
                    <button type="button" className="text-orange-600 hover:text-orange-700 font-medium">
                      politique de confidentialité
                    </button>
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-red-500 text-xs mt-1">Vous devez accepter les conditions</p>}
              </div>

              {/* Bouton Inscription */}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 w-full rounded-xl bg-orange-400 px-4 py-3 text-center text-sm font-medium text-slate-900 shadow-sm transition hover:bg-orange-300 active:bg-orange-400 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                    Création du compte...
                  </div>
                ) : (
                  'Créer mon compte'
                )}
              </button>

              <p className="pt-2 text-[13px] text-slate-500">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Se connecter
                </button>
              </p>
            </form>
          </section>

          {/* Section droite - Image avec éléments flottants */}
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
              
              {/* Canvas wrapper */}
              <div className="relative p-6 md:p-8 lg:p-10 flex-1 flex items-center justify-center z-10">
                {/* Container pour les éléments flottants */}
                <div className="relative w-full h-full">

                  {/* Floating circular icons */}
                  <div className="pointer-events-none absolute -right-8 top-16 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite'}}>
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="pointer-events-none absolute -left-8 top-24 hidden md:block">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 ring-4 ring-white/20 shadow-md" style={{animation: 'floaty 8s ease-in-out infinite', animationDelay: '2s'}}>
                      <User className="h-5 w-5" />
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

                  {/* Floating Stat Card A */}
                  <div className="absolute -left-12 top-1/3 hidden w-64 rounded-xl border border-white/10 bg-white/95 p-4 text-slate-900 backdrop-blur md:block" style={{
                    boxShadow: `
                      0 4px 16px rgba(2, 6, 23, 0.15),
                      0 1px 4px rgba(2, 6, 23, 0.08)
                    `,
                    animation: 'floaty 8s ease-in-out infinite'
                  }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-500">Nouveaux employés</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">847</p>
                        <p className="mt-1 text-xs text-emerald-600">+18% ce mois</p>
                      </div>
                      <div className="relative grid place-items-center">
                        <div className="grid h-12 w-12 place-items-center rounded-full" style={{
                          background: 'conic-gradient(#f97316 72%, rgba(2, 6, 23, 0.85) 0)'
                        }}>
                          <div className="h-9 w-9 rounded-full bg-white" style={{boxShadow: 'inset 0 0 0 4px #0b1220'}}></div>
                        </div>
                        <span className="absolute text-xs font-medium text-slate-900">72%</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stat Card B */}
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
                        <p className="text-xs text-slate-500">Entreprises actives</p>
                        <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">156</p>
                        <p className="mt-1 text-xs text-emerald-600">+8% ce mois</p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs font-medium">BF</span>
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

export default ModernRegisterPageNew;
