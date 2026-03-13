import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  Ticket, 
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  CalendarDays,
  X,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Hash,
  ShoppingCart,
  CreditCard,
  Palette
} from 'lucide-react';
import { apiService, type Company } from '../services/api';

const CompanyManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Burkina Faso',
    website: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'suspended',
    ordering_enabled: true,
    direct_payment_enabled: false,
    primary_color: '#f97316',
    secondary_color: '#ea580c',
    logo_url: ''
  });

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const companiesData = await apiService.getCompanies();
        setCompanies(companiesData);
      } catch (err) {
        setError('Erreur lors du chargement des entreprises');
        console.error('Error loading companies:', err);
        // Fallback avec des données par défaut
        setCompanies([
          {
            id: '1',
            name: 'SONABEL',
            email: 'contact@sonabel.bf',
            phone: '+226 25 30 60 70',
            address: 'Avenue Kwame N\'Krumah',
            city: 'Ouagadougou',
            postal_code: '01',
            country: 'Burkina Faso',
            website: 'https://sonabel.bf',
            description: 'Société Nationale Burkinabè d\'Électricité',
            status: 'active',
            employee_count: 45,
            ticket_balance: 2500,
            created_at: '2024-01-15',
            updated_at: '2024-01-15'
          },
          {
            id: '2',
            name: 'Banque Atlantique',
            email: 'rh@banqueatlantique.sn',
            phone: '+221 33 987 65 43',
            address: 'Place de l\'Indépendance',
            city: 'Dakar',
            postal_code: '12000',
            country: 'Burkina Faso',
            website: 'https://banqueatlantique.sn',
            description: 'Institution bancaire',
            status: 'active',
            employee_count: 120,
            ticket_balance: 8500,
            created_at: '2024-01-10',
            updated_at: '2024-01-10'
          },
          {
            id: '3',
            name: 'Sonatel Orange',
            email: 'admin@orange.sn',
            phone: '+221 33 456 78 90',
            address: '46 Boulevard de la République',
            city: 'Dakar',
            postal_code: '12100',
            country: 'Burkina Faso',
            website: 'https://orange.sn',
            description: 'Opérateur de télécommunications',
            status: 'active',
            employee_count: 350,
            ticket_balance: 15000,
            created_at: '2024-01-05',
            updated_at: '2024-01-05'
          },
          {
            id: '4',
            name: 'Ministère de la Santé',
            email: 'contact@sante.gouv.sn',
            phone: '+221 33 321 54 87',
            address: 'Rue Aimé Césaire',
            city: 'Dakar',
            postal_code: '12200',
            country: 'Burkina Faso',
            description: 'Administration publique',
            status: 'suspended',
            employee_count: 85,
            ticket_balance: 0,
            created_at: '2024-02-01',
            updated_at: '2024-02-01'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      country: 'Burkina Faso',
      website: '',
      description: '',
      status: 'active',
      ordering_enabled: true,
      direct_payment_enabled: false,
      primary_color: '#f97316',
      secondary_color: '#ea580c',
      logo_url: ''
    });
    setShowModal(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      name: company.name,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      postal_code: company.postal_code,
      country: company.country,
      website: company.website || '',
      description: company.description || '',
      status: company.status,
      ordering_enabled: company.ordering_enabled !== false,
      direct_payment_enabled: company.direct_payment_enabled === true,
      primary_color: company.primary_color || '#f97316',
      secondary_color: company.secondary_color || '#ea580c',
      logo_url: company.logo_url || ''
    });
    setShowModal(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedCompany) {
        // Modifier une entreprise existante via l'API
        const updatedCompany = await apiService.updateCompany(selectedCompany.id, formData);
        setCompanies(companies.map(company => 
          company.id === selectedCompany.id ? updatedCompany : company
        ));
      } else {
        // Créer une nouvelle entreprise via l'API
        const newCompany = await apiService.createCompany(formData);
        setCompanies([...companies, newCompany]);
      }
      setShowModal(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // En cas d'erreur API, utiliser la logique locale comme fallback
      if (selectedCompany) {
        // Modifier une entreprise existante (fallback local)
        setCompanies(companies.map(company => 
          company.id === selectedCompany.id 
            ? { ...company, ...formData, updated_at: new Date().toISOString().split('T')[0] }
            : company
        ));
      } else {
        // Créer une nouvelle entreprise (fallback local)
        const newCompany: Company = {
          id: Date.now().toString(),
          ...formData,
          employee_count: 0,
          ticket_balance: 0,
          created_at: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString().split('T')[0]
        };
        setCompanies([...companies, newCompany]);
      }
      setShowModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedCompany) {
      try {
        // Supprimer via l'API
        await apiService.deleteCompany(selectedCompany.id);
        setCompanies(companies.filter(company => company.id !== selectedCompany.id));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // En cas d'erreur API, supprimer localement comme fallback
        setCompanies(companies.filter(company => company.id !== selectedCompany.id));
      }
    }
    setShowDeleteModal(false);
    setSelectedCompany(null);
  };

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des entreprises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-red-700 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Entreprises</h1>
          <p className="text-sm text-gray-400 mt-0.5">Créez, modifiez et gérez les entreprises clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={handleCreateCompany}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Entreprise
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Entreprises', value: companies.length, icon: Building2, color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Membres', value: companies.reduce((sum, c) => sum + Number(c.employee_count || 0), 0), sub: 'Gestionnaires inclus', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Tickets Disponibles', value: companies.reduce((sum, c) => sum + c.ticket_balance, 0).toLocaleString('fr-FR'), sub: 'Souches actives et valides', icon: Ticket, color: 'bg-orange-50 text-orange-600', isText: true },
          { label: 'Entreprises Actives', value: companies.filter(c => c.status === 'active').length, icon: CheckCircle, color: 'bg-purple-50 text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className={`mt-1 font-extrabold ${(s as any).isText ? 'text-xl text-orange-600' : 'text-3xl text-gray-900'}`}>{s.value}</p>
                {(s as any).sub && <p className="text-[10px] text-gray-400 mt-0.5">{(s as any).sub}</p>}
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Liste des Entreprises</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entreprise</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Localisation</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Membres
                  <span className="block text-[9px] font-normal normal-case text-gray-300">dont gestionnaire</span>
                </th>
                <th className="px-4 py-4 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Tickets</th>
                <th className="px-4 py-4 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Aucune entreprise trouvée</p>
                  </td>
                </tr>
              ) : (
                companies.map((company, idx) => (
                  <tr key={company.id} className={`hover:bg-orange-50/30 transition-colors ${idx !== companies.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4.5 h-4.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                          {company.website && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{company.website.replace('https://', '').replace('http://', '')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
                        <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{company.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{company.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium">{company.city}</p>
                          <p className="text-xs text-gray-400">{company.country}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        company.status === 'active' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        company.status === 'inactive' ? 'bg-gray-50 border-gray-200 text-gray-600' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          company.status === 'active' ? 'bg-emerald-400' :
                          company.status === 'inactive' ? 'bg-gray-400' : 'bg-red-400'
                        }`}></span>
                        {company.status === 'active' ? 'Actif' :
                         company.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-bold text-gray-900">{company.employee_count.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{company.employee_count > 0 ? `${company.employee_count - 1} employé(s) + 1 gest.` : '0'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-orange-600">{company.ticket_balance.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEditCompany(company)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCompany(company)}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {selectedCompany ? <Edit className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selectedCompany ? 'Modifier l\'Entreprise' : 'Nouvelle Entreprise'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Remplissez les informations de l'entreprise</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    Nom de l'entreprise <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ex: SONABEL, Faso Coton, ONEA" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="contact@entreprise.bf" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Phone className="w-3.5 h-3.5 text-orange-500" />
                    Téléphone <span className="text-red-400">*</span>
                  </label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="+226 25 30 XX XX" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    Site web
                  </label>
                  <input type="url" value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="https://entreprise.bf" />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                    Adresse <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Avenue Kwame N'Krumah, Ouagadougou" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Building2 className="w-3.5 h-3.5 text-orange-500" />
                    Ville <span className="text-red-400">*</span>
                  </label>
                  <input type="text" required value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="Ouagadougou" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Hash className="w-3.5 h-3.5 text-orange-500" />
                    Code postal
                  </label>
                  <input type="text" value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                    placeholder="01" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5 text-orange-500" />
                    Pays <span className="text-red-400">*</span>
                  </label>
                  <select required value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer">
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Mali">Mali</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                    <option value="Niger">Niger</option>
                    <option value="Guinée">Guinée</option>
                    <option value="Togo">Togo</option>
                    <option value="Bénin">Bénin</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                    Statut
                  </label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
                    Modes de paiement
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ordering_enabled: !formData.ordering_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          formData.ordering_enabled ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          formData.ordering_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Commandes via l'application</p>
                        <p className="text-xs text-gray-400 mt-0.5">Les employés peuvent commander des plats dans l'application</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, direct_payment_enabled: !formData.direct_payment_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                          formData.direct_payment_enabled ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                          formData.direct_payment_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Paiement direct</p>
                        <p className="text-xs text-gray-400 mt-0.5">Les employés peuvent payer directement un restaurant avec leurs tickets</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    Description
                  </label>
                  <textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                    placeholder="Description de l'entreprise..." />
                </div>

                {/* Section Branding */}
                <div className="md:col-span-2 border-t-2 border-gray-100 pt-5 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-4 h-4" style={{ color: formData.primary_color }} />
                    <span className="text-sm font-bold text-gray-800">Charte graphique de l'entreprise</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Couleur primaire
                      </label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="w-12 h-12 rounded-xl border-2 border-gray-100 cursor-pointer p-0.5"
                        />
                        <input type="text" value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 font-mono outline-none transition-all focus:border-gray-300 focus:bg-white hover:border-gray-200"
                          placeholder="#f97316" maxLength={7} />
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Couleur secondaire
                      </label>
                      <div className="flex items-center gap-3">
                        <input type="color" value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="w-12 h-12 rounded-xl border-2 border-gray-100 cursor-pointer p-0.5"
                        />
                        <input type="text" value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 font-mono outline-none transition-all focus:border-gray-300 focus:bg-white hover:border-gray-200"
                          placeholder="#ea580c" maxLength={7} />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        URL du logo
                      </label>
                      <input type="url" value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-gray-300 focus:bg-white hover:border-gray-200"
                        placeholder="https://example.com/logo.png" />
                    </div>
                  </div>
                  {/* Aperçu */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Aperçu</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                        style={{ background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})` }}>
                        {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'AB'}
                      </div>
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain border border-gray-200" 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className="flex gap-2">
                        <button type="button" className="px-4 py-2 rounded-lg text-white text-xs font-semibold"
                          style={{ background: `linear-gradient(to right, ${formData.primary_color}, ${formData.secondary_color})` }}>
                          Bouton primaire
                        </button>
                        <button type="button" className="px-4 py-2 rounded-lg text-xs font-semibold border-2"
                          style={{ borderColor: formData.primary_color, color: formData.primary_color }}>
                          Bouton secondaire
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedCompany ? 'Enregistrer' : 'Créer l\'entreprise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-rose-50 to-red-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
                    <ShieldAlert className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Supprimer l'Entreprise</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteModal(false)}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">
                  Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900">"{selectedCompany.name}"</span> ?
                </p>
                {selectedCompany.employee_count > 0 && (
                  <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 font-semibold">
                      {selectedCompany.employee_count} employé(s) sont associés à cette entreprise.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
