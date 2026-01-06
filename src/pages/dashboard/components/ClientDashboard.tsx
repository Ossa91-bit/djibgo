import { useAuth } from '../../../hooks/useAuth';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import ReviewModal from '../../../components/booking/ReviewModal';
import CancellationModal from '../../../components/booking/CancellationModal';
import RideHistoryModal from '../../../components/history/RideHistoryModal';
import LoyaltyCard from '../../../components/loyalty/LoyaltyCard';
import ChatModal from '../../../components/chat/ChatModal';
import LiveTrackingMap from '../../../components/tracking/LiveTrackingMap';
import NotificationsPanel from '../../../components/dashboard/NotificationsPanel';

// Add ProfileSettingsModal component
interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onUpdateProfile: (updates: any) => Promise<any>;
}

function ProfileSettingsModal({ isOpen, onClose, user, profile, onUpdateProfile }: ProfileSettingsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    avatar_url: profile?.avatar_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await onUpdateProfile(formData);
      
      if (error) {
        setError('Error updating profile');
      } else {
        setSuccessMessage('Profile updated successfully');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError('Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-600 mr-2"></i>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-check-line text-green-600 mr-2"></i>
                <span className="text-green-700 text-sm">{successMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profile Picture Section */}
            <div className="text-center mb-6">
              <div className="relative inline-block">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-orange-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-200">
                    <i className="ri-user-line text-orange-500 text-3xl"></i>
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
                >
                  <i className="ri-camera-line text-sm"></i>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">Click to change photo</p>
            </div>

            {/* Basic Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="Email cannot be modified"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email address cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="+253 XX XX XX XX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your complete address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select a city</option>
                <option value="Djibouti">Djibouti</option>
                <option value="Ali Sabieh">Ali Sabieh</option>
                <option value="Dikhil">Dikhil</option>
                <option value="Tadjourah">Tadjourah</option>
                <option value="Obock">Obock</option>
                <option value="Arta">Arta</option>
              </select>
            </div>

            {/* Account Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Account Status</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified Account</span>
                <div className={`flex items-center ${profile?.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
                  <i className={`${profile?.is_verified ? 'ri-check-line' : 'ri-time-line'} mr-1`}></i>
                  <span className="text-sm font-medium">
                    {profile?.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              {!profile?.is_verified && (
                <p className="text-xs text-orange-600 mt-1">
                  Verify your email to activate your account
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

interface ClientDashboardProps {
  profile: any;
  data: any;
  onRefresh: () => void;
}

export default function ClientDashboard({ profile, data, onRefresh }: ClientDashboardProps) {
  const { user, updateProfile, signOut } = useAuth();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Nouveaux états pour les nouvelles fonctionnalités
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [showLoyaltyCard, setShowLoyaltyCard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<any>(null);
  const [selectedBookingForTracking, setSelectedBookingForTracking] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && notificationsData) {
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('client-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new : n)
          );
          setUnreadCount(prev => {
            const unread = notifications.filter(n => !n.read).length;
            return unread;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleNotificationClick = (notification: any) => {
    // Fermer le panneau
    setShowNotificationsPanel(false);

    // Gérer les actions selon le type de notification
    if (notification.type === 'chat_started' && notification.booking_id) {
      const booking = data?.bookings?.find((b: any) => b.id === notification.booking_id);
      if (booking) {
        handleOpenChat(booking);
      }
    } else if (notification.type === 'booking_confirmed' && notification.booking_id) {
      // Aller à l'onglet réservations
      setActiveTab('bookings');
    } else if (notification.type === 'booking_completed' && notification.booking_id) {
      // Proposer de laisser un avis
      const booking = data?.bookings?.find((b: any) => b.id === notification.booking_id);
      if (booking) {
        handleLeaveReview(booking);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    totalBookings: data?.bookings?.length || 0,
    completedBookings: data?.bookings?.filter((b: any) => b.status === 'completed').length || 0,
    totalSpent: data?.bookings
      ?.filter((b: any) => b.status === 'completed')
      ?.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount), 0) || 0,
    reviewsGiven: data?.reviews?.length || 0
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must not exceed 5MB');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    setIsUploadingAvatar(true);
    setUploadError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Supprimer l'ancien avatar s'il existe
      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/storage/v1/object/public/avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([oldPath]);
          }
        } catch (err) {
          console.log('No old avatar to remove');
        }
      }

      // Télécharger le nouveau fichier
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Mettre à jour le profil
      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);

      // Rafraîchir les données
      onRefresh();
      
      setUploadError(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError('Error uploading image');
      setTimeout(() => setUploadError(null), 3000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLeaveReview = (booking: any) => {
    setSelectedBookingForReview({
      id: booking.id,
      professional_id: booking.professional_id,
      professional_name: booking.professional_name || 'Professionnel',
      service_category: booking.service_category || 'Service'
    });
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    // Refresh bookings to update review status
    onRefresh();
  };

  const handleCancelBooking = (booking: any) => {
    setBookingToCancel(booking);
    setCancellationModalOpen(true);
  };

  const handleCancellationSuccess = () => {
    setCancellationModalOpen(false);
    setBookingToCancel(null);
    onRefresh();
  };

  const handleOpenChat = (booking: any) => {
    setSelectedBookingForChat(booking);
    setShowChat(true);
  };

  const handleOpenTracking = (booking: any) => {
    setSelectedBookingForTracking(booking);
    setShowTracking(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
    setShowAccountMenu(false);
  };

  const handleGoHome = () => {
    navigate('/');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Upload Error Message */}
        {uploadError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 mr-2"></i>
              <span className="text-red-700">{uploadError}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar avec bouton de téléchargement */}
              <div className="relative">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-200">
                    <i className="ri-user-line text-orange-500 text-2xl"></i>
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer">
                  {isUploadingAvatar ? (
                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                  ) : (
                    <i className="ri-camera-line text-sm"></i>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
                <p className="text-gray-600 mt-2">Bienvenue, {profile.full_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Badge */}
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsPanel(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <i className="ri-notification-line text-xl"></i>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Bouton Aller à l'accueil */}
              <button
                onClick={handleGoHome}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="ri-home-line text-gray-600"></i>
                <span className="text-sm font-medium text-gray-700">Accueil</span>
              </button>

              {/* Menu Mon Compte */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-user-settings-line text-gray-600"></i>
                  <span className="text-sm font-medium text-gray-700">Mon Compte</span>
                  <i className={`ri-arrow-down-s-line text-gray-600 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`}></i>
                </button>

                {showAccountMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleEditProfile}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <i className="ri-edit-line text-gray-500"></i>
                      <span>Modifier mon profil</span>
                    </button>
                    
                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                    >
                      <i className="ri-logout-box-line"></i>
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Client</span>
                {profile.is_verified && (
                  <i className="ri-verified-badge-fill text-blue-500" title="Profil vérifié"></i>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Réservations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <i className="ri-calendar-line text-2xl text-orange-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Services terminés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
              </div>
              <i className="ri-check-line text-2xl text-green-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total dépensé</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSpent.toLocaleString()} FDJ</p>
              </div>
              <i className="ri-money-dollar-circle-line text-2xl text-blue-500"></i>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avis donnés</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviewsGiven}</p>
              </div>
              <i className="ri-star-line text-2xl text-yellow-500"></i>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <i className="ri-settings-3-line text-orange-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Paramètres</h3>
            <p className="font-medium text-gray-700">Paramètres du profil</p>
          </button>

          <button 
            onClick={() => navigate('/services')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <i className="ri-search-line text-green-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Trouver des services</h3>
            <p className="font-medium text-gray-700">Parcourir les professionnels</p>
          </button>

          <button 
            onClick={() => setShowRideHistory(true)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <i className="ri-history-line text-blue-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Historique</h3>
            <p className="font-medium text-gray-700">Courses passées</p>
          </button>

          <button 
            onClick={() => setShowLoyaltyCard(true)}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 group cursor-pointer text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <i className="ri-vip-crown-line text-purple-500 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Fidélité</h3>
            <p className="font-medium text-gray-700">Points et récompenses</p>
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden" data-section="bookings">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-4 font-medium text-sm border-b-2 ${
                  activeTab === 'bookings'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes réservations
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-4 font-medium text-sm border-b-2 ${
                  activeTab === 'reviews'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes avis
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                {data?.bookings?.length > 0 ? (
                  data.bookings.map((booking: any) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.services?.title}</h3>
                          <p className="text-sm text-gray-600">
                            Avec {booking.profiles?.full_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(booking.scheduled_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(booking.status)}
                          <p className="text-lg font-semibold text-gray-900 mt-2">
                            {parseFloat(booking.total_amount).toLocaleString()} FDJ
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="text-sm text-gray-600">
                          <i className="ri-map-pin-line mr-1"></i>
                          {booking.address}
                        </p>
                        <div className="flex space-x-2">
                          {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                            <>
                              <button 
                                onClick={() => handleOpenChat(booking)}
                                className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer"
                                title="Chat en direct"
                              >
                                <i className="ri-chat-3-line mr-1"></i>
                                Chat
                              </button>
                              <button 
                                onClick={() => handleOpenTracking(booking)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                                title="Suivi GPS"
                              >
                                <i className="ri-map-pin-line mr-1"></i>
                                Suivre
                              </button>
                            </>
                          )}
                          {booking.status === 'completed' && (
                            <button 
                              onClick={() => handleLeaveReview(booking)}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer"
                            >
                              Laisser un avis
                            </button>
                          )}
                          {booking.status === 'pending' && (
                            <button 
                              onClick={() => handleCancelBooking(booking)}
                              className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                            >
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-calendar-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Aucune réservation pour le moment</p>
                    <button 
                      onClick={() => navigate('/services')}
                      className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Explorer les services
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {data?.reviews?.length > 0 ? (
                  data.reviews.map((review: any) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">
                          Avis pour {review.profiles?.full_name}
                        </h3>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400`}
                            ></i>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{review.comment}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(review.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="ri-star-line text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Aucun avis donné pour le moment</p>
                  </div>
                )}
              </div>
            )}

            {/* Section Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <div className="flex gap-2">
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium border border-orange-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <i className="ri-check-double-line mr-1"></i>
                        Tout marquer comme lu
                      </button>
                    )}
                    <button
                      onClick={loadNotifications}
                      className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 font-medium border border-orange-300 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <i className="ri-refresh-line mr-1"></i>
                      Actualiser
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <i className="ri-notification-off-line text-4xl text-gray-400 mb-3"></i>
                    <p className="text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => {
                      const style = getNotificationStyle(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 rounded-lg border-l-4 ${style.borderColor} ${
                            notification.is_read ? 'bg-white' : style.bgColor
                          } transition-colors`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`w-10 h-10 rounded-full ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <i className={`${style.icon} text-xl ${style.color}`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.created_at).toLocaleString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="ml-2 text-orange-600 hover:text-orange-700 text-sm font-medium whitespace-nowrap"
                              >
                                Marquer comme lu
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
        user={user}
        profile={profile}
        onUpdateProfile={updateProfile}
      />

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedBookingForReview(null);
          }}
          booking={selectedBookingForReview}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      {/* Cancellation Modal */}
      {bookingToCancel && (
        <CancellationModal
          booking={bookingToCancel}
          onClose={() => {
            setCancellationModalOpen(false);
            setBookingToCancel(null);
          }}
          onSuccess={handleCancellationSuccess}
        />
      )}

      {/* Ride History Modal */}
      <RideHistoryModal
        isOpen={showRideHistory}
        onClose={() => setShowRideHistory(false)}
      />

      {/* Loyalty Card Modal */}
      <LoyaltyCard
        isOpen={showLoyaltyCard}
        onClose={() => setShowLoyaltyCard(false)}
      />

      {/* Chat Modal */}
      {selectedBookingForChat && (
        <ChatModal
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedBookingForChat(null);
          }}
          bookingId={selectedBookingForChat.id}
          otherUserId={selectedBookingForChat.professional_id}
          otherUserName={selectedBookingForChat.profiles?.full_name || 'Professionnel'}
          otherUserAvatar={selectedBookingForChat.profiles?.avatar_url}
        />
      )}

      {/* Live Tracking Modal */}
      {selectedBookingForTracking && (
        <LiveTrackingMap
          bookingId={selectedBookingForTracking.id}
          driverId={selectedBookingForTracking.professional_id}
          onClose={() => {
            setShowTracking(false);
            setSelectedBookingForTracking(null);
          }}
        />
      )}

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        onNotificationClick={handleNotificationClick}
      />
    </div>
  );
}
