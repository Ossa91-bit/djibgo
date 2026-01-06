import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Service {
  id: string;
  professional_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 10;

  useEffect(() => {
    fetchServices();
  }, [categoryFilter, statusFilter]);

  const fetchServices = async () => {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          profiles!services_professional_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur:', error);
      } else {
        setServices(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (!error) {
        fetchServices();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchServices();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const bulkToggleStatus = async (activate: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: activate })
        .in('id', selectedServices);

      if (!error) {
        setSelectedServices([]);
        fetchServices();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const toggleSelectService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedServices.length === services.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices(services.map(s => s.id));
    }
  };

  const categories = ['Chauffeur', 'Technicien', 'Artisan', 'Autre'];

  const activeServices = services.filter(s => s.is_active).length;
  const totalRevenue = services.reduce((sum, s) => sum + s.price, 0);
  const averagePrice = services.length > 0 ? Math.round(totalRevenue / services.length) : 0;

  // Filtrer les services
  const filteredServices = services.filter(service =>
    service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

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
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Services</h2>
        <div className="flex space-x-3">
          {selectedServices.length > 0 && (
            <>
              <button
                onClick={() => bulkToggleStatus(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-check-line mr-2"></i>
                Activer ({selectedServices.length})
              </button>
              <button
                onClick={() => bulkToggleStatus(false)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-close-line mr-2"></i>
                Désactiver ({selectedServices.length})
              </button>
            </>
          )}
          <button
            onClick={fetchServices}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-refresh-line mr-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total services</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{services.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-service-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Services actifs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{activeServices}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-check-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Prix moyen</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{averagePrice} FDJ</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Catégories</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <i className="ri-folder-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Titre, professionnel..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Toutes</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
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
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedServices.length === currentServices.length && currentServices.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professionnel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prix
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durée
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
              {currentServices.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(service.id)}
                      onChange={() => toggleSelectService(service.id)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{service.title}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{service.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {service.profiles?.full_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {service.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {service.price} FDJ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {service.duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      service.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {service.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          service.is_active
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {service.is_active ? 'Désactiver' : 'Activer'}
                      </button>
                      <button
                        onClick={() => deleteService(service.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Affichage de {indexOfFirstService + 1} à {Math.min(indexOfLastService, filteredServices.length)} sur {filteredServices.length} services
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
