import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import CreateServiceModal from '../../../components/dashboard/CreateServiceModal';
import CalendarManagementModal from '../../../components/dashboard/CalendarManagementModal';
import DocumentUploadModal from '../../../components/booking/DocumentUploadModal';
import DocumentManagementModal from '../../../components/dashboard/DocumentManagementModal';
import LocationManagementModal from '../../../components/dashboard/LocationManagementModal';
import ChatModal from '../../../components/chat/ChatModal';
import NotificationsPanel from '../../../components/dashboard/NotificationsPanel';
import { useNavigate } from 'react-router-dom';
import { WalletDashboard } from '../../../components/wallet/WalletDashboard';
import WithdrawalRequestModal from '../../../components/dashboard/WithdrawalRequestModal';

interface ProfessionalDashboardProps {
  profile: UserProfile;
  data: any;
  onRefresh: () => void;
}

export default function ProfessionalDashboard({ profile, data, onRefresh }: ProfessionalDashboardProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showDocumentManagement, setShowDocumentManagement] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  
  // Nouveaux états pour le chat et le suivi GPS
  const [showChat, setShowChat] = useState(false);
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<any>(null);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [activeChatBookings, setActiveChatBookings] = useState<Set<string>>(new Set());

  // États pour la gestion des services
  const [serviceToDeactivate, setServiceToDeactivate] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [showStripeOnboardingModal, setShowStripeOnboardingModal] = useState(false);
  const [stripeOnboardingLoading, setStripeOnboardingLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);

  // Fonction pour récupérer les données du portefeuille
  const fetchWalletData = async () => {
    // Vérifier que l'utilisateur est chargé et a un ID valide
    if (!user?.id) {
      console.log('En attente du chargement de l\'utilisateur...');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('professional_wallets')
        .select('*')
        .eq('professional_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors de la récupération du portefeuille:', error);
        return;
      }

      setWalletData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération du portefeuille:', error);
    }
  };

  // Fonction pour récupérer les transactions
  const fetchTransactions = async () => {
    if (!user?.id) {
      console.log('En attente du chargement de l\'utilisateur...');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur lors de la récupération des transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
    }
  };

  // Fonction pour récupérer les demandes de retrait
  const fetchWithdrawals = async () => {
    if (!user?.id) {
      console.log('En attente du chargement de l\'utilisateur...');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erreur lors de la récupération des retraits:', error);
        return;
      }

      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des retraits:', error);
    }
  };

  const fetchWithdrawalRequests = async () => {
    if (!user) return;
    
    setLoadingWithdrawals(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    // Ne charger les données que si l'utilisateur est disponible
    if (user?.id) {
      fetchWalletData();
      fetchTransactions();
      fetchWithdrawals();
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWithdrawalRequests();
    }
  }, [activeTab, user]);

  const fetchProfessionalProfile = async () => {
    try {
      const { data: profData, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

      if (!error && profData) {
        setProfessionalProfile(profData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil professionnel:', error);
    }
  };

  const subscribeToNewChats = () => {
    // Cette fonction n'est plus nécessaire car l'abonnement est géré dans useEffect
    // Mais on la garde pour la compatibilité
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      
      // Recalculer le nombre de non lus
      const unread = notifications.filter(n => n.id !== notificationId && !n.is_read).length;
      setUnreadCount(unread);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;

      // Mettre à jour l'état local
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour des notifications');
    }
  };

  const checkTrackingStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('is_active')
        .eq('driver_id', profile.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setIsTrackingActive(data.is_active);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const toggleLocationTracking = async () => {
    if (isTrackingActive) {
      // Arrêter le suivi
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
        setLocationWatchId(null);
      }

      // Désactiver dans la base de données
      await supabase
        .from('driver_locations')
        .update({ is_active: false })
        .eq('driver_id', profile.id);

      setIsTrackingActive(false);
    } else {
      // Démarrer le suivi
      if ('geolocation' in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, heading, speed, accuracy } = position.coords;

            // Mettre à jour la position dans la base de données
            await supabase
              .from('driver_locations')
              .upsert({
                driver_id: profile.id,
                latitude,
                longitude,
                heading: heading || null,
                speed: speed || null,
                accuracy: accuracy || null,
                is_active: true,
                updated_at: new Date().toISOString()
              });
          },
          (error) => {
            console.error('Erreur de géolocalisation:', error);
            alert('Impossible d\'accéder à votre position. Veuillez autoriser la géolocalisation.');
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );

        setLocationWatchId(watchId);
        setIsTrackingActive(true);
      } else {
        alert('La géolocalisation n\'est pas supportée par votre navigateur');
      }
    }
  };

  const handleOpenChat = (booking: any) => {
    setSelectedBookingForChat(booking);
    setShowChat(true);
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingBookingId(bookingId);
      
      const booking = data?.bookings?.find((b: any) => b.id === bookingId);
      if (!booking) return;

      // Update booking status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Send notification based on status
      if (newStatus === 'confirmed') {
        await supabase.functions.invoke('notification-system', {
          body: {
            userId: booking.user_id,
            type: 'booking_confirmed',
            title: 'Réservation confirmée',
            message: `Votre réservation pour ${booking.services?.title} a été confirmée`,
            bookingId: bookingId
          }
        });
      } else if (newStatus === 'in_progress') {
        await supabase.functions.invoke('notification-system', {
          body: {
            userId: booking.user_id,
            type: 'booking_started',
            title: 'Course démarrée',
            message: `Votre course ${booking.services?.title} a démarré`,
            bookingId: bookingId
          }
        });
      } else if (newStatus === 'completed') {
        await supabase.functions.invoke('notification-system', {
          body: {
            userId: booking.user_id,
            type: 'service_completed',
            title: 'Service terminé',
            message: `Votre service ${booking.services?.title} est terminé. Laissez un avis !`,
            bookingId: bookingId
          }
        });

        // Add loyalty points for completed booking
        if (booking.total_price) {
          const points = Math.floor(booking.total_price / 10);
          
          await supabase.from('loyalty_points').upsert({
            user_id: booking.user_id,
            points: points,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

          await supabase.from('loyalty_transactions').insert({
            user_id: booking.user_id,
            points: points,
            type: 'earned',
            description: `Course terminée - ${booking.services?.title}`
          });
        }
      } else if (newStatus === 'cancelled') {
        await supabase.functions.invoke('notification-system', {
          body: {
            userId: booking.user_id,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: `Votre réservation pour ${booking.services?.title} a été annulée`,
            bookingId: bookingId
          }
        });
      }

      // Refresh data
      onRefresh();
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Une erreur est survenue lors de la mise à jour de la réservation');
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Alias pour la compatibilité
  const handleBookingStatusUpdate = handleUpdateBookingStatus;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En cours', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
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
    totalRevenue: data?.bookings
      ?.filter((b: any) => b.status === 'completed')
      ?.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount), 0) || 0,
    commissionTotal: data?.bookings
      ?.filter((b: any) => b.status === 'completed')
      ?.reduce((sum: number, b: any) => sum + parseFloat(b.commission_amount), 0) || 0,
    averageRating: data?.reviews?.length > 0 
      ? (data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
      : '0.0',
    activeServices: data?.services?.filter((s: any) => s.is_active).length || 0
  };

  // Vérifier si en période d'essai
  const isTrialActive = profile.trial_end_date && new Date(profile.trial_end_date) > new Date();
  const trialDaysLeft = isTrialActive 
    ? Math.ceil((new Date(profile.trial_end_date!).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
    : 0;

  const handleServiceCreated = () => {
    // Recharger les services
    onRefresh();
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowServiceModal(true);
  };

  const handleServiceModalClose = () => {
    setShowServiceModal(false);
    setEditingService(null);
  };

  const handleServiceSuccess = () => {
    setShowServiceModal(false);
    setEditingService(null);
    onRefresh();
  };

  const handleAddService = () => {
    setEditingService(null);
    setShowServiceModal(true);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image valide');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image ne doit pas dépasser 5 Mo');
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
          console.log('Aucun ancien avatar à supprimer');
        }
      }

      // Télécharger le nouveau fichier
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Impossible d\'obtenir l\'URL publique');
      }

      // Mettre à jour uniquement la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Rafraîchir les données
      await onRefresh();
      
      setUploadError(null);
    } catch (err: any) {
      console.error('Erreur complète:', err);
      setUploadError(err.message || 'Erreur lors du téléchargement de l\'image');
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      event.target.value = '';
    }
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
    setShowProfileMenu(false);
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

  const handleDeactivateService = async () => {
    if (!serviceToDeactivate) return;

    setIsDeactivating(true);
    try {
      const { error } = await supabase
        .from('services')
        .update({
          is_active: false
        })
        .eq('id', serviceToDeactivate);

      if (error) throw error;

      // Fermer la modal et rafraîchir
      setServiceToDeactivate(null);
      onRefresh();
      
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      alert('Une erreur est survenue lors de la désactivation du service');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({
          is_active: true
        })
        .eq('id', serviceId);

      if (error) throw error;

      // Rafraîchir la liste
      onRefresh();
      
    } catch (error) {
      console.error('Erreur lors de l\'activation:', error);
      alert('Une erreur est survenue lors de l\'activation du service');
    }
  };

  const handleEditServiceClick = (service: any) => {
    setSelectedService(service);
    setEditingService(service);
    setShowServiceModal(true);
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
    } else if (notification.type === 'booking_request' && notification.booking_id) {
      // Aller à l'onglet réservations
      setActiveTab('bookings');
    } else if (notification.type === 'review_received') {
      // Aller à l'onglet avis
      setActiveTab('reviews');
    }
  };

  // Fonction pour obtenir les informations de statut de vérification
  const getVerificationStatusInfo = () => {
    if (!professionalProfile) {
      return {
        icon: 'ri-information-line',
        color: 'gray',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-900',
        title: 'Profil en attente',
        message: 'Votre profil professionnel est en cours de création.'
      };
    }

    const status = professionalProfile.verification_status;

    switch (status) {
      case 'verified':
        return {
          icon: 'ri-checkbox-circle-line',
          color: 'green',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          title: 'Profil vérifié',
          message: 'Votre profil professionnel a été vérifié avec succès. Vous pouvez maintenant recevoir des réservations.'
        };
      case 'pending':
        return {
          icon: 'ri-time-line',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          title: 'Vérification en cours',
          message: 'Vos documents sont en cours de vérification. Nous vous contacterons sous 24-48 heures.'
        };
      case 'rejected':
        return {
          icon: 'ri-close-circle-line',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          title: 'Vérification refusée',
          message: 'Vos documents n\'ont pas pu être vérifiés. Veuillez télécharger de nouveaux documents conformes.'
        };
      default:
        return {
          icon: 'ri-upload-cloud-line',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          title: 'Documents requis',
          message: 'Veuillez télécharger vos documents professionnels pour commencer à recevoir des réservations.'
        };
    }
  };

  const loadNotifications = async () => {
    await fetchNotifications();
  };

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'ri-dashboard-line' },
    { id: 'bookings', label: 'Réservations', icon: 'ri-calendar-check-line' },
    { id: 'wallet', label: 'Portefeuille', icon: 'ri-wallet-3-line' },
    { id: 'services', label: 'Mes services', icon: 'ri-tools-line' },
    { id: 'availability', label: 'Disponibilité', icon: 'ri-time-line' },
    { id: 'reviews', label: 'Avis clients', icon: 'ri-star-line' },
    { id: 'documents', label: 'Documents', icon: 'ri-file-text-line' },
    { id: 'settings', label: 'Paramètres', icon: 'ri-settings-3-line' },
  ];

  const handleStripeConnect = async () => {
    if (!user) return;
    
    setStripeOnboardingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/stripe-connect-onboarding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_account'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la configuration Stripe');
      }

      if (data.onboardingUrl) {
        // Ouvrir l'URL d'onboarding Stripe dans un nouvel onglet
        window.open(data.onboardingUrl, '_blank');
        setShowStripeOnboardingModal(true);
      }
    } catch (error: any) {
      console.error('Erreur lors de la configuration Stripe:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue lors de la configuration de Stripe Connect. Veuillez réessayer.'}`);
    } finally {
      setStripeOnboardingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Upload Error Message */}
      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <i className="ri-error-warning-line text-red-600 mr-2"></i>
            <span className="text-red-700">{uploadError}</span>
          </div>
        </div>
      )}

      {/* En-tête */}
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
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord professionnel</h1>
              <p className="text-gray-600 mt-2">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Bouton de suivi GPS */}
            <button
              onClick={toggleLocationTracking}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                isTrackingActive
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <i className={`${isTrackingActive ? 'ri-map-pin-fill' : 'ri-map-pin-line'}`}></i>
              <span>{isTrackingActive ? 'GPS Actif' : 'Activer GPS'}</span>
            </button>

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
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="ri-user-settings-line text-gray-600"></i>
                <span className="text-sm font-medium text-gray-700">Mon Compte</span>
                <i className={`ri-arrow-down-s-line text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={handleEditProfile}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <i className="ri-edit-line text-gray-500"></i>
                    <span>Modifier mon profil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowDocumentUpload(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <i className="ri-upload-2-line text-gray-500"></i>
                    <span>Télécharger des documents</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowDocumentManagement(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <i className="ri-folder-line text-gray-500"></i>
                    <span>Gérer mes documents</span>
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

            {/* Statut de vérification */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Professionnel</span>
              {profile.is_verified && (
                <i className="ri-verified-badge-fill text-blue-500" title="Profil vérifié"></i>
              )}
              {isTrialActive && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Essai gratuit - {trialDaysLeft} jours restants
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Alerte période d'essai */}
        {isTrialActive && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <i className="ri-gift-line text-green-500 mt-0.5"></i>
              <div>
                <h3 className="font-medium text-green-900">Période d'essai gratuite active</h3>
                <p className="text-sm text-green-700 mt-1">
                  Profitez de {trialDaysLeft} jours restants sans commission. 
                  Après cette période, une commission de 10% sera appliquée sur vos services réalisés.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notification de statut de vérification */}
        {professionalProfile && (
          <div className={`mt-4 border rounded-lg p-4 ${getVerificationStatusInfo().bgColor} ${getVerificationStatusInfo().borderColor}`}>
            <div className="flex items-start">
              <i className={`${getVerificationStatusInfo().icon} text-xl mr-3 flex-shrink-0 mt-0.5 text-${getVerificationStatusInfo().color}-600`}></i>
              <div className="flex-1">
                <h3 className={`text-sm font-medium mb-1 ${getVerificationStatusInfo().textColor}`}>
                  {getVerificationStatusInfo().title}
                </h3>
                <p className={`text-sm text-${getVerificationStatusInfo().color}-700`}>
                  {getVerificationStatusInfo().message}
                </p>
                {professionalProfile.verification_status === 'rejected' && (
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <i className="ri-upload-2-line mr-2"></i>
                    Télécharger de Nouveaux Documents
                  </button>
                )}
                {(professionalProfile.verification_status === 'pending' || !professionalProfile.verification_status) && (
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium flex items-center"
                  >
                    <i className="ri-upload-2-line mr-2"></i>
                    Télécharger mes Documents
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenus totaux</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} DJF</p>
              <p className="text-xs text-gray-500 mt-1">
                Commission payée: {stats.commissionTotal.toLocaleString()} DJF
              </p>
            </div>
            <i className="ri-money-dollar-circle-line text-2xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Réservations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedBookings} terminées
              </p>
            </div>
            <i className="ri-calendar-line text-2xl text-orange-500"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
              <div className="flex items-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`ri-star-${i < Math.floor(parseFloat(stats.averageRating)) ? 'fill' : 'line'} text-yellow-400 text-xs`}
                  ></i>
                ))}
                <span className="text-xs text-gray-500 ml-1">({data?.reviews?.length || 0} avis)</span>
              </div>
            </div>
            <i className="ri-star-line text-2xl text-yellow-500"></i>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Services actifs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeServices}</p>
              <p className="text-xs text-gray-500 mt-1">
                Sur {data?.services?.length || 0} total
              </p>
            </div>
            <i className="ri-tools-line text-2xl text-blue-500"></i>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium text-sm border-b-2 flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
                {tab.id === 'bookings' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
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

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Réservations récentes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Réservations récentes</h3>
                {data?.bookings?.slice(0, 3).map((booking: any) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{booking.services?.title}</h4>
                        <p className="text-sm text-gray-600">Client: {booking.profiles?.full_name}</p>
                        <p className="text-sm text-gray-500">{formatDate(booking.scheduled_date)}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-lg font-semibold text-gray-900 mt-2">
                          {parseFloat(booking.total_amount).toLocaleString()} DJF
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions rapides */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <i className="ri-add-line text-2xl text-gray-400 mb-2"></i>
                    <p className="font-medium text-gray-700">Créer un service</p>
                  </button>
                  
                  <button 
                    onClick={() => setShowCalendarModal(true)}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-calendar-line text-2xl text-gray-400 mb-2"></i>
                    <p className="font-medium text-gray-700">Gérer mon calendrier</p>
                  </button>
                  
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-map-pin-line text-2xl text-gray-400 mb-2"></i>
                    <p className="font-medium text-gray-700">Gérer ma localisation</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {data?.bookings?.length > 0 ? (
                data.bookings.map((booking: any) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{booking.services?.title}</h3>
                        <p className="text-sm text-gray-600">Client: {booking.profiles?.full_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDate(booking.scheduled_date)}
                        </p>
                        
                        {/* Indicateur de chat actif */}
                        {activeChatBookings.has(booking.id) && (
                          <div className="mt-2 flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                              <span className="w-2 h-2 bg-teal-500 rounded-full mr-1 animate-pulse"></span>
                              Chat en direct actif
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {getStatusBadge(booking.status)}
                        <p className="text-lg font-semibold text-gray-900 mt-2">
                          {parseFloat(booking.total_amount).toLocaleString()} FDJ
                        </p>
                        <p className="text-sm text-gray-500">
                          Commission: {parseFloat(booking.commission_amount).toLocaleString()} FDJ
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
                          <button 
                            onClick={() => handleOpenChat(booking)}
                            className={`text-sm font-medium cursor-pointer flex items-center ${
                              activeChatBookings.has(booking.id)
                                ? 'text-teal-600 hover:text-teal-700'
                                : 'text-teal-600 hover:text-teal-700'
                            }`}
                            title="Chat avec le client"
                          >
                            <i className="ri-chat-3-line mr-1"></i>
                            Chat
                            {activeChatBookings.has(booking.id) && (
                              <span className="ml-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
                            )}
                          </button>
                        )}
                        {updatingBookingId === booking.id ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Mise à jour...
                          </div>
                        ) : (
                          <>
                            {booking.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                  className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer"
                                >
                                  Confirmer
                                </button>
                                <button 
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'cancelled')}
                                  className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
                                >
                                  Refuser
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button 
                                onClick={() => handleBookingStatusUpdate(booking.id, 'in_progress')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                              >
                                Marquer en cours
                              </button>
                            )}
                            {booking.status === 'in_progress' && (
                              <button 
                                onClick={() => handleBookingStatusUpdate(booking.id, 'completed')}
                                className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer"
                              >
                                Terminer
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="ri-calendar-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Aucune réservation pour le moment</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Les clients pourront réserver vos services dès qu'ils seront publiés
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wallet' && (
            <WalletDashboard />
          )}

          {activeTab === 'services' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Mes services</h3>
                <button 
                  onClick={handleAddService}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line mr-2"></i>
                  Ajouter un service
                </button>
              </div>
              
              {data?.services?.length > 0 ? (
                <div className="space-y-4">
                  {data.services.map((service: any) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="text-sm text-gray-500">
                              <i className="ri-tag-line mr-1"></i>
                              {service.category}
                            </span>
                            {service.duration_minutes && (
                              <span className="text-sm text-gray-500">
                                <i className="ri-time-line mr-1"></i>
                                {service.duration_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {parseFloat(service.price).toLocaleString()} DJF
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                            service.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {service.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEditServiceClick(service)}
                            className="text-sm font-medium text-teal-600 hover:text-teal-700 whitespace-nowrap"
                          >
                            Modifier
                          </button>
                          {service.is_active ? (
                            <button
                              onClick={() => setServiceToDeactivate(service.id)}
                              className="text-sm font-medium text-red-600 hover:text-red-700 whitespace-nowrap"
                            >
                              Désactiver
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateService(service.id)}
                              className="text-sm font-medium text-green-600 hover:text-green-700 whitespace-nowrap"
                            >
                              Activer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="ri-tools-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Aucun service créé</p>
                  <button 
                    onClick={handleAddService}
                    className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Créer mon premier service
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Gérer ma disponibilité</h3>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-calendar-line mr-2"></i>
                  Modifier mon calendrier
                </button>
              </div>
              
              <div className="text-center py-12">
                <i className="ri-calendar-check-line text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 mb-4">
                  Gérez vos horaires de disponibilité et vos jours de congé
                </p>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Ouvrir le calendrier
                </button>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {data?.reviews?.length > 0 ? (
                data.reviews.map((review: any) => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        {review.profiles?.avatar_url ? (
                          <img
                            src={review.profiles.avatar_url}
                            alt={review.profiles.full_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="ri-user-line text-gray-500"></i>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.profiles?.full_name}</h4>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400`}
                              ></i>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="ri-star-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500">Aucun avis pour le moment</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Les clients pourront laisser des avis après avoir utilisé vos services
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Mes documents</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDocumentUpload(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-upload-2-line mr-2"></i>
                    Télécharger un document
                  </button>
                  <button
                    onClick={() => setShowDocumentManagement(true)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-folder-line mr-2"></i>
                    Gérer mes documents
                  </button>
                </div>
              </div>
              
              <div className="text-center py-12">
                <i className="ri-file-text-line text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 mb-4">
                  Téléchargez vos documents professionnels pour vérification
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Documents requis : Carte d'identité, Permis de conduire, Assurance, etc.
                </p>
                <button
                  onClick={() => setShowDocumentUpload(true)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Télécharger mes documents
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Paramètres du compte</h3>
              
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Informations personnelles</h4>
                  <button
                    onClick={handleEditProfile}
                    className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
                  >
                    <i className="ri-edit-line mr-2"></i>
                    Modifier mon profil
                  </button>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Documents professionnels</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDocumentUpload(true)}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
                    >
                      <i className="ri-upload-2-line mr-2"></i>
                      Télécharger des documents
                    </button>
                    <button
                      onClick={() => setShowDocumentManagement(true)}
                      className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
                    >
                      <i className="ri-folder-line mr-2"></i>
                      Gérer mes documents
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Localisation</h4>
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="text-orange-600 hover:text-orange-700 font-medium flex items-center"
                  >
                    <i className="ri-map-pin-line mr-2"></i>
                    Gérer ma localisation
                  </button>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Compte</h4>
                  <button
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 font-medium flex items-center"
                  >
                    <i className="ri-logout-box-line mr-2"></i>
                    Se déconnecter
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setShowStripeModal(true)}
                  disabled={walletData?.stripe_account_status === 'active'}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    walletData?.stripe_account_status === 'active'
                      ? 'border-green-200 bg-green-50'
                      : walletData?.stripe_account_status === 'pending'
                      ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                      : 'border-purple-200 bg-purple-50 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                      <i className="ri-bank-line text-white text-xl"></i>
                    </div>
                    <i className="ri-arrow-right-line text-purple-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Connecter à Stripe</h3>
                  <p className="text-sm text-gray-600">
                    Activez la connexion à votre compte Stripe pour recevoir des paiements
                  </p>
                </button>

                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className="p-6 rounded-xl border-2 border-teal-200 bg-teal-50 hover:border-teal-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                      <i className="ri-bank-card-line text-white text-xl"></i>
                    </div>
                    <i className="ri-arrow-right-line text-teal-600 text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Demandes de retrait</h3>
                  <p className="text-sm text-gray-600">
                    Gérer vos demandes de retrait et consulter l'historique
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Service Modal */}
      <CreateServiceModal
        isOpen={showServiceModal}
        onClose={handleServiceModalClose}
        onSuccess={handleServiceSuccess}
        editingService={editingService}
      />

      {/* Calendar Management Modal */}
      <CalendarManagementModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        professionalId={profile.id}
      />

      {/* Document Upload Modal */}
      {user && (
        <DocumentUploadModal
          isOpen={showDocumentUpload}
          onClose={() => setShowDocumentUpload(false)}
          professionalId={user.id}
          onUploadComplete={() => {
            fetchProfessionalProfile();
            onRefresh();
          }}
        />
      )}

      {/* Document Management Modal */}
      {user && (
        <DocumentManagementModal
          isOpen={showDocumentManagement}
          onClose={() => setShowDocumentManagement(false)}
          professionalId={user.id}
          onDocumentDeleted={() => {
            fetchProfessionalProfile();
            onRefresh();
          }}
        />
      )}

      {/* Location Management Modal */}
      {user && (
        <LocationManagementModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onLocationUpdated={() => {
            fetchProfessionalProfile();
            onRefresh();
          }}
        />
      )}

      {/* Chat Modal */}
      {selectedBookingForChat && (
        <ChatModal
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedBookingForChat(null);
          }}
          bookingId={selectedBookingForChat.id}
          otherUserId={selectedBookingForChat.client_id}
          otherUserName={selectedBookingForChat.profiles?.full_name || 'Client'}
          otherUserAvatar={selectedBookingForChat.profiles?.avatar_url}
        />
      )}

      {/* Modal de confirmation de désactivation */}
      {serviceToDeactivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="ri-alert-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Désactiver le service</h3>
            </div>

            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir désactiver ce service ? Il ne sera plus visible par les clients jusqu'à ce que vous le réactiviez.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setServiceToDeactivate(null)}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeactivateService()}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {isDeactivating ? 'Désactivation...' : 'Désactiver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        onNotificationClick={handleNotificationClick}
      />

      {/* Stripe Onboarding Modal */}
      {showStripeOnboardingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-bank-line text-3xl text-purple-600"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Configuration Stripe Connect
              </h3>
              <p className="text-gray-600 mb-6">
                Une nouvelle fenêtre s'est ouverte pour compléter votre inscription Stripe Connect. 
                Une fois terminé, revenez ici et actualisez la page.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowStripeOnboardingModal(false);
                    window.location.reload();
                  }}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
                >
                  J'ai terminé, actualiser
                </button>
                <button
                  onClick={() => setShowStripeOnboardingModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Requests Modal */}
      {showWithdrawalModal && (
        <WithdrawalRequestModal
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            fetchWalletData();
            fetchWithdrawalRequests();
          }}
          availableBalance={walletData?.available_balance || 0}
          professionalId={user?.id || ''}
          withdrawalRequests={withdrawalRequests}
          loading={loadingWithdrawals}
        />
      )}
    </div>
  );
}