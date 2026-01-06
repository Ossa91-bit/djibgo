import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  booking_id?: string;
  created_at: string;
  metadata?: any;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export default function NotificationsPanel({ isOpen, onClose, onNotificationClick }: NotificationsPanelProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (isOpen && profile) {
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [isOpen, profile]);

  const fetchNotifications = async (isRetry = false) => {
    // Vérifier l'authentification avant de faire la requête
    if (!profile?.id) {
      setError('Vous devez être connecté pour voir les notifications');
      setLoading(false);
      return;
    }

    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setNotifications(data);
        setRetryCount(0); // Reset retry count on success
        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
      
      // Gestion intelligente des erreurs
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Problème de connexion. Vérifiez votre internet.');
        
        // Retry automatique avec backoff exponentiel (max 3 tentatives)
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchNotifications(true);
          }, delay);
        }
      } else if (err.message?.includes('JWT')) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Erreur lors du chargement des notifications.');
      }
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (!profile?.id) return () => {};

    const channel = supabase
      .channel('notifications-panel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications ?')) {
      return;
    }

    if (!profile?.id) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', profile.id);

      setNotifications([]);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      booking_request: 'ri-calendar-line',
      booking_confirmed: 'ri-check-line',
      booking_cancelled: 'ri-close-line',
      booking_started: 'ri-play-line',
      booking_completed: 'ri-flag-line',
      chat_started: 'ri-chat-3-line',
      new_message: 'ri-message-3-line',
      payment_received: 'ri-money-dollar-circle-line',
      review_received: 'ri-star-line',
      document_verified: 'ri-shield-check-line',
      document_rejected: 'ri-error-warning-line',
      system: 'ri-notification-line'
    };
    return icons[type] || 'ri-notification-line';
  };

  const getNotificationColor = (type: string) => {
    const colors: Record<string, string> = {
      booking_request: 'text-orange-500',
      booking_confirmed: 'text-green-500',
      booking_cancelled: 'text-red-500',
      booking_started: 'text-blue-500',
      booking_completed: 'text-green-600',
      chat_started: 'text-teal-500',
      new_message: 'text-teal-600',
      payment_received: 'text-green-500',
      review_received: 'text-yellow-500',
      document_verified: 'text-green-500',
      document_rejected: 'text-red-500',
      system: 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  };

  // Fonction pour obtenir l'icône et la couleur selon le type de notification
  const getNotificationStyle = (type: string) => {
    const styles = {
      'new_booking': {
        icon: 'ri-calendar-line',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      'booking_confirmed': {
        icon: 'ri-check-line',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'booking_cancelled': {
        icon: 'ri-close-line',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      'service_started': {
        icon: 'ri-play-line',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      'service_completed': {
        icon: 'ri-flag-line',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200'
      },
      'chat_started': {
        icon: 'ri-chat-1-line',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200'
      },
      'payment_received': {
        icon: 'ri-money-dollar-circle-line',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'new_review': {
        icon: 'ri-star-line',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      'document_verified': {
        icon: 'ri-shield-check-line',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      'default': {
        icon: 'ri-notification-3-line',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200'
      }
    };

    return styles[type as keyof typeof styles] || styles.default;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="ri-notification-line text-orange-500 text-xl"></i>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Filtres et actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'unread'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                >
                  Tout marquer comme lu
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-600 hover:text-red-700 font-medium whitespace-nowrap"
                >
                  <i className="ri-delete-bin-line mr-1"></i>
                  Tout supprimer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des notifications */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <i className="ri-error-warning-line text-red-500 text-xl flex-shrink-0 mt-0.5"></i>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
                {retryCount > 0 && retryCount < 3 && (
                  <p className="text-xs text-red-600 mt-1">
                    Nouvelle tentative en cours... ({retryCount}/3)
                  </p>
                )}
                {retryCount >= 3 && (
                  <button
                    onClick={() => {
                      setRetryCount(0);
                      fetchNotifications();
                    }}
                    className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium underline"
                  >
                    Réessayer maintenant
                  </button>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Chargement des notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                    notification.is_read
                      ? 'border-gray-200 bg-white'
                      : 'border-orange-200 bg-orange-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icône */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.is_read ? 'bg-gray-100' : 'bg-white'
                    }`}>
                      <i className={`${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-xl`}></i>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Badge non lu */}
                      {!notification.is_read && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white">
                            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></span>
                            Nouveau
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="text-orange-600 hover:text-orange-700 transition-colors"
                          title="Marquer comme lu"
                        >
                          <i className="ri-check-line text-lg"></i>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-notification-off-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-gray-500 text-sm">
                {filter === 'unread'
                  ? 'Toutes vos notifications ont été lues'
                  : 'Vous recevrez des notifications pour les réservations, messages et mises à jour'}
              </p>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              setRetryCount(0);
              fetchNotifications();
            }}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <i className={`ri-refresh-line mr-2 ${loading ? 'animate-spin' : ''}`}></i>
            {loading ? 'Actualisation...' : 'Actualiser'}
          </button>
        </div>
      </div>
    </div>
  );
}
