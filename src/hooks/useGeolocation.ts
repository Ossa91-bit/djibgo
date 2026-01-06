import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export default function useGeolocation(options: GeolocationOptions = {}) {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false
  });

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur',
        loading: false
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    const defaultOptions = {
      enableHighAccuracy: false, // Changé à false pour une réponse plus rapide
      timeout: 30000, // Augmenté à 30 secondes
      maximumAge: 0, // Changé à 0 pour forcer une nouvelle position
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé. Veuillez autoriser l\'accès à votre position dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Veuillez vérifier que les services de localisation sont activés.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La recherche de votre position a pris trop de temps. Veuillez réessayer.';
            break;
        }
        setLocation(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }));
      },
      defaultOptions
    );
  };

  // Calculer la distance entre deux points géographiques
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return {
    ...location,
    getLocation,
    calculateDistance
  };
}
