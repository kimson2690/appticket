import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Building2, User, Phone, Briefcase, Calendar, Sparkles, Zap, Shield, UserPlus } from 'lucide-react';
import { apiService, type Company } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

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
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  hire_date: string;
  acceptTerms: boolean;
}

interface RegisterFormProps {
  onBackToLogin?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
  const navigate = useNavigate();
  const { success, error: showError } = useNotification();
  
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
    status: 'pending',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Préparer les données pour l'API (exclure confirmPassword et acceptTerms)
      const { confirmPassword, acceptTerms, ...employeeData } = formData;
      
      // Créer le nouvel employé via l'API
      await apiService.createEmployee(employeeData);
      
      // Afficher la notification de succès
      success(
        'Inscription réussie !',
        'Votre demande est en attente de validation par le gestionnaire de votre entreprise. Vous recevrez une notification une fois votre compte approuvé.',
        5000
      );
      
      // Rediriger vers la page de connexion après 5 secondes
      setTimeout(() => {
        if (onBackToLogin) {
          onBackToLogin();
        } else {
          navigate('/login');
        }
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      showError(
        'Erreur de création',
        'Impossible de créer le compte. Veuillez vérifier vos informations et réessayer.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Fond dégradé animé - IDENTIQUE à la page de connexion */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        {/* Orbes lumineux animés - IDENTIQUE à la page de connexion */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute top-1/4 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* Grille animée - IDENTIQUE à la page de connexion */}
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

      {/* Particules flottantes - IDENTIQUE à la page de connexion */}
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

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Section gauche - Formulaire */}
          <section className="relative backdrop-blur-xl bg-white/5 border-2 border-white/10 rounded-3xl p-8 md:p-10" style={{
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
            `
          }}>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/90 ring-8 ring-orange-200/40">
                <svg className="h-4 w-4 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V9.5C20.1716 9.5 19.5 10.1716 19.5 11C19.5 11.8284 20.1716 12.5 21 12.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V12.5C3.82843 12.5 4.5 11.8284 4.5 11C4.5 10.1716 3.82843 9.5 3 9.5V7Z"/>
                </svg>
              </span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-400 animate-pulse" style={{ animationDuration: '3s' }} />
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">AppTicket</span>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight">
              Créer un compte
            </h1>
            <p className="text-white/70">Rejoignez votre entreprise sur AppTicket</p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grille de champs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nom complet */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Nom complet *</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Moussa Kaboré" 
                    className={`w-full rounded-xl border ${errors.name ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Email *</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="moussa@entreprise.bf" 
                    className={`w-full rounded-xl border ${errors.email ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
              </div>

              {/* Téléphone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Téléphone *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+226 70 12 34 56" 
                    className={`w-full rounded-xl border ${errors.phone ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
              </div>

              {/* Entreprise */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Entreprise *</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className={`w-full rounded-xl border ${errors.company_id ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  >
                    <option value="" className="bg-slate-800">Sélectionner une entreprise</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id} className="bg-slate-800">{company.name}</option>
                    ))}
                  </select>
                </div>
                {errors.company_id && <p className="mt-1 text-sm text-red-400">{errors.company_id}</p>}
              </div>

              {/* Département */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Département</label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: IT, RH, Finance" 
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20"
                  />
                </div>
              </div>

              {/* Poste */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Poste</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Développeur, Manager" 
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20"
                  />
                </div>
              </div>

              {/* Numéro d'employé */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Numéro d'employé</label>
                <input 
                  type="text" 
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder="Ex: EMP001" 
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20"
                />
              </div>

              {/* Date d'embauche */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Date d'embauche</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type="date" 
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-11 py-3 text-[15px] text-white outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Mot de passe *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" 
                    className={`w-full rounded-xl border ${errors.password ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Confirmer le mot de passe *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••" 
                    className={`w-full rounded-xl border ${errors.confirmPassword ? 'border-red-400' : 'border-white/10'} bg-white/5 px-11 py-3 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-400/20`}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Accepter les conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-1 h-4 w-4 text-orange-500 focus:ring-orange-500 border-white/20 rounded bg-white/5"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-white/80">
                J'accepte les{' '}
                <button type="button" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  conditions d'utilisation
                </button>
                {' '}et la{' '}
                <button type="button" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  politique de confidentialité
                </button>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-400">Vous devez accepter les conditions d'utilisation</p>}

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-orange-500 hover:to-orange-600 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création en cours...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span>Créer mon compte</span>
                  <Zap className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </>
              )}
            </button>
          </form>
          </section>

          {/* Section droite - Avantages */}
          <section className="relative hidden lg:flex flex-col">
            <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 backdrop-blur-sm flex-1 flex flex-col" style={{
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05)
              `,
              background: 'linear-gradient(135deg, rgba(51, 65, 85, 0.4) 0%, rgba(30, 41, 59, 0.4) 100%)',
            }}>
              {/* Overlay dégradé */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-purple-500/10 to-blue-500/20"></div>

              {/* Contenu */}
              <div className="relative p-10 flex-1 flex flex-col justify-center z-10">
                {/* Message principal */}
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                    Rejoignez
                    <span className="block bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">votre équipe</span>
                  </h2>
                  <p className="text-lg text-white/70 max-w-md mx-auto">
                    Créez votre compte et accédez à tous les avantages de votre entreprise.
                  </p>
                </div>

                {/* Avantages */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Commandes rapides</h3>
                      <p className="text-white/60 text-sm">Commandez vos repas en quelques clics avec vos tickets</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Sécurisé & Fiable</h3>
                      <p className="text-white/60 text-sm">Vos données personnelles sont protégées et sécurisées</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Validation rapide</h3>
                      <p className="text-white/60 text-sm">Votre gestionnaire validera votre compte sous 24h</p>
                    </div>
                  </div>
                </div>

                {/* Note de sécurité */}
                <div className="mt-12 text-center">
                  <p className="text-white/50 text-sm">
                    🔒 Vos informations sont protégées et ne seront jamais partagées
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
