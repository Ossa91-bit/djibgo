import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  professional_count?: number;
  created_at: string;
  updated_at?: string;
}

interface ExtendedCategory extends Category {
  total_bookings?: number;
  active_services?: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'ri-hammer-line',
    is_active: true
  });

  const ITEMS_PER_PAGE = 10;

  const iconOptions = [
    { value: 'ri-hammer-line', label: 'Marteau (Artisan)' },
    { value: 'ri-tools-line', label: 'Outils (Réparation)' },
    { value: 'ri-paint-brush-line', label: 'Pinceau (Peinture)' },
    { value: 'ri-flashlight-line', label: 'Lampe (Électricité)' },
    { value: 'ri-drop-line', label: 'Goutte (Plomberie)' },
    { value: 'ri-building-line', label: 'Bâtiment (Construction)' },
    { value: 'ri-car-line', label: 'Voiture (Transport)' },
    { value: 'ri-computer-line', label: 'Ordinateur (Informatique)' },
    { value: 'ri-scissors-line', label: 'Ciseaux (Coiffure)' },
    { value: 'ri-restaurant-line', label: 'Restaurant (Cuisine)' },
    { value: 'ri-home-line', label: 'Maison (Ménage)' },
    { value: 'ri-plant-line', label: 'Plante (Jardinage)' },
    { value: 'ri-camera-line', label: 'Caméra (Photographie)' },
    { value: 'ri-music-line', label: 'Musique (Musicien)' },
    { value: 'ri-book-line', label: 'Livre (Éducation)' },
    { value: 'ri-heart-pulse-line', label: 'Santé (Médical)' },
    { value: 'ri-service-line', label: 'Service (Général)' },
    { value: 'ri-settings-line', label: 'Paramètres (Technique)' },
    { value: 'ri-fire-line', label: 'Feu (Soudure)' },
    { value: 'ri-temp-cold-line', label: 'Froid (Climatisation)' }
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Récupérer tous les profils professionnels avec leurs catégories
      const { data: profiles, error: profilesError } = await supabase
        .from('professional_profiles')
        .select('id, service_category');

      if (profilesError) throw profilesError;

      // Compter les professionnels par catégorie
      const categoryCounts: { [key: string]: number } = {};
      profiles?.forEach(profile => {
        if (profile.service_category) {
          categoryCounts[profile.service_category] = (categoryCounts[profile.service_category] || 0) + 1;
        }
      });

      // Ajouter le compteur à chaque catégorie
      const categoriesWithCounts = categoriesData?.map(cat => ({
        ...cat,
        professional_count: categoryCounts[cat.name] || 0
      })) || [];

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      alert('Erreur lors du chargement des catégories. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'ri-service-line',
      is_active: true
    });
    setShowModal(true);
  };

  const handleViewDetails = async (category: Category) => {
    try {
      // Récupérer les professionnels de cette catégorie
      const { data: professionals, error: profError } = await supabase
        .from('professional_profiles')
        .select('id')
        .eq('service_category', category.name);

      if (profError) throw profError;

      const professionalIds = professionals?.map(p => p.id) || [];

      // Récupérer les services actifs de cette catégorie
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .eq('category', category.name)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Récupérer les réservations des professionnels de cette catégorie
      let totalBookings = 0;
      if (professionalIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .in('professional_id', professionalIds);

        if (bookingsError) throw bookingsError;
        totalBookings = bookingsData?.length || 0;
      }

      const extendedCategory: ExtendedCategory = {
        ...category,
        total_bookings: totalBookings,
        active_services: servicesData?.length || 0
      };
      
      setSelectedCategory(extendedCategory);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      alert('Erreur lors du chargement des détails de la catégorie');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'ri-service-line',
      is_active: category.is_active
    });
    setShowModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if ((category.professional_count || 0) > 0) {
      alert(`Impossible de supprimer cette catégorie car ${category.professional_count} professionnel(s) l'utilisent encore.`);
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      alert('Catégorie supprimée avec succès !');
      fetchCategories();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Une erreur est survenue lors de la suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Le nom de la catégorie est obligatoire');
      return;
    }

    try {
      if (editingCategory) {
        // Mise à jour de la catégorie
        const { error: updateError } = await supabase
          .from('service_categories')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (updateError) throw updateError;

        // Si le nom a changé, mettre à jour tous les profils professionnels
        if (editingCategory.name !== formData.name) {
          const { error: profilesError } = await supabase
            .from('professional_profiles')
            .update({ service_category: formData.name })
            .eq('service_category', editingCategory.name);

          if (profilesError) throw profilesError;
        }

        alert('Catégorie mise à jour avec succès !');
      } else {
        // Création d'une nouvelle catégorie
        const { error: insertError } = await supabase
          .from('service_categories')
          .insert([{
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            is_active: formData.is_active
          }]);

        if (insertError) {
          if (insertError.code === '23505') {
            alert('Cette catégorie existe déjà');
            return;
          }
          throw insertError;
        }

        alert('Nouvelle catégorie créée avec succès !');
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  const totalCategories = categories.length;
  const activeCategories = categories.filter(c => c.is_active).length;
  const totalProfessionals = categories.reduce((sum, c) => sum + (c.professional_count || 0), 0);

  // Pagination
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCategories = categories.slice(startIndex, endIndex);

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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Catégories</h2>
        <div className="flex space-x-3">
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Ajouter une catégorie
          </button>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total catégories</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalCategories}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-folder-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Catégories actives</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{activeCategories}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total professionnels</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalProfessionals}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  category.is_active ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <i className={`${category.icon || 'ri-hammer-line'} text-2xl ${
                    category.is_active ? 'text-orange-600' : 'text-gray-400'
                  }`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">
                    {category.professional_count || 0} professionnel{(category.professional_count || 0) > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                category.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            {category.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {category.description}
              </p>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => handleViewDetails(category)}
                className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Détails
              </button>
              <button
                onClick={() => handleEditCategory(category)}
                className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDeleteCategory(category)}
                className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-delete-bin-line"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-6 py-4">
          <div className="text-sm text-gray-600">
            Affichage de {startIndex + 1} à {Math.min(endIndex, categories.length)} sur {categories.length} catégories
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="ri-arrow-left-s-line"></i>
              Précédent
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Suivant
              <i className="ri-arrow-right-s-line"></i>
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <i className="ri-folder-line text-6xl text-gray-300 mb-4"></i>
          <p className="text-gray-600 mb-4">Aucune catégorie trouvée</p>
          <button
            onClick={openAddModal}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            Créer votre première catégorie
          </button>
        </div>
      )}

      {/* Modal Ajouter/Modifier */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Ex: Menuiserie, Plomberie..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  rows={3}
                  placeholder="Description de la catégorie..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icône
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  {iconOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Aperçu:</span>
                  <div className="w-8 h-8 bg-teal-100 rounded flex items-center justify-center">
                    <i className={`${formData.icon} text-teal-600`}></i>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700 cursor-pointer">
                  Catégorie active
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
                >
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailsModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Détails de la catégorie</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête avec icône */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                  <i className={`${selectedCategory.icon} text-3xl text-orange-600`}></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-gray-900">{selectedCategory.name}</h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCategory.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedCategory.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <i className="ri-user-line text-blue-600 text-xl"></i>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">{selectedCategory.professional_count || 0}</div>
                  <div className="text-sm text-blue-700">Professionnels</div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <i className="ri-service-line text-green-600 text-xl"></i>
                  </div>
                  <div className="text-2xl font-bold text-green-900">{selectedCategory.active_services || 0}</div>
                  <div className="text-sm text-green-700">Services actifs</div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <i className="ri-calendar-check-line text-purple-600 text-xl"></i>
                  </div>
                  <div className="text-2xl font-bold text-purple-900">{selectedCategory.total_bookings || 0}</div>
                  <div className="text-sm text-purple-700">Réservations</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">Description</h5>
                <p className="text-gray-600 bg-gray-50 rounded-lg p-4">
                  {selectedCategory.description || 'Aucune description disponible'}
                </p>
              </div>

              {/* Informations techniques */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Informations techniques</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">ID de la catégorie</div>
                    <div className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                      {selectedCategory.id}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Code de l'icône</div>
                    <div className="text-sm font-mono text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                      {selectedCategory.icon}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date de création</div>
                    <div className="text-sm text-gray-900">
                      {selectedCategory.created_at 
                        ? new Date(selectedCategory.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Non disponible'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">Dernière modification</div>
                    <div className="text-sm text-gray-900">
                      {selectedCategory.updated_at 
                        ? new Date(selectedCategory.updated_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })
                        : 'Non disponible'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditCategory(selectedCategory);
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Modifier
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('service_categories')
                        .update({ is_active: !selectedCategory.is_active })
                        .eq('id', selectedCategory.id);

                      if (error) throw error;

                      setShowDetailsModal(false);
                      fetchCategories();
                    } catch (error) {
                      console.error('Erreur:', error);
                      alert('Erreur lors de la mise à jour du statut');
                    }
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap ${
                    selectedCategory.is_active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <i className={`${selectedCategory.is_active ? 'ri-pause-circle-line' : 'ri-play-circle-line'} mr-2`}></i>
                  {selectedCategory.is_active ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium whitespace-nowrap"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
