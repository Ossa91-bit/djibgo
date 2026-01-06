import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  professional_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  client?: {
    full_name: string;
  };
  professional?: {
    full_name: string;
  };
  bookings?: {
    services?: {
      title: string;
    };
  };
}

export default function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 10;

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm]);

  const filterReviews = () => {
    if (!searchTerm) {
      setFilteredReviews(reviews);
      return;
    }

    const filtered = reviews.filter(review => {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.client?.full_name?.toLowerCase().includes(searchLower) ||
        review.professional?.full_name?.toLowerCase().includes(searchLower) ||
        review.comment?.toLowerCase().includes(searchLower) ||
        review.bookings?.services?.title?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredReviews(filtered);
  };

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          bookings(
            services(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter));
      }

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        console.error('Erreur:', reviewsError);
        setError('Erreur lors du chargement des avis');
        setReviews([]);
        setFilteredReviews([]);
        setLoading(false);
        return;
      }

      // Fetch all unique client and professional IDs
      const clientIds = [...new Set(reviewsData?.map(r => r.client_id).filter(Boolean) || [])];
      const professionalIds = [...new Set(reviewsData?.map(r => r.professional_id).filter(Boolean) || [])];
      const allProfileIds = [...new Set([...clientIds, ...professionalIds])];

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', allProfileIds);

      if (profilesError) {
        console.error('Erreur profiles:', profilesError);
      }

      // Create a map of profiles for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Combine the data
      const enrichedReviews = reviewsData?.map(review => ({
        ...review,
        client: profilesMap.get(review.client_id),
        professional: profilesMap.get(review.professional_id)
      })) || [];

      setReviews(enrichedReviews);
      setFilteredReviews(enrichedReviews);
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      setError('Erreur lors du chargement des avis');
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'avis');
      } else {
        fetchReviews();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'avis');
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedReviews.length} avis ?`)) return;

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .in('id', selectedReviews);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des avis');
      } else {
        setSelectedReviews([]);
        fetchReviews();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression des avis');
    }
  };

  const toggleSelectReview = (id: string) => {
    setSelectedReviews(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r.id));
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0';

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter(r => r.rating === rating).length / reviews.length) * 100)
      : 0
  }));

  // Pagination
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = filteredReviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Chargement des avis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <i className="ri-error-warning-line text-4xl"></i>
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchReviews}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Avis</h2>
        <div className="flex space-x-3">
          {selectedReviews.length > 0 && (
            <button
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <i className="ri-delete-bin-line mr-2"></i>
              Supprimer ({selectedReviews.length})
            </button>
          )}
          <button
            onClick={fetchReviews}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
              <p className="text-gray-600 text-sm font-medium">Total avis</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{reviews.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ri-star-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Note moyenne</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{averageRating} / 5</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
              <i className="ri-star-fill text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avis 5 étoiles</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reviews.filter(r => r.rating === 5).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <i className="ri-thumb-up-line text-white text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avis négatifs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {reviews.filter(r => r.rating <= 2).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <i className="ri-thumb-down-line text-white text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des notes</h3>
        <div className="space-y-3">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center">
              <div className="flex items-center w-24">
                <span className="text-sm font-medium text-gray-700 mr-2">{rating}</span>
                <i className="ri-star-fill text-yellow-400 text-sm"></i>
              </div>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="w-20 text-right">
                <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Client, professionnel, commentaire..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-1">
                {filteredReviews.length} résultat{filteredReviews.length !== 1 ? 's' : ''} trouvé{filteredReviews.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par note
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <i className="ri-inbox-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-600">
              {searchTerm ? 'Aucun avis trouvé pour cette recherche' : 'Aucun avis disponible'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === currentReviews.length && currentReviews.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Professionnel
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commentaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => toggleSelectReview(review.id)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {review.client?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {review.professional?.full_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {review.bookings?.services?.title || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400`}
                            ></i>
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({review.rating})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={review.comment || 'Aucun commentaire'}>
                          {review.comment || 'Aucun commentaire'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {review.created_at ? new Date(review.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Supprimer l'avis"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
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
                  Affichage de {indexOfFirstReview + 1} à {Math.min(indexOfLastReview, filteredReviews.length)} sur {filteredReviews.length} avis
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
          </>
        )}
      </div>
    </div>
  );
}
