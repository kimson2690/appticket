import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, Building2, User, Phone, Briefcase, Calendar, CheckCircle, XCircle, X } from 'lucide-react';
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
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  hire_date: string;
  acceptTerms: boolean;
}

interface RegisterFormProps {
  onBackToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onBackToLogin }) => {
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      setNotification({
        type: 'success',
        message: 'Compte créé avec succès ! Votre demande est en attente de validation par le gestionnaire de votre entreprise. Vous recevrez une notification une fois votre compte approuvé.'
      });
      
      // Rediriger vers la page de connexion après 5 secondes
      setTimeout(() => {
        onBackToLogin();
      }, 5000);
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      setNotification({
        type: 'error',
        message: 'Erreur lors de la création du compte. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className={`flex items-start space-x-4 rounded-2xl p-5 shadow-2xl backdrop-blur-sm max-w-2xl ${
            notification.type === 'success' 
              ? 'bg-green-50/95 border-2 border-green-200' 
              : 'bg-red-50/95 border-2 border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-1 ${
                notification.type === 'success' ? 'text-green-900' : 'text-red-900'
              }`}>
                {notification.type === 'success' ? 'Inscription réussie !' : 'Erreur'}
              </h3>
              <p className={`text-sm ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className={`p-1 rounded-lg transition-colors ${
                notification.type === 'success' 
                  ? 'hover:bg-green-100' 
                  : 'hover:bg-red-100'
              }`}
            >
              <X className={`w-5 h-5 ${
                notification.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`} />
            </button>
          </div>
        </div>
      )}

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

      <div className="relative mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-[28px] bg-white/95 p-6 text-slate-900 backdrop-blur md:p-8 lg:p-10" style={{
          boxShadow: `
            0 8px 28px rgba(2, 6, 23, 0.25),
            0 2px 8px rgba(2, 6, 23, 0.12)
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
              <span className="text-xl font-medium tracking-tight text-slate-950">AppTicket</span>
            </div>
            <button
              onClick={onBackToLogin}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Retour à la connexion</span>
            </button>
          </div>

          <h1 className="mb-8 text-3xl md:text-4xl font-semibold tracking-tight text-slate-950">
            Créer un compte employé
          </h1>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grille de champs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nom complet */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nom complet *</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Moussa Kaboré" 
                    className={`w-full rounded-xl border ${errors.name ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
                    required
                  />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email *</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="moussa@entreprise.bf" 
                    className={`w-full rounded-xl border ${errors.email ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
                    required
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Téléphone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone *</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+226 70 12 34 56" 
                    className={`w-full rounded-xl border ${errors.phone ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
                    required
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>

              {/* Entreprise */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Entreprise *</label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className={`w-full rounded-xl border ${errors.company_id ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
                    required
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                {errors.company_id && <p className="mt-1 text-sm text-red-600">{errors.company_id}</p>}
              </div>

              {/* Département */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Département</label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Ex: IT, RH, Finance" 
                    className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Poste */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Poste</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex: Développeur, Manager" 
                    className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Numéro d'employé */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Numéro d'employé</label>
                <input 
                  type="text" 
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder="Ex: EMP001" 
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              {/* Date d'embauche */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date d'embauche</label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="date" 
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-11 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mot de passe *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••" 
                    className={`w-full rounded-xl border ${errors.password ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
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
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirmation mot de passe */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirmer le mot de passe *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••" 
                    className={`w-full rounded-xl border ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200'} bg-white px-11 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100`}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Accepter les conditions */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="acceptTerms" className="text-sm text-slate-600">
                J'accepte les{' '}
                <button type="button" className="text-orange-600 hover:text-orange-700 font-medium">
                  conditions d'utilisation
                </button>
                {' '}et la{' '}
                <button type="button" className="text-orange-600 hover:text-orange-700 font-medium">
                  politique de confidentialité
                </button>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-600">Vous devez accepter les conditions d'utilisation</p>}

            {/* Bouton de soumission */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full rounded-xl bg-orange-400 px-4 py-3 text-center text-sm font-medium text-slate-900 shadow-sm transition hover:bg-orange-300 active:bg-orange-400 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900 mr-2"></div>
                  Création du compte...
                </div>
              ) : (
                'Créer mon compte employé'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
