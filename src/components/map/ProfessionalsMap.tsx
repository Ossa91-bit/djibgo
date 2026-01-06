import { useEffect, useRef, useState } from 'react';
import LoadingSpinner from '../base/LoadingSpinner';

interface Professional {
  id: string;
  full_name: string;
  business_name: string;
  service_category: string;
  latitude: number;
  longitude: number;
  avatar_url?: string;
  rating?: number;
  hourly_rate?: number;
  is_verified?: boolean;
  distance?: number;
  is_active?: boolean;
}

interface ProfessionalsMapProps {
  professionals: Professional[];
  userLocation?: { latitude: number; longitude: number };
  onProfessionalClick?: (professional: Professional) => void;
  height?: string;
  showFilters?: boolean;
  selectedCategory?: string;
  onCategoryFilter?: (category: string) => void;
}

export default function ProfessionalsMap({
  professionals,
  userLocation,
  onProfessionalClick,
  height = '500px',
  showFilters = true,
  selectedCategory = '',
  onCategoryFilter
}: ProfessionalsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState(selectedCategory);
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available'>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Catégories disponibles
  const categories = Array.from(new Set(professionals.map(p => p.service_category).filter(Boolean)));

  // Charger Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setLoading(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setLoading(false);
      script.onerror = () => {
        setError('Erreur lors du chargement de Google Maps');
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialiser la carte
  useEffect(() => {
    if (!mapRef.current || loading || !window.google) return;

    try {
      const defaultCenter = { lat: 11.8251, lng: 42.5903 };
      const center = userLocation
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : defaultCenter;

      const newMap = new google.maps.Map(mapRef.current, {
        center,
        zoom: userLocation ? 13 : 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      });

      setMap(newMap);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la carte:', err);
      setError('Impossible d\'initialiser la carte');
    }
  }, [loading, userLocation]);

  // Filtrer les professionnels
  const filteredProfessionals = professionals.filter(prof => {
    if (filterCategory && prof.service_category !== filterCategory) return false;
    if (filterAvailability === 'available' && !prof.is_active) return false;
    if (filterRating > 0 && (prof.rating || 0) < filterRating) return false;
    return true;
  });

  // Ajouter les marqueurs avec mise à jour en temps réel
  useEffect(() => {
    if (!map || !window.google) return;

    // Supprimer les anciens marqueurs
    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const bounds = new google.maps.LatLngBounds();

    // Marqueur de l'utilisateur
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3
        },
        title: 'Votre position',
        zIndex: 1000,
        animation: google.maps.Animation.DROP
      });

      const userInfoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px;">
              <i class="ri-map-pin-user-fill" style="color: #3B82F6;"></i>
              Votre position
            </div>
          </div>
        `
      });

      userMarker.addListener('click', () => {
        userInfoWindow.open(map, userMarker);
      });

      newMarkers.push(userMarker);
      bounds.extend(userMarker.getPosition()!);
    }

    // Marqueurs des professionnels filtrés
    filteredProfessionals.forEach(professional => {
      if (!professional.latitude || !professional.longitude) return;

      const position = { lat: professional.latitude, lng: professional.longitude };

      // Icône personnalisée selon la catégorie et disponibilité
      let iconColor = '#14B8A6';
      if (professional.service_category?.toLowerCase().includes('chauffeur')) {
        iconColor = '#F59E0B';
      } else if (professional.service_category?.toLowerCase().includes('technicien')) {
        iconColor = '#8B5CF6';
      }

      // Opacité réduite si indisponible
      const fillOpacity = professional.is_active ? 0.9 : 0.4;

      const marker = new google.maps.Marker({
        position,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: professional.is_active ? 10 : 8,
          fillColor: iconColor,
          fillOpacity,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        },
        title: professional.full_name || professional.business_name,
        animation: google.maps.Animation.DROP
      });

      // InfoWindow enrichie
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 280px;">
            <div style="display: flex; align-items: start; gap: 12px;">
              <img 
                src="${professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.business_name?.substring(0, 2) || 'PR')}&size=60&background=14b8a6&color=fff&bold=true`}"
                alt="${professional.full_name}"
                style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;"
              />
              <div style="flex: 1;">
                <div style="font-weight: 600; color: #1F2937; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  ${professional.full_name || professional.business_name}
                  ${professional.is_verified ? '<i class="ri-verified-badge-fill" style="color: #14B8A6; font-size: 14px;"></i>' : ''}
                </div>
                <div style="color: #14B8A6; font-size: 13px; margin-bottom: 6px;">
                  ${professional.service_category}
                </div>
                ${professional.rating ? `
                  <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                    <i class="ri-star-fill" style="color: #F59E0B; font-size: 12px;"></i>
                    <span style="font-size: 13px; color: #6B7280;">${professional.rating.toFixed(1)}</span>
                  </div>
                ` : ''}
                ${professional.hourly_rate ? `
                  <div style="font-weight: 600; color: #14B8A6; font-size: 15px;">
                    ${professional.hourly_rate} DJF/h
                  </div>
                ` : ''}
                ${professional.distance !== undefined ? `
                  <div style="color: #6B7280; font-size: 12px; margin-top: 4px;">
                    <i class="ri-map-pin-distance-line"></i>
                    À ${professional.distance.toFixed(1)} km
                  </div>
                ` : ''}
                <div style="margin-top: 6px;">
                  <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; ${
                    professional.is_active 
                      ? 'background: #D1FAE5; color: #065F46;' 
                      : 'background: #FEE2E2; color: #991B1B;'
                  }">
                    ${professional.is_active ? '● Disponible' : '● Indisponible'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onclick="window.handleProfessionalMapClick('${professional.id}')"
              style="
                width: 100%;
                margin-top: 12px;
                padding: 8px 16px;
                background: #14B8A6;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                font-size: 13px;
              "
            >
              Voir le profil
            </button>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Fermer toutes les autres InfoWindows
        newMarkers.forEach(m => {
          const iw = (m as any).infoWindow;
          if (iw) iw.close();
        });
        
        infoWindow.open(map, marker);
        map.panTo(position);
      });

      (marker as any).infoWindow = infoWindow;
      newMarkers.push(marker);
      bounds.extend(position);
    });

    setMarkers(newMarkers);

    // Ajuster la vue pour afficher tous les marqueurs
    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, filteredProfessionals, userLocation]);

  // Auto-refresh en temps réel
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        // Trigger re-render pour mettre à jour les positions
        setMarkers(prev => [...prev]);
      }, 10000); // Rafraîchir toutes les 10 secondes
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh]);

  // Gestionnaire de clic global
  useEffect(() => {
    (window as any).handleProfessionalMapClick = (professionalId: string) => {
      const professional = professionals.find(p => p.id === professionalId);
      if (professional && onProfessionalClick) {
        onProfessionalClick(professional);
      }
    };

    return () => {
      delete (window as any).handleProfessionalMapClick;
    };
  }, [professionals, onProfessionalClick]);

  const handleCategoryChange = (category: string) => {
    setFilterCategory(category);
    if (onCategoryFilter) {
      onCategoryFilter(category);
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="text-gray-600 mt-4">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg"
        style={{ height }}
      >
        <div className="text-center p-6">
          <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg border border-gray-200">
      {/* Filtres avancés */}
      {showFilters && (
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <i className="ri-filter-3-line mr-2 text-teal-600"></i>
            Filtres en temps réel
          </h3>
          
          {/* Filtre par catégorie */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtre par disponibilité */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Disponibilité</label>
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value as 'all' | 'available')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Tous</option>
              <option value="available">Disponibles uniquement</option>
            </select>
          </div>

          {/* Filtre par note */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Note minimum</label>
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="0">Toutes les notes</option>
              <option value="4.5">4.5+ étoiles</option>
              <option value="4">4+ étoiles</option>
              <option value="3.5">3.5+ étoiles</option>
            </select>
          </div>

          {/* Auto-refresh toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <span className="text-xs text-gray-700">Mise à jour auto</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? 'bg-teal-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-500 flex items-center">
            <i className="ri-information-line mr-1"></i>
            {filteredProfessionals.length} professionnel{filteredProfessionals.length !== 1 ? 's' : ''} affiché{filteredProfessionals.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div ref={mapRef} style={{ height }} />
      
      {/* Légende améliorée */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold text-gray-900 mb-2">Légende</div>
        {userLocation && (
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
            <span className="text-gray-700">Votre position</span>
          </div>
        )}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-teal-500 border-2 border-white"></div>
          <span className="text-gray-700">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-500 opacity-40 border-2 border-white"></div>
          <span className="text-gray-700">Indisponible</span>
        </div>
      </div>

      {/* Compteur amélioré */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-2">
          <i className="ri-map-pin-line text-teal-600"></i>
          <span className="font-semibold text-gray-900">
            {filteredProfessionals.filter(p => p.latitude && p.longitude).length} professionnel{filteredProfessionals.filter(p => p.latitude && p.longitude).length !== 1 ? 's' : ''}
          </span>
        </div>
        {autoRefresh && (
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Temps réel</span>
          </div>
        )}
      </div>
    </div>
  );
}
