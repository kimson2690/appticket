import React, { useState, useEffect } from 'react';
import {
  Image, Video, Plus, Trash2, Eye, EyeOff, X, Pencil,
  AlertTriangle, CheckCircle, XCircle, Upload,
  GripVertical, ExternalLink, Calendar, Clock
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des publicités...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-2xl border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <div>
              <p className="font-semibold text-sm">{notification.title}</p>
              <p className="text-sm opacity-80">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Publicités</h1>
          <p className="text-gray-500 mt-1">Gérez les bannières publicitaires visibles par tous les employés</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Nouvelle Publicité</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
          <p className="text-xs text-green-600 mb-1">Actives</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Images</p>
              <p className="text-2xl font-bold text-blue-600">{imageCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Vidéos</p>
              <p className="text-2xl font-bold text-purple-600">{videoCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des publicités */}
      {ads.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune publicité</h3>
          <p className="text-gray-500 mb-4">Créez votre première publicité pour la diffuser aux employés</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une publicité</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden transition-all hover:shadow-lg ${
                ad.status === 'active' ? 'border-green-200' : 'border-gray-200 opacity-75'
              }`}
            >
              {/* Media preview */}
              <div className="relative aspect-video bg-gray-100 cursor-pointer group" onClick={() => setPreviewAd(ad)}>
                {ad.media_type === 'image' ? (
                  <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
                ) : (
                  <video src={ad.media_url} className="w-full h-full object-cover" muted />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    ad.media_type === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {ad.media_type === 'image' ? <Image className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                    {ad.media_type === 'image' ? 'Image' : 'Vidéo'}
                  </span>
                </div>
                {/* Status badge */}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                    ad.status === 'active' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {ad.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {/* Order badge */}
                <div className="absolute bottom-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white">
                    <GripVertical className="w-3 h-3 mr-1" />
                    Ordre: {ad.display_order}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate">{ad.title}</h3>
                {ad.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{ad.description}</p>
                )}

                {/* Dates */}
                {(ad.start_date || ad.end_date) && (
                  <div className="flex items-center text-xs text-gray-400 mb-3 space-x-3">
                    {ad.start_date && (
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Début: {new Date(ad.start_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                    {ad.end_date && (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Fin: {new Date(ad.end_date).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                )}

                {ad.link_url && (
                  <a href={ad.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-orange-500 hover:text-orange-600 mb-3">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Lien externe
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(ad.id)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      ad.status === 'active'
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {ad.status === 'active' ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {ad.status === 'active' ? 'Désactiver' : 'Activer'}
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditAd(ad)}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Éditer
                    </button>
                    <button
                      onClick={() => { setAdToDelete(ad.id); setShowDeleteModal(true); }}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{editingAd ? 'Modifier la Publicité' : 'Nouvelle Publicité'}</h2>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Promotion du mois"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows={2}
                  placeholder="Description optionnelle"
                />
              </div>

              {/* Upload média */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{editingAd ? 'Média (laisser vide pour garder l\'actuel)' : 'Média (Image ou Vidéo) *'}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors">
                  {mediaPreview ? (
                    <div className="space-y-3">
                      {(mediaFile?.type.startsWith('video')) || (!mediaFile && editingAd?.media_type === 'video') ? (
                        <video src={mediaPreview} className="max-h-48 mx-auto rounded-lg" controls />
                      ) : (
                        <img src={mediaPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        {editingAd && !mediaFile ? 'Changer le média' : 'Supprimer et choisir un autre fichier'}
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Cliquez pour uploader</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP, MP4, WebM, MOV (max 50 Mo)</p>
                      <p className="text-xs text-orange-500 mt-1 font-medium">Taille recommandée : 1200 × 400 px pour un rendu optimal</p>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Lien URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lien (optionnel)</label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>

              {/* Ordre + Statut */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{editingAd ? 'Mettre à jour' : 'Publier'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Supprimer cette publicité ?</h3>
              <p className="text-gray-500 mb-6">Cette action est irréversible. Le fichier média sera également supprimé.</p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setAdToDelete(null); }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal preview */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAd(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewAd(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300"
            >
              <X className="w-8 h-8" />
            </button>
            {previewAd.media_type === 'image' ? (
              <img src={previewAd.media_url} alt={previewAd.title} className="w-full rounded-2xl max-h-[80vh] object-contain" />
            ) : (
              <video src={previewAd.media_url} className="w-full rounded-2xl max-h-[80vh]" controls autoPlay />
            )}
            <div className="mt-3 text-center">
              <h3 className="text-white font-semibold text-lg">{previewAd.title}</h3>
              {previewAd.description && <p className="text-gray-300 text-sm mt-1">{previewAd.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvertisementManagement;
