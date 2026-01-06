import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';

interface LiveTrackingMapProps {
  bookingId: string;
  driverId: string;
  clientLocation?: { lat: number; lng: number };
  onClose: () => void;
}

export default function LiveTrackingMap({ bookingId, driverId, clientLocation, onClose }: LiveTrackingMapProps) {
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [driverMarker, setDriverMarker] = useState<google.maps.Marker | null>(null);
  const [clientMarker, setClientMarker] = useState<google.maps.Marker | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.Polyline | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchDriverLocation();
    initializeMap();
    
    // S'abonner aux mises à jour de localisation en temps réel
    const channel = supabase
      .channel(`driver-location-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${driverId}`
        },
        (payload) => {
          if (payload.new) {
            setDriverLocation(payload.new);
            setLastUpdate(new Date());
            calculateETA(payload.new);
            updateMapMarkers(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [driverId, bookingId]);

  const initializeMap = async () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = { lat: 11.8251, lng: 42.5903 };
    const center = clientLocation || defaultCenter;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    setMap(newMap);

    // Ajouter le marqueur du client
    if (clientLocation) {
      const clientMark = new google.maps.Marker({
        position: clientLocation,
        map: newMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        title: 'Votre position'
      });
      setClientMarker(clientMark);
    }
  };

  const updateMapMarkers = (location: any) => {
    if (!map || !window.google) return;

    const driverPos = { lat: location.latitude, lng: location.longitude };

    // Mettre à jour ou créer le marqueur du chauffeur
    if (driverMarker) {
      driverMarker.setPosition(driverPos);
    } else {
      const newDriverMarker = new google.maps.Marker({
        position: driverPos,
        map,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#14B8A6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          rotation: location.heading || 0
        },
        title: 'Chauffeur'
      });
      setDriverMarker(newDriverMarker);
    }

    // Tracer l'itinéraire si la position du client est disponible
    if (clientLocation) {
      drawRoute(driverPos, clientLocation);
    }

    // Ajuster la vue pour afficher les deux marqueurs
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverPos);
    if (clientLocation) {
      bounds.extend(clientLocation);
    }
    map.fitBounds(bounds);
  };

  const drawRoute = (start: { lat: number; lng: number }, end: { lat: number; lng: number }) => {
    if (!map || !window.google) return;

    // Supprimer l'ancien tracé
    if (routePath) {
      routePath.setMap(null);
    }

    // Créer un nouveau tracé
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === 'OK' && result) {
          const newPath = new google.maps.Polyline({
            path: result.routes[0].overview_path,
            geodesic: true,
            strokeColor: '#14B8A6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map
          });
          setRoutePath(newPath);

          // Calculer la distance et l'ETA à partir de l'itinéraire
          const route = result.routes[0];
          if (route.legs[0]) {
            const distanceInKm = route.legs[0].distance?.value ? route.legs[0].distance.value / 1000 : null;
            const durationInMin = route.legs[0].duration?.value ? Math.round(route.legs[0].duration.value / 60) : null;
            
            if (distanceInKm) setDistance(distanceInKm);
            if (durationInMin) setEta(durationInMin);
          }
        }
      }
    );
  };

  const fetchDriverLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setDriverLocation(data);
        calculateETA(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la localisation:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateETA = (location: any) => {
    if (!clientLocation || !location) return;

    // Calcul de distance (formule de Haversine)
    const R = 6371; // Rayon de la Terre en km
    const dLat = (clientLocation.lat - location.latitude) * Math.PI / 180;
    const dLon = (clientLocation.lng - location.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location.latitude * Math.PI / 180) * Math.cos(clientLocation.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceCalc = R * c;

    setDistance(distanceCalc);

    // Estimation du temps (vitesse moyenne 40 km/h en ville)
    const estimatedMinutes = Math.round((distanceCalc / 40) * 60);
    setEta(estimatedMinutes);
  };

  const getTimeSinceUpdate = () => {
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}min`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Suivi GPS en Temps Réel</h2>
              <p className="text-sm text-gray-600 mt-1">Suivez la position de votre chauffeur en direct</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-teal-500"></i>
            </div>
          ) : driverLocation ? (
            <>
              {/* Informations ETA */}
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Temps d'arrivée estimé</p>
                    <p className="text-4xl font-bold mt-1">
                      {eta !== null ? `${eta} min` : 'Calcul...'}
                    </p>
                    {distance !== null && (
                      <p className="text-sm opacity-90 mt-2">
                        Distance: {distance.toFixed(1)} km
                      </p>
                    )}
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <i className="ri-taxi-line text-3xl"></i>
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-4 text-sm">
                  {driverLocation.speed && (
                    <div className="flex items-center">
                      <i className="ri-speed-line mr-2"></i>
                      <span>{driverLocation.speed.toFixed(0)} km/h</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    <span>En route</span>
                  </div>
                  <div className="flex items-center">
                    <i className="ri-time-line mr-2"></i>
                    <span>Mis à jour il y a {getTimeSinceUpdate()}</span>
                  </div>
                </div>
              </div>

              {/* Carte interactive */}
              <div className="bg-gray-100 rounded-xl overflow-hidden mb-6 relative" style={{ height: '500px' }}>
                <div ref={mapRef} className="w-full h-full"></div>
                
                {/* Overlay avec informations */}
                <div className="absolute top-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-900">Chauffeur en ligne</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                    </span>
                  </div>
                </div>

                {/* Légende */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                  <div className="font-semibold text-gray-900 mb-2">Légende</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full bg-teal-500 border-2 border-white"></div>
                    <span className="text-gray-700">Chauffeur</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span className="text-gray-700">Votre position</span>
                  </div>
                </div>
              </div>

              {/* Détails de localisation */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="ri-map-pin-line text-teal-500"></i>
                    <span className="text-sm font-medium text-gray-700">Position du chauffeur</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Lat: {driverLocation.latitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Lng: {driverLocation.longitude.toFixed(6)}
                  </p>
                  {driverLocation.accuracy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Précision: ±{driverLocation.accuracy.toFixed(0)}m
                    </p>
                  )}
                </div>

                {clientLocation && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <i className="ri-map-pin-user-line text-blue-500"></i>
                      <span className="text-sm font-medium text-gray-700">Votre position</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Lat: {clientLocation.lat.toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-600">
                      Lng: {clientLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${clientLocation?.lat || 11.5721},${clientLocation?.lng || 43.1456}`;
                    window.open(url, '_blank');
                  }}
                  className="flex-1 bg-teal-500 text-white py-3 px-4 rounded-lg hover:bg-teal-600 transition-colors font-medium flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-map-line"></i>
                  <span>Ouvrir dans Google Maps</span>
                </button>
                <button
                  onClick={fetchDriverLocation}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-refresh-line text-xl"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <i className="ri-map-pin-line text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">Position du chauffeur non disponible</p>
              <p className="text-sm text-gray-400 mt-2">
                Le chauffeur n'a pas encore activé le partage de localisation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
