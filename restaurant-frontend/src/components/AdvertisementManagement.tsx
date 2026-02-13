import React, { useState, useEffect } from 'react';
import {
  Image, Video, Plus, Trash2, Eye, EyeOff, X, Pencil,
  AlertTriangle, CheckCircle, XCircle, Upload,
  GripVertical, ExternalLink, Calendar, Clock, CalendarDays,
  FileText, Link, Hash, CheckCircle2, ShieldAlert, Type
} from 'lucide-react';

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  media_type: 'image' | 'video';
  media_url: string;
  link_url: string | null;
  status: 'active' | 'inactive';
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
}

const AdvertisementManagement: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [previewAd, setPreviewAd] = useState<Advertisement | null>(null);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    status: 'active',
    display_order: 0,
    start_date: '',
    end_date: '',
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadAds();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/admin/advertisements`);
      const data = await res.json();
      if (data.success) {
        setAds(data.data);
      }
    } catch (err) {
      console.error('Erreur chargement publicités:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaPreview(url);
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      link_url: ad.link_url || '',
      status: ad.status,
      display_order: ad.display_order,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setMediaFile(null);
    setMediaPreview(ad.media_url);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingAd;

    if (!isEditing && !mediaFile) {
      setNotification({ type: 'error', title: 'Erreur', message: 'Veuillez sélectionner un fichier média' });
      return;
    }

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append('title', formData.title);
      if (formData.description) form.append('description', formData.description);
      if (mediaFile) form.append('media', mediaFile);
      if (formData.link_url) form.append('link_url', formData.link_url);
      form.append('status', formData.status);
      form.append('display_order', String(formData.display_order));
      if (formData.start_date) form.append('start_date', formData.start_date);
      if (formData.end_date) form.append('end_date', formData.end_date);

      const url = isEditing
        ? `${baseUrl}/admin/advertisements/${editingAd.id}`
        : `${baseUrl}/admin/advertisements`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-User-Name': localStorage.getItem('userName') || 'Admin',
        },
        body: form,
      });

      const data = await res.json();
      if (data.success) {
        setNotification({ type: 'success', title: 'Succès', message: isEditing ? 'Publicité mise à jour' : 'Publicité créée avec succès' });
        setShowModal(false);
        resetForm();
        loadAds();
      } else {
        setNotification({ type: 'error', title: 'Erreur', message: data.message || 'Erreur lors de l\'opération' });
      }
    } catch (err) {
      setNotification({ type: 'error', title: 'Erreur', message: 'Erreur réseau' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/admin/advertisements/${id}/toggle-status`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAds(ads.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!adToDelete) return;
    try {
      const res = await fetch(`${baseUrl}/admin/advertisements/${adToDelete}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAds(ads.filter(a => a.id !== adToDelete));
        setNotification({ type: 'success', title: 'Supprimé', message: 'Publicité supprimée' });
      }
    } catch (err) {
      setNotification({ type: 'error', title: 'Erreur', message: 'Erreur lors de la suppression' });
    }
    setShowDeleteModal(false);
    setAdToDelete(null);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', link_url: '', status: 'active', display_order: 0, start_date: '', end_date: '' });
    setMediaFile(null);
    setMediaPreview(null);
    setEditingAd(null);
  };

  const activeCount = ads.filter(a => a.status === 'active').length;
  const inactiveCount = ads.filter(a => a.status === 'inactive').length;
  const imageCount = ads.filter(a => a.media_type === 'image').length;
  const videoCount = ads.filter(a => a.media_type === 'video').length;

  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Chargement des publicités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-[60]">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg border ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`p-1.5 rounded-lg ${notification.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {notification.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                : <XCircle className="w-4 h-4 text-red-600" />}
            </div>
            <div>
              <p className={`text-xs font-bold ${notification.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{notification.title}</p>
              <p className={`text-xs ${notification.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/50 rounded-lg ml-2">
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Publicités</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez les bannières publicitaires visibles par tous les employés</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">{dateStr}</span>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Publicité
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: ads.length, icon: Image, color: 'bg-gray-50 text-gray-600' },
          { label: 'Actives', value: activeCount, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Images', value: imageCount, icon: Image, color: 'bg-blue-50 text-blue-600' },
          { label: 'Vidéos', value: videoCount, icon: Video, color: 'bg-purple-50 text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{s.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${s.color} group-hover:scale-110 transition-transform`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ad Cards */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Image className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Aucune publicité</h3>
          <p className="text-sm text-gray-400 mb-5">Créez votre première publicité pour la diffuser aux employés</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-orange-100"
          >
            <Plus className="w-4 h-4" />
            Créer une publicité
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg group/card ${
                ad.status === 'active' ? 'border-gray-100 shadow-sm' : 'border-gray-200 opacity-70'
              }`}
            >
              {/* Media */}
              <div className="relative aspect-video bg-gray-100 cursor-pointer group" onClick={() => setPreviewAd(ad)}>
                {ad.media_type === 'image' ? (
                  <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <video src={ad.media_url} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Eye className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                {/* Type badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border backdrop-blur-sm ${
                    ad.media_type === 'image' ? 'bg-blue-50/90 border-blue-200 text-blue-700' : 'bg-purple-50/90 border-purple-200 text-purple-700'
                  }`}>
                    {ad.media_type === 'image' ? <Image className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    {ad.media_type === 'image' ? 'Image' : 'Vidéo'}
                  </span>
                </div>
                {/* Status badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                    ad.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ad.status === 'active' ? 'bg-white' : 'bg-gray-300'}`}></span>
                    {ad.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Order badge */}
                <div className="absolute bottom-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-black/50 text-white backdrop-blur-sm">
                    <GripVertical className="w-3 h-3" />
                    Ordre: {ad.display_order}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{ad.title}</h3>
                {ad.description && (
                  <p className="text-xs text-gray-400 mb-2.5 line-clamp-2">{ad.description}</p>
                )}

                {(ad.start_date || ad.end_date) && (
                  <div className="flex items-center flex-wrap gap-2 text-[10px] text-gray-400 mb-2.5">
                    {ad.start_date && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                        <Calendar className="w-3 h-3" />
                        Début: {new Date(ad.start_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {ad.end_date && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg">
                        <Clock className="w-3 h-3" />
                        Fin: {new Date(ad.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}

                {ad.link_url && (
                  <a href={ad.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-orange-500 hover:text-orange-600 font-medium mb-2.5">
                    <ExternalLink className="w-3 h-3" />
                    Lien externe
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <button
                    onClick={() => handleToggleStatus(ad.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold border transition-colors ${
                      ad.status === 'active'
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {ad.status === 'active' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {ad.status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditAd(ad)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 border border-blue-200 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setAdToDelete(ad.id); setShowDeleteModal(true); }}
                      className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => { setShowModal(false); resetForm(); }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>
            <div className="relative overflow-hidden px-6 pt-6 pb-5">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                    {editingAd ? <Pencil className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{editingAd ? 'Modifier la Publicité' : 'Nouvelle Publicité'}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Remplissez les informations de la publicité</p>
                  </div>
                </div>
                <button onClick={() => { setShowModal(false); resetForm(); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-6 pt-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Type className="w-3.5 h-3.5 text-orange-500" />
                  Titre <span className="text-red-400">*</span>
                </label>
                <input type="text" value={formData.title} required
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                  placeholder="Ex: Promotion du mois" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  Description
                </label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
                  rows={2} placeholder="Description optionnelle" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Upload className="w-3.5 h-3.5 text-orange-500" />
                  {editingAd ? 'Média (laisser vide pour garder l\'actuel)' : 'Média (Image ou Vidéo)'} {!editingAd && <span className="text-red-400">*</span>}
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-orange-300 transition-colors bg-gray-50/50">
                  {mediaPreview ? (
                    <div className="space-y-3">
                      {(mediaFile?.type.startsWith('video')) || (!mediaFile && editingAd?.media_type === 'video') ? (
                        <video src={mediaPreview} className="max-h-40 mx-auto rounded-xl" controls />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="max-h-40 mx-auto rounded-xl object-cover" />
                      )}
                      <button type="button"
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold">
                        {editingAd && !mediaFile ? 'Changer le média' : 'Supprimer et choisir un autre'}
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Upload className="w-5 h-5 text-orange-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">Cliquez pour uploader</p>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, GIF, WebP, MP4, WebM, MOV (max 50 Mo)</p>
                      <p className="text-[10px] text-orange-500 mt-1 font-medium">Taille recommandée : 1200 × 400 px</p>
                      <input type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                        onChange={handleFileChange} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  <Link className="w-3.5 h-3.5 text-orange-500" />
                  Lien (optionnel)
                </label>
                <input type="url" value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                  placeholder="https://example.com" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Hash className="w-3.5 h-3.5 text-orange-500" />
                    Ordre d'affichage
                  </label>
                  <input type="number" min={0} value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                    Statut
                  </label>
                  <select value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 appearance-none cursor-pointer">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    Date de début
                  </label>
                  <input type="date" value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    Date de fin
                  </label>
                  <input type="date" value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200" />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Envoi...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> {editingAd ? 'Mettre à jour' : 'Publier'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-out]" onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }}>
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
                    <h3 className="text-lg font-bold text-gray-900">Supprimer la publicité</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Cette action est irréversible</p>
                  </div>
                </div>
                <button onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }}
                  className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="px-6 pt-6 pb-6">
              <div className="bg-red-50 border-2 border-red-100 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">Le fichier média sera également supprimé définitivement.</p>
                <div className="flex items-start gap-2 mt-3 bg-red-100/50 rounded-lg p-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-semibold">Cette action ne peut pas être annulée.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
                  Annuler
                </button>
                <button onClick={handleDelete}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewAd(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewAd(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors">
              <X className="w-7 h-7" />
            </button>
            {previewAd.media_type === 'image' ? (
              <img src={previewAd.media_url} alt={previewAd.title} className="w-full rounded-2xl max-h-[80vh] object-contain" />
            ) : (
              <video src={previewAd.media_url} className="w-full rounded-2xl max-h-[80vh]" controls autoPlay />
            )}
            <div className="mt-4 text-center">
              <h3 className="text-white font-bold text-lg">{previewAd.title}</h3>
              {previewAd.description && <p className="text-gray-300 text-sm mt-1">{previewAd.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
