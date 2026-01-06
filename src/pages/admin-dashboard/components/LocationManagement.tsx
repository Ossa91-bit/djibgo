import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import Pagination from '../../../components/base/Pagination';
import { usePagination } from '../../../hooks/usePagination';
import { cacheService, CACHE_KEYS, CACHE_DURATION } from '../../../utils/cacheService';

interface Location {
  id: string;
  name: string;
  type: 'ville' | 'quartier' | 'region';
  parent_id?: string;
  parent_name?: string;
  created_at: string;
  updated_at: string;
}

export default function LocationManagement() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ville' | 'quartier' | 'region'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'ville' as 'ville' | 'quartier' | 'region',
    parent_id: ''
  });

  // Optimisation: Mémorisation des statistiques
  const stats = useMemo(() => ({
    total: locations.length,
    villes: locations.filter(l => l.type === 'ville').length,
    quartiers: locations.filter(l => l.type === 'quartier').length,
    regions: locations.filter(l => l.type === 'region').length
  }), [locations]);

  // Optimisation: Mémorisation des localisations parentes
  const parentLocations = useMemo(() => 
    locations.filter(loc => loc.type === 'ville'),
    [locations]
  );

  // Optimisation: Mémorisation des localisations filtrées
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (location.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesType = filterType === 'all' || location.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [locations, searchTerm, filterType]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    startIndex,
    endIndex
  } = usePagination(filteredLocations, { itemsPerPage: 10 });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      // Optimisation: Essayer de charger depuis le cache d'abord
      const cachedData = await cacheService.get<Location[]>(CACHE_KEYS.LOCATIONS);
      
      if (cachedData) {
        setLocations(cachedData);
        setLoading(false);
        return;
      }

      // Optimisation: Sélection de colonnes spécifiques
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, type, parent_id, created_at, updated_at')
        .order('type')
        .order('name');

      if (error) throw error;

      // Optimisation: Utiliser un Map pour accès rapide aux parents
      const locationMap = new Map(data?.map(loc => [loc.id, loc]) || []);
      
      const locationsWithParent = (data || []).map(loc => ({
        ...loc,
        parent_name: loc.parent_id ? locationMap.get(loc.parent_id)?.name : undefined
      }));

      setLocations(locationsWithParent);
      
      // Mettre en cache les données
      await cacheService.set(CACHE_KEYS.LOCATIONS, locationsWithParent, CACHE_DURATION.MEDIUM);
    } catch (error) {
      console.error('Erreur lors du chargement des localisations:', error);
      alert('Erreur lors du chargement des localisations');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      type: 'ville',
      parent_id: ''
    });
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setShowAddModal(true);
  }, [resetForm]);

  const openEditModal = useCallback((location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      parent_id: location.parent_id || ''
    });
    setShowEditModal(true);
  }, []);

  const openDeleteModal = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowDeleteModal(true);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!formData.name.trim()) {
      alert('Le nom de la localisation est requis');
      return;
    }

    setSubmitting(true);
    try {
      // Optimisation: Insertion avec retour immédiat des données
      const { data, error } = await supabase
        .from('locations')
        .insert([{
          name: formData.name.trim(),
          type: formData.type,
          parent_id: formData.parent_id || null
        }])
        .select('id, name, type, parent_id, created_at, updated_at')
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée');
      }

      // Optimisation: Mise à jour locale sans recharger toutes les données
      const newLocation: Location = {
        ...data,
        parent_name: formData.parent_id 
          ? locations.find(l => l.id === formData.parent_id)?.name 
          : undefined
      };

      const updatedLocations = [...locations, newLocation].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
      });

      setLocations(updatedLocations);
      
      // Mettre à jour le cache
      await cacheService.set(CACHE_KEYS.LOCATIONS, updatedLocations, CACHE_DURATION.MEDIUM);

      // Fermer le modal et réinitialiser
      setShowAddModal(false);
      resetForm();
      setSubmitting(false);
      
      // Afficher le message de succès après la fermeture
      setTimeout(() => {
        alert('Localisation ajoutée avec succès');
      }, 100);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      setSubmitting(false);
      
      if (error.code === '23505') {
        alert('Cette localisation existe déjà');
      } else {
        alert('Erreur lors de l\'ajout de la localisation: ' + (error.message || 'Erreur inconnue'));
      }
    }
  }, [formData, locations, resetForm]);

  const handleEdit = useCallback(async () => {
    if (!selectedLocation || !formData.name.trim()) {
      alert('Le nom de la localisation est requis');
      return;
    }

    setSubmitting(true);
    try {
      // Optimisation: Mise à jour avec retour immédiat des données
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: formData.name.trim(),
          type: formData.type,
          parent_id: formData.parent_id || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLocation.id)
        .select('id, name, type, parent_id, created_at, updated_at')
        .single();

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Aucune donnée retournée');
      }

      // Optimisation: Mise à jour locale sans recharger toutes les données
      const updatedLocation: Location = {
        ...data,
        parent_name: formData.parent_id 
          ? locations.find(l => l.id === formData.parent_id)?.name 
          : undefined
      };

      const updatedLocations = locations
        .map(loc => loc.id === selectedLocation.id ? updatedLocation : loc)
        .sort((a, b) => {
          if (a.type !== b.type) return a.type.localeCompare(b.type);
          return a.name.localeCompare(b.name);
        });

      setLocations(updatedLocations);
      
      // Mettre à jour le cache
      await cacheService.set(CACHE_KEYS.LOCATIONS, updatedLocations, CACHE_DURATION.MEDIUM);

      // Fermer le modal et réinitialiser
      setShowEditModal(false);
      setSelectedLocation(null);
      resetForm();
      setSubmitting(false);
      
      // Afficher le message de succès après la fermeture
      setTimeout(() => {
        alert('Localisation modifiée avec succès');
      }, 100);
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      setSubmitting(false);
      
      if (error.code === '23505') {
        alert('Cette localisation existe déjà');
      } else {
        alert('Erreur lors de la modification de la localisation: ' + (error.message || 'Erreur inconnue'));
      }
    }
  }, [selectedLocation, formData, locations, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!selectedLocation) return;

    setSubmitting(true);
    try {
      // Optimisation: Vérification locale des enfants
      const hasChildren = locations.some(loc => loc.parent_id === selectedLocation.id);

      if (hasChildren) {
        setSubmitting(false);
        alert('Impossible de supprimer cette localisation car elle contient des sous-localisations');
        return;
      }

      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', selectedLocation.id);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      // Optimisation: Suppression locale sans recharger toutes les données
      const updatedLocations = locations.filter(loc => loc.id !== selectedLocation.id);
      setLocations(updatedLocations);
      
      // Mettre à jour le cache
      await cacheService.set(CACHE_KEYS.LOCATIONS, updatedLocations, CACHE_DURATION.MEDIUM);

      // Fermer le modal et réinitialiser
      setShowDeleteModal(false);
      setSelectedLocation(null);
      setSubmitting(false);
      
      // Afficher le message de succès après la fermeture
      setTimeout(() => {
        alert('Localisation supprimée avec succès');
      }, 100);
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      setSubmitting(false);
      alert('Erreur lors de la suppression de la localisation: ' + (error.message || 'Erreur inconnue'));
    }
  }, [selectedLocation, locations]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ville': return 'Ville';
      case 'quartier': return 'Quartier';
      case 'region': return 'Région';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ville': return 'bg-blue-100 text-blue-800';
      case 'quartier': return 'bg-green-100 text-green-800';
      case 'region': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <i className="ri-map-pin-line text-3xl text-orange-500"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Villes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.villes}</p>
            </div>
            <i className="ri-building-line text-3xl text-blue-500"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quartiers</p>
              <p className="text-2xl font-bold text-green-600">{stats.quartiers}</p>
            </div>
            <i className="ri-community-line text-3xl text-green-500"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Régions</p>
              <p className="text-2xl font-bold text-purple-600">{stats.regions}</p>
            </div>
            <i className="ri-map-2-line text-3xl text-purple-500"></i>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher une localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('ville')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'ville'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Villes
            </button>
            <button
              onClick={() => setFilterType('quartier')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'quartier'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Quartiers
            </button>
            <button
              onClick={() => setFilterType('region')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'region'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Régions
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            Ajouter une localisation
          </button>
        </div>
      </div>

      {/* Tableau des localisations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucune localisation trouvée
                  </td>
                </tr>
              ) : (
                paginatedData.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <i className="ri-map-pin-line text-orange-500 mr-2"></i>
                        <span className="text-sm font-medium text-gray-900">{location.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(location.type)}`}>
                        {getTypeLabel(location.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.parent_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(location.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(location)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => openDeleteModal(location)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onNext={nextPage}
              onPrevious={prevPage}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={filteredLocations.length}
            />
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une localisation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, parent_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="ville">Ville</option>
                  <option value="quartier">Quartier</option>
                  <option value="region">Région</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nom de la localisation"
                  disabled={submitting}
                />
              </div>

              {formData.type === 'quartier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville parente
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="">Aucune</option>
                    {parentLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Ajout en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Modifier la localisation</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any, parent_id: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="ville">Ville</option>
                  <option value="quartier">Quartier</option>
                  <option value="region">Région</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nom de la localisation"
                  disabled={submitting}
                />
              </div>

              {formData.type === 'quartier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville parente
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={submitting}
                  >
                    <option value="">Aucune</option>
                    {parentLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedLocation(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Modification...
                  </>
                ) : (
                  'Mettre à jour'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression */}
      {showDeleteModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la localisation <strong>{selectedLocation.name}</strong> ?
              Cette action est irréversible.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedLocation(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
