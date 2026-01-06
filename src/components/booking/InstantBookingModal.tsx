import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../base/LoadingSpinner';

interface NearbyDriver {
  id: string;
  full_name: string;
  business_name?: string;
  avatar_url?: string;
  rating: number;
  total_reviews: number;
  hourly_rate: number;
  distance: number;
  latitude: number;
  longitude: number;
  is_verified: boolean;
  phone?: string;
  service_category: string;
}

interface InstantBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLatitude: number;
  userLongitude: number;
  serviceType?: string;
  onDriverSelected: (driver: NearbyDriver) => void;
}

export default function InstantBookingModal({
  isOpen,
  onClose,
  userLatitude,
  userLongitude,
  serviceType = 'Chauffeur',
  onDriverSelected
}: InstantBookingModalProps) {
  const [searchingDrivers, setSearchingDrivers] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<NearbyDriver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<NearbyDriver | null>(null);
  const [searchRadius, setSearchRadius] = useState(5);

  useEffect(() => {
    if (isOpen) {
      searchNearbyDrivers();
    } else {
      setSearchingDrivers(false);
      setNearbyDrivers([]);
      setSelectedDriver(null);
      setSearchRadius(5);
    }
  }, [isOpen, userLatitude, userLongitude]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const searchNearbyDrivers = async () => {
    try {
      setSearchingDrivers(true);

      const { data: drivers, error } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!inner (
            full_name,
            avatar_url
          )
        `)
        .or('service_category.ilike.%chauffeur%,sub_category.ilike.%chauffeur%')
        .eq('is_active', true)
        .eq('is_available', true);

      if (error) throw error;

      const driversWithDistance = (drivers || [])
        .map(driver => {
          const distance = calculateDistance(
            userLatitude,
            userLongitude,
            driver.latitude || 11.8251,
            driver.longitude || 42.5903
          );

          return {
            id: driver.id,
            full_name: driver.profiles?.full_name || driver.business_name || 'Chauffeur',
            business_name: driver.business_name,
            avatar_url: driver.profiles?.avatar_url || driver.avatar_url,
            rating: driver.rating || 0,
            total_reviews: driver.total_reviews || 0,
            hourly_rate: driver.hourly_rate || 0,
            distance: parseFloat(distance.toFixed(1)),
            latitude: driver.latitude || 11.8251,
            longitude: driver.longitude || 42.5903,
            is_verified: driver.is_verified || false,
            phone: driver.phone,
            service_category: driver.service_category || 'Chauffeur'
          };
        })
        .filter(driver => driver.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance);

      setNearbyDrivers(driversWithDistance);

      if (driversWithDistance.length === 0 && searchRadius < 20) {
        setSearchRadius(prev => prev + 5);
        setTimeout(() => searchNearbyDrivers(), 1000);
      }

    } catch (error) {
      console.error('Error searching nearby drivers:', error);
    } finally {
      setSearchingDrivers(false);
    }
  };

  const getWhatsAppLink = (driver: NearbyDriver) => {
    const message = `🚗 *Nouvelle course disponible !*\n\n📍 Distance : ${driver.distance} km\n👤 Client demande une course\n\nÊtes-vous disponible ?`;
    const phone = driver.phone?.replace(/[^0-9]/g, '') || '';
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleSelectDriver = (driver: NearbyDriver) => {
    setSelectedDriver(driver);
    onDriverSelected(driver);
  };

  const getAvatarUrl = (driver: NearbyDriver) => {
    if (driver.avatar_url && driver.avatar_url.trim() !== '') {
      return driver.avatar_url;
    }
    const initials = driver.business_name?.substring(0, 2).toUpperCase() || 'CH';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=0d9488&color=fff&bold=true&length=2`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Réservation Instantanée</h2>
              <p className="text-teal-100">Trouvez un chauffeur près de vous</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Searching State */}
          {searchingDrivers && (
            <div className="text-center py-12">
              <LoadingSpinner size="large" />
              <p className="text-lg text-gray-600 mt-4">
                Recherche de chauffeurs disponibles dans un rayon de {searchRadius}km...
              </p>
            </div>
          )}

          {/* No Drivers Found */}
          {!searchingDrivers && nearbyDrivers.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-car-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun chauffeur disponible
              </h3>
              <p className="text-gray-600 mb-6">
                Aucun chauffeur n'est disponible dans un rayon de {searchRadius}km pour le moment.
              </p>
              <button
                onClick={() => {
                  setSearchRadius(20);
                  searchNearbyDrivers();
                }}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
              >
                Élargir la recherche à 20km
              </button>
            </div>
          )}

          {/* Available Drivers List */}
          {!searchingDrivers && nearbyDrivers.length > 0 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {nearbyDrivers.length} chauffeur{nearbyDrivers.length > 1 ? 's' : ''} disponible{nearbyDrivers.length > 1 ? 's' : ''} près de vous
                </h3>
                <p className="text-sm text-gray-600">
                  Contactez directement un chauffeur via WhatsApp
                </p>
              </div>

              <div className="space-y-4">
                {nearbyDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal-200">
                          <img
                            src={getAvatarUrl(driver)}
                            alt={driver.full_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {driver.is_verified && (
                          <div className="absolute -top-1 -right-1 bg-teal-500 text-white rounded-full p-1">
                            <i className="ri-checkbox-circle-fill text-xs"></i>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {driver.full_name}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <i className="ri-star-fill text-yellow-400 text-xs"></i>
                            <span className="font-medium">{driver.rating}</span>
                            <span className="text-gray-400">({driver.total_reviews})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <i className="ri-map-pin-line text-teal-500"></i>
                            <span className="font-medium">{driver.distance} km</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-bold text-teal-600">
                            {driver.hourly_rate} DJF/h
                          </span>
                          <a
                            href={getWhatsAppLink(driver)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleSelectDriver(driver)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                          >
                            <i className="ri-whatsapp-line text-lg"></i>
                            Contacter
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* WhatsApp Info */}
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <i className="ri-whatsapp-line text-green-600 text-2xl mt-0.5"></i>
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      Contact direct par WhatsApp
                    </h4>
                    <p className="text-sm text-green-700">
                      Cliquez sur "Contacter" pour ouvrir WhatsApp avec un message pré-rempli. 
                      Le chauffeur recevra votre demande instantanément et pourra vous répondre directement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
