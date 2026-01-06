import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface RideHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RideHistoryModal({ isOpen, onClose }: RideHistoryModalProps) {
  const { user } = useAuth();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (isOpen && user) {
      fetchRideHistory();
    }
  }, [isOpen, user, filter]);

  const fetchRideHistory = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          services (
            title,
            category
          ),
          profiles!bookings_professional_id_fkey (
            full_name,
            phone,
            avatar_url
          ),
          professional_profiles!inner (
            rating
          ),
          reviews (
            rating,
            comment,
            created_at
          )
        `)
        .eq('client_id', user?.id)
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_date', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setRides(data);
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'completed') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          Terminé
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
        Annulé
      </span>
    );
  };

  const calculateStats = () => {
    const completed = rides.filter(r => r.status === 'completed');
    const totalSpent = completed.reduce((sum, r) => sum + parseFloat(r.total_amount), 0);
    const totalRides = completed.length;
    const totalDistance = completed.reduce((sum, r) => sum + (r.distance_km || 0), 0);

    return { totalSpent, totalRides, totalDistance };
  };

  if (!isOpen) return null;

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Historique des Courses</h2>
              <p className="text-sm text-gray-600 mt-1">Toutes vos courses passées</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total dépensé</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalSpent.toLocaleString()} FDJ</p>
                </div>
                <i className="ri-money-dollar-circle-line text-3xl opacity-80"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Courses terminées</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalRides}</p>
                </div>
                <i className="ri-taxi-line text-3xl opacity-80"></i>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Distance totale</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalDistance.toFixed(1)} km</p>
                </div>
                <i className="ri-map-pin-line text-3xl opacity-80"></i>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Terminées
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Annulées
            </button>
          </div>

          {/* Liste des courses */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-teal-500"></i>
            </div>
          ) : rides.length > 0 ? (
            <div className="space-y-4">
              {rides.map((ride) => (
                <div key={ride.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      {ride.profiles?.avatar_url ? (
                        <img
                          src={ride.profiles.avatar_url}
                          alt={ride.profiles.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                          <i className="ri-user-line text-teal-600"></i>
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{ride.services?.title}</h4>
                        <p className="text-sm text-gray-600">Avec {ride.profiles?.full_name}</p>
                        <div className="flex items-center mt-1">
                          {ride.professional_profiles?.[0]?.rating && (
                            <>
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`ri-star-${
                                    i < Math.floor(ride.professional_profiles[0].rating) ? 'fill' : 'line'
                                  } text-yellow-400 text-xs`}
                                ></i>
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                ({ride.professional_profiles[0].rating})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ride.status)}
                      <p className="text-lg font-bold text-gray-900 mt-2">
                        {parseFloat(ride.total_amount).toLocaleString()} FDJ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(ride.scheduled_date)}
                      </p>
                    </div>

                    {ride.distance_km && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 mb-1">Distance</p>
                        <p className="text-sm font-medium text-gray-900">
                          {ride.distance_km} km
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex items-start">
                      <i className="ri-map-pin-line text-gray-500 mr-2 mt-0.5"></i>
                      <p className="text-sm text-gray-700">{ride.address}</p>
                    </div>
                  </div>

                  {ride.reviews && ride.reviews.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`ri-star-${
                                i < ride.reviews[0].rating ? 'fill' : 'line'
                              } text-yellow-400 text-sm`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600 ml-2">
                          Votre avis
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{ride.reviews[0].comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="ri-history-line text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Aucune course dans l'historique</p>
              <p className="text-sm text-gray-400 mt-2">
                Vos courses terminées apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
