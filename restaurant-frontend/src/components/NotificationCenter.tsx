import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Check, AlertTriangle, Info, ChevronRight, BellRing, BellOff } from 'lucide-react';
import { apiService, type AppNotification } from '../services/api';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationCenterProps {
  onNotificationCountChange?: (count: number) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationCountChange }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const push = usePushNotifications();

  // Auto-subscribe aux push notifications si permission déjà accordée
  useEffect(() => {
    if (push.isSupported && push.permission === 'granted' && !push.isSubscribed && !push.isLoading) {
      push.subscribe();
    }
  }, [push.isSupported, push.permission, push.isSubscribed, push.isLoading]);

  // Charger les notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getNotifications();
      setNotifications(data);
      
      // Notifier le parent du nombre de notifications non lues
      const unreadCount = data.filter(n => !n.read).length;
      onNotificationCountChange?.(unreadCount);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Marquer comme lue
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await apiService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );
      
      // Mettre à jour le compteur
      const unreadCount = notifications.filter(n => !n.read && n.id !== id).length;
      onNotificationCountChange?.(unreadCount);
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );
      onNotificationCountChange?.(0);
    } catch (error) {
      console.error('Erreur lors du marquage global:', error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.deleteNotification(id);
      const deletedNotif = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Mettre à jour le compteur si c'était non lue
      if (deletedNotif && !deletedNotif.read) {
        const unreadCount = notifications.filter(n => !n.read && n.id !== id).length;
        onNotificationCountChange?.(unreadCount);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Basculer l'état étendu d'une notification
  const toggleExpanded = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification: AppNotification) => {
    // Marquer comme lue
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Cas spécial : invitation de notation → ouvrir directement le modal
    const metadata = notification.metadata as any;
    if (metadata?.type === 'review_invitation' && metadata?.order_id) {
      setIsOpen(false);
      navigate(`/admin/my-history?review=${metadata.order_id}`);
      return;
    }
    
    // Naviguer vers l'URL d'action si elle existe
    if (notification.action_url) {
      setIsOpen(false);
      navigate(notification.action_url);
    } else {
      // Sinon, fermer juste le dropdown
      setIsOpen(false);
    }
  };

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Charger au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Polling toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Obtenir l'icône selon le type
  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-white shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <p className="text-xs text-gray-500">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              {push.isSupported && (
                <button
                  onClick={() => push.isSubscribed ? push.unsubscribe() : push.subscribe()}
                  disabled={push.isLoading || push.permission === 'denied'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    push.isSubscribed
                      ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                      : push.permission === 'denied'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={
                    push.isSubscribed
                      ? 'Notifications push activées'
                      : push.permission === 'denied'
                        ? 'Notifications push bloquées par le navigateur'
                        : 'Activer les notifications push'
                  }
                >
                  {push.isSubscribed ? <BellRing className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Tout marquer lu
                </button>
              )}
            </div>
          </div>

          {/* Bannière push si pas encore activé */}
          {push.isSupported && !push.isSubscribed && push.permission !== 'denied' && (
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BellRing className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800">Activer les notifications push</p>
                  <p className="text-[10px] text-gray-500">Recevez vos alertes même quand l'app est en arrière-plan</p>
                </div>
                <button
                  onClick={() => push.subscribe()}
                  disabled={push.isLoading}
                  className="px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm flex-shrink-0"
                >
                  {push.isLoading ? '...' : 'Activer'}
                </button>
              </div>
            </div>
          )}

          {/* Bannière si push bloqué */}
          {push.isSupported && push.permission === 'denied' && (
            <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
              <p className="text-[10px] text-red-600 font-medium">
                ⚠️ Les notifications push sont bloquées. Modifiez les paramètres de votre navigateur pour les réactiver.
              </p>
            </div>
          )}

          {/* Liste des notifications */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-1">Aucune notification</p>
                <p className="text-sm text-gray-400">Vous êtes à jour !</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    relative p-4 border-b border-gray-100 cursor-pointer transition-all
                    hover:bg-gray-50 group
                    ${!notification.read ? 'bg-orange-50/20' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icône */}
                    <div className={`
                      flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                      ${notification.type === 'success' ? 'bg-green-100' : ''}
                      ${notification.type === 'alert' ? 'bg-orange-100' : ''}
                      ${notification.type === 'warning' ? 'bg-yellow-100' : ''}
                      ${notification.type === 'info' ? 'bg-blue-100' : ''}
                    `}>
                      {getIcon(notification.type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="mb-2">
                        <p className={`text-sm text-gray-600 whitespace-pre-wrap ${
                          expandedNotifications.has(notification.id) ? '' : 'line-clamp-3'
                        }`}>
                          {notification.message}
                        </p>
                        {notification.message.length > 120 && (
                          <button
                            onClick={(e) => toggleExpanded(notification.id, e)}
                            className="text-xs text-orange-600 hover:text-orange-700 font-medium mt-1"
                          >
                            {expandedNotifications.has(notification.id) ? 'Voir moins' : 'Voir plus'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                        {notification.action_url && (
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={(e) => markAsRead(notification.id, e)}
                          className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 transition-colors"
                          title="Marquer comme lu"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page if exists
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-orange-600 font-medium transition-colors"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
