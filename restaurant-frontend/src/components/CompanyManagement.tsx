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
  CalendarDays
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
    country: 'Sénégal',
    website: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
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
            country: 'Sénégal',
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
            country: 'Sénégal',
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
            country: 'Sénégal',
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
      country: 'Sénégal',
      website: '',
      description: '',
      status: 'active'
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
      status: company.status
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  {selectedCompany ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{selectedCompany ? 'Modifier l\'Entreprise' : 'Nouvelle Entreprise'}</h2>
                  <p className="text-sm text-orange-100">Remplissez les informations de l'entreprise</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'entreprise *</label>
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ex: SONABEL, Faso Coton, ONEA" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="contact@entreprise.bf" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone *</label>
                  <input type="tel" required value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="+226 25 30 XX XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Site web</label>
                  <input type="url" value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="https://entreprise.bf" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse *</label>
                  <input type="text" required value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Avenue Kwame N'Krumah, Ouagadougou" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville *</label>
                  <input type="text" required value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Ouagadougou" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Code postal</label>
                  <input type="text" value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays *</label>
                  <select required value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'suspended' })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="suspended">Suspendu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-300"
                    placeholder="Description de l'entreprise..." />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                  {selectedCompany ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Supprimer l'Entreprise</h3>
                  <p className="text-sm text-red-100">Cette action est irréversible</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-5">
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-gray-900">"{selectedCompany.name}"</span> ?
                Cela affectera <span className="font-semibold text-gray-900">{selectedCompany.employee_count} employé(s)</span>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
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
