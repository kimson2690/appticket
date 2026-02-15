import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushNotificationState {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook pour gérer les notifications push Web
 * - Enregistre le Service Worker
 * - Demande la permission
 * - S'abonne/se désabonne aux push notifications
 */
export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    permission: 'default',
    isSubscribed: false,
    isLoading: true,
    error: null,
  });

  // Vérifier si le navigateur supporte les notifications push
  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  // Convertir la clé VAPID base64url en Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Initialiser: vérifier l'état actuel
  useEffect(() => {
    if (!isSupported) {
      setState(prev => ({
        ...prev,
        permission: 'unsupported',
        isLoading: false,
      }));
      return;
    }

    const init = async () => {
      try {
        const permission = Notification.permission as PushPermissionState;

        // Enregistrer le Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // Vérifier si déjà abonné
        const subscription = await registration.pushManager.getSubscription();

        setState({
          permission,
          isSubscribed: !!subscription,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        console.error('Erreur init push notifications:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message,
        }));
      }
    };

    init();
  }, [isSupported]);

  // S'abonner aux notifications push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(prev => ({
          ...prev,
          permission: permission as PushPermissionState,
          isLoading: false,
        }));
        return false;
      }

      // Récupérer la clé VAPID depuis le backend
      const vapidResponse = await apiService.getVapidPublicKey();
      if (!vapidResponse.public_key) {
        throw new Error('Clé VAPID non disponible');
      }

      // S'abonner au Push Manager
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidResponse.public_key).buffer as ArrayBuffer,
      });

      // Envoyer la subscription au backend
      const subscriptionJson = subscription.toJSON();
      await apiService.subscribePush({
        endpoint: subscriptionJson.endpoint!,
        keys: {
          p256dh: subscriptionJson.keys!.p256dh!,
          auth: subscriptionJson.keys!.auth!,
        },
      });

      setState({
        permission: 'granted',
        isSubscribed: true,
        isLoading: false,
        error: null,
      });

      console.log('✅ Push notifications activées');
      return true;

    } catch (err: any) {
      console.error('Erreur abonnement push:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
      return false;
    }
  }, [isSupported]);

  // Se désabonner des notifications push
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notifier le backend
        await apiService.unsubscribePush({
          endpoint: subscription.endpoint,
        });

        // Désabonner côté navigateur
        await subscription.unsubscribe();
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }));

      console.log('🔕 Push notifications désactivées');
      return true;

    } catch (err: any) {
      console.error('Erreur désabonnement push:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
      return false;
    }
  }, [isSupported]);

  return {
    ...state,
    isSupported,
    subscribe,
    unsubscribe,
  };
}
