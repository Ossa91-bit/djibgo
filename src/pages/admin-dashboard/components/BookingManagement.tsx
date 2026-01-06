import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Booking {
  id: string;
  client_id: string;
  professional_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  total_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    phone?: string;
  };
  professional_profile?: {
    full_name: string;
    phone?: string;
  };
  services?: {
    title: string;
    price: number;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  booking_id?: string;
  bookings?: any;
}

interface BookingManagementProps {
  selectedBookingId?: string | null;
  onClearSelection?: () => void;
}

export default function BookingManagement({ selectedBookingId, onClearSelection }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeView, setActiveView] = useState<'bookings' | 'notifications'>('bookings');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchNotifications();
  }, []);

  // Auto-open booking details when selectedBookingId is provided
  useEffect(() => {
    if (selectedBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === selectedBookingId);
      if (booking) {
        openDetailsModal(booking);
        if (onClearSelection) {
          onClearSelection();
        }
      }
    }
  }, [selectedBookingId, bookings]);

  const fetchBookings = async () => {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services(title, price),
          profiles!bookings_client_id_fkey(full_name, phone),
          professional_profile:profiles!bookings_professional_id_fkey(full_name, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur:', error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          bookings(
            *,
            services(title),
            profiles!bookings_client_id_fkey(full_name),
            professional_profile:profiles!bookings_professional_id_fkey(full_name)
          )
        `)
        .eq('type', 'booking')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (!error) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('type', 'booking')
        .eq('read', false);

      if (!error) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des notifications:', error);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (!error) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      setIsLoading(true);

      // Admin can update directly via Supabase (bypass Edge Function)
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh bookings list
      fetchBookings();
      
      // Show success message
      alert(`Statut de la réservation mis à jour avec succès: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut de la réservation');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailsModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedBooking(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmé';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined || isNaN(price)) {
      return '0 FDJ';
    }
    return `${price.toLocaleString('fr-FR')} FDJ`;
  };

  // Helper function to get the actual booking amount
  const getBookingAmount = (booking: Booking) => {
    // Use total_price if available, otherwise use service price
    if (booking.total_price && booking.total_price > 0) {
      return booking.total_price;
    }
    if (booking.services?.price && booking.services.price > 0) {
      return booking.services.price;
    }
    return 0;
  };

  // Helper function to get the actual booking date
  const getBookingDate = (booking: Booking) => {
    // Use booking_date if available, otherwise use created_at
    return booking.booking_date || booking.created_at;
  };

  // Helper function to get the booking time
  const getBookingTime = (booking: Booking) => {
    // If booking_time exists, return it
    if (booking.booking_time) {
      return booking.booking_time;
    }
    // Otherwise, extract time from created_at
    if (booking.created_at) {
      try {
        const date = new Date(booking.created_at);
        return date.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return 'Heure non spécifiée';
      }
    }
    return 'Heure non spécifiée';
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Réservations</h2>
          
          {/* Navigation Tabs */}
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveView('bookings')}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors ${
                activeView === 'bookings'
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Réservations
            </button>
            <button
              onClick={() => setActiveView('notifications')}
              className={`px-4 py-2 font-medium text-sm rounded-lg transition-colors relative ${
                activeView === 'notifications'
                  ? 'bg-teal-100 text-teal-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            <i className="ri-download-line mr-2"></i>
            Exporter
          </button>
        </div>
      </div>

      {activeView === 'notifications' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Notifications de réservations</h3>
            <div className="flex space-x-3">
              <button
                onClick={fetchNotifications}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                <i className="ri-refresh-line mr-1"></i>
                Actualiser
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  <i className="ri-check-double-line mr-1"></i>
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${
                    notification.read ? 'border-gray-200 bg-white' : 'border-teal-200 bg-teal-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <i className="ri-calendar-check-line text-teal-500"></i>
                        <h4 className="font-medium text-gray-900">{notification.title}</h4>
                        {!notification.read && (
                          <span className="bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{notification.message}</p>
                      
                      {notification.bookings && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 font-medium">Détails de la réservation:</p>
                          <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <span><strong>Service:</strong> {notification.bookings.services?.title || 'N/A'}</span>
                            <span><strong>Client:</strong> {notification.bookings.profiles?.full_name || 'N/A'}</span>
                            <span><strong>Professionnel:</strong> {notification.bookings.professional_profile?.full_name || 'N/A'}</span>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 border border-teal-200 rounded-lg"
                        >
                          Marquer comme lu
                        </button>
                      )}
                      {notification.booking_id && (
                        <button
                          onClick={() => {
                            setActiveView('bookings');
                          }}
                          className="text-xs text-gray-600 hover:text-gray-700 font-medium px-2 py-1 border border-gray-200 rounded-lg"
                        >
                          Voir détails
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <i className="ri-notification-line text-4xl text-gray-300 mb-4"></i>
                <p className="text-gray-500">Aucune notification de réservation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Vous recevrez des notifications ici quand de nouvelles réservations seront effectuées
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'bookings' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechercher
                </label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Client, professionnel, service..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">Tous</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchBookings}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <i className="ri-refresh-line mr-2"></i>
                  Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Réservation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Professionnel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Heure
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.services?.title || 'Service non spécifié'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {booking.id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.profiles?.full_name || 'Client inconnu'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.profiles?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {booking.professional_profile?.full_name || 'Professionnel inconnu'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.professional_profile?.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(getBookingDate(booking))}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getBookingTime(booking)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(getBookingAmount(booking))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {booking.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {booking.status === 'confirmed' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'in_progress')}
                                className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                Démarrer
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                              >
                                Annuler
                              </button>
                            </>
                          )}
                          {booking.status === 'in_progress' && (
                            <button
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              Terminer
                            </button>
                          )}
                          {(booking.status === 'completed' || booking.status === 'cancelled') && (
                            <span className="text-sm text-gray-500">Aucune action</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>

          {/* Modal de détails */}
          {showDetailsModal && selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détails de la réservation
                  </h3>
                  <button
                    onClick={closeDetailsModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <i className="ri-close-line text-2xl"></i>
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Informations générales */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-information-line text-blue-600 mr-2"></i>
                      Informations générales
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">ID de réservation</p>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.id.slice(0, 8)}...</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date de création</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedBooking.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Date de réservation</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(getBookingDate(selectedBooking))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Heure</p>
                        <p className="text-sm font-medium text-gray-900">{getBookingTime(selectedBooking)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Statut</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusLabel(selectedBooking.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Paiement</p>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedBooking.payment_status)}`}>
                          {selectedBooking.payment_status === 'paid' && 'Payé'}
                          {selectedBooking.payment_status === 'pending' && 'En attente'}
                          {selectedBooking.payment_status === 'refunded' && 'Remboursé'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informations client */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-user-line text-orange-600 mr-2"></i>
                      Client
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center">
                        <i className="ri-user-3-line text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedBooking.profiles?.full_name || 'Non renseigné'}
                        </span>
                      </div>
                      {selectedBooking.profiles?.phone && (
                        <div className="flex items-center">
                          <i className="ri-phone-line text-gray-400 mr-2"></i>
                          <span className="text-sm text-gray-600">
                            {selectedBooking.profiles.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations professionnel */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-briefcase-line text-green-600 mr-2"></i>
                      Professionnel
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center">
                        <i className="ri-user-star-line text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedBooking.professional_profile?.full_name || 'Non renseigné'}
                        </span>
                      </div>
                      {selectedBooking.professional_profile?.phone && (
                        <div className="flex items-center">
                          <i className="ri-phone-line text-gray-400 mr-2"></i>
                          <span className="text-sm text-gray-600">
                            {selectedBooking.professional_profile.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informations service */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-service-line text-purple-600 mr-2"></i>
                      Service
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center">
                        <i className="ri-tools-line text-gray-400 mr-2"></i>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedBooking.services?.title || 'Non renseigné'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prix */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <i className="ri-money-dollar-circle-line text-green-600 mr-2"></i>
                      Montant
                    </h4>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-700">
                        {formatPrice(getBookingAmount(selectedBooking))}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedBooking.notes && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i className="ri-file-text-line text-gray-600 mr-2"></i>
                        Notes
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedBooking.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
                  <button
                    onClick={closeDetailsModal}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
