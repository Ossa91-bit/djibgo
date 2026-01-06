
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../base/LoadingSpinner';

interface LocationManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated: () => void;
}

export default function LocationManagementModal({
  isOpen,
  onClose,
  onLocationUpdated
}: LocationManagementModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // États pour les localisations depuis la base de données
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [serviceZones, setServiceZones] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    location: '',
    district: '',
    latitude: '',
    longitude: '',
    service_zones: [] as string[]
  });

  useEffect(() => {
    if (isOpen && user) {
      loadLocations();
      loadCurrentLocation();
    }
  }, [isOpen, user]);

  // Charger les localisations depuis la base de données
  const loadLocations = async () => {
    try {
      setLoadingLocations(true);
      
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('id, name, type, parent_id')
        .order('name');

      if (fetchError) throw fetchError;

      setLocations(data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des localisations:', err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('professional_profiles')
        .select('location, district, latitude, longitude, service_zones')
        .eq('id', user?.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setFormData({
          location: data.location || '',
          district: data.district || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          service_zones: data.service_zones || []
        });
        setServiceZones(data.service_zones || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement de la localisation:', err);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }));

        // Utiliser l'API de géocodage inversé pour obtenir le nom de la localisation
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=fr`
          );
          const data = await response.json();
          
          if (data.address) {
            const locationName = data.address.city || 
                                data.address.town || 
                                data.address.village || 
                                data.address.suburb ||
                                'Djibouti-Ville';
            
            setFormData(prev => ({
              ...prev,
              location: locationName
            }));
          }
        } catch (err) {
          console.error('Erreur lors du géocodage inversé:', err);
        }

        setDetecting(false);
      },
      (error) => {
        let errorMessage = 'Erreur lors de la détection de votre position';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Veuillez vérifier que les services de localisation sont activés.';
            break;
          case error.TIMEOUT:
            errorMessage = 'La recherche de votre position a pris trop de temps. Veuillez réessayer.';
            break;
        }
        setError(errorMessage);
        setDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Gérer l'ajout/suppression de zones de service
  const toggleServiceZone = (locationName: string) => {
    setServiceZones(prev => {
      if (prev.includes(locationName)) {
        return prev.filter(z => z !== locationName);
      } else {
        return [...prev, locationName];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.location.trim()) {
      setError('Veuillez sélectionner une localisation principale');
      return;
    }

    if (serviceZones.length === 0) {
      setError('Veuillez sélectionner au moins une zone de service');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const updateData: any = {
        location: formData.location.trim(),
        district: formData.district.trim() || null,
        service_zones: serviceZones
      };

      // Ajouter les coordonnées GPS si elles sont fournies
      if (formData.latitude && formData.longitude) {
        updateData.latitude = parseFloat(formData.latitude);
        updateData.longitude = parseFloat(formData.longitude);
      }

      const { error: updateError } = await supabase
        .from('professional_profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setSuccess(true);
      onLocationUpdated();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour:', err);
      setError(err.message || 'Erreur lors de la mise à jour de la localisation');
    } finally {
      setLoading(false);
    }
  };

  // Obtenir les villes depuis les localisations
  const villes = locations.filter(loc => loc.type === 'ville');
  
  // Obtenir les quartiers de la ville sélectionnée
  const quartiers = formData.location 
    ? locations.filter(loc => {
        const ville = locations.find(v => v.name === formData.location && v.type === 'ville');
        return loc.type === 'quartier' && loc.parent_id === ville?.id;
      })
    : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <i className="ri-map-pin-line text-teal-600"></i>
              Gérer ma zone de service
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <i className="ri-error-warning-line"></i>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <i className="ri-checkbox-circle-line"></i>
                <span className="text-sm">Zone de service mise à jour avec succès !</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bouton de détection automatique */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <i className="ri-map-pin-user-line text-teal-600 text-xl mt-0.5"></i>
                <div className="flex-1">
                  <h3 className="font-medium text-teal-900 mb-1">
                    Détection automatique
                  </h3>
                  <p className="text-sm text-teal-700 mb-3">
                    Utilisez votre position actuelle pour une localisation précise
                  </p>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                  >
                    {detecting ? (
                      <>
                        <LoadingSpinner size="sm" color="text-white" />
                        <span>Détection en cours...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-focus-3-line"></i>
                        <span>Détecter ma position</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Localisation principale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation principale (Ville) <span className="text-red-500">*</span>
              </label>
              {loadingLocations ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value, district: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                >
                  <option value="">Sélectionnez une ville</option>
                  {villes.map(ville => (
                    <option key={ville.id} value={ville.name}>{ville.name}</option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Votre localisation principale visible par les clients
              </p>
            </div>

            {/* Quartier */}
            {formData.location && quartiers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartier (optionnel)
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Sélectionnez un quartier</option>
                  {quartiers.map(quartier => (
                    <option key={quartier.id} value={quartier.name}>{quartier.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  <i className="ri-information-line mr-1"></i>
                  Permet aux clients de vous trouver plus précisément
                </p>
              </div>
            )}

            {/* Zones de service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zones de service <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Sélectionnez les villes et quartiers où vous proposez vos services
              </p>
              
              {loadingLocations ? (
                <div className="flex items-center justify-center py-4">
                  <LoadingSpinner size="sm" />
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {villes.map(ville => {
                    const villeQuartiers = locations.filter(loc => loc.type === 'quartier' && loc.parent_id === ville.id);
                    
                    return (
                      <div key={ville.id} className="mb-4 last:mb-0">
                        {/* Ville */}
                        <label className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={serviceZones.includes(ville.name)}
                            onChange={() => toggleServiceZone(ville.name)}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="font-medium text-gray-900">{ville.name}</span>
                        </label>
                        
                        {/* Quartiers de cette ville */}
                        {villeQuartiers.length > 0 && (
                          <div className="ml-6 mt-2 space-y-1">
                            {villeQuartiers.map(quartier => (
                              <label key={quartier.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={serviceZones.includes(quartier.name)}
                                  onChange={() => toggleServiceZone(quartier.name)}
                                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">{quartier.name}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {serviceZones.length > 0 && (
                <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800 font-medium mb-2">
                    <i className="ri-checkbox-circle-line mr-1"></i>
                    Zones sélectionnées ({serviceZones.length}) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {serviceZones.map(zone => (
                      <span key={zone} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs">
                        {zone}
                        <button
                          type="button"
                          onClick={() => toggleServiceZone(zone)}
                          className="hover:text-teal-900"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Coordonnées GPS (optionnel) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="11.8251"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="42.5903"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            {formData.latitude && formData.longitude && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <i className="ri-information-line text-blue-600 mt-0.5"></i>
                  <p className="text-sm text-blue-700">
                    Les coordonnées GPS permettent aux clients de vous trouver par distance et d'afficher votre position exacte sur la carte.
                  </p>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || loadingLocations}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="text-white" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line"></i>
                    <span>Enregistrer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
