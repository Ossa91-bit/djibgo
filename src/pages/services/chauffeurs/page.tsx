import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/feature/Header';
import Footer from '../../../components/feature/Footer';
import FilterBar from '../../../components/base/FilterBar';
import LoadingSpinner from '../../../components/base/LoadingSpinner';
import AnimatedSection from '../../../components/feature/AnimatedSection';
import BookingModal from '../../../components/booking/BookingModal';
import AuthModal from '../../../components/booking/AuthModal';
import InstantBookingModal from '../../../components/booking/InstantBookingModal';
import useGeolocation from '../../../hooks/useGeolocation';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

interface Driver {
  id: string;
  full_name: string;
  business_name?: string;
  service_category: string;
  sub_category?: string;
  rating: number;
  total_reviews: number;
  hourly_rate: number;
  city: string;
  avatar_url?: string;
  is_verified: boolean;
  is_available: boolean;
  experience_years: number;
  skills?: string[];
  description?: string;
  phone?: string;
  certifications?: string[];
  distance?: number;
}

export default function ChauffeursPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInstantBookingModal, setShowInstantBookingModal] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    rating: '',
    vehicleType: ''
  });
  const { latitude, longitude, error, loading: locationLoading, getLocation, calculateDistance } = useGeolocation();

  // Load drivers from database
  useEffect(() => {
    loadDrivers();
    loadCategories();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      
      // Fetch all professionals with "Chauffeur" in service_category or sub_category with profile data
      const { data, error: fetchError } = await supabase
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
        .order('rating', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data to include profile information
      const transformedData = (data || []).map(prof => ({
        ...prof,
        full_name: prof.profiles?.full_name || prof.business_name || 'Chauffeur',
        avatar_url: prof.profiles?.avatar_url || null
      }));

      setDrivers(transformedData);
    } catch (err) {
      console.error('Error loading drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('service_categories')
        .select('*')
        .ilike('name', '%chauffeur%')
        .eq('is_active', true)
        .order('name');

      if (fetchError) throw fetchError;

      // Count professionals for each category
      const categoriesWithCount = await Promise.all(
        (data || []).map(async (category) => {
          const { count } = await supabase
            .from('professional_profiles')
            .select('*', { count: 'exact', head: true })
            .or(`service_category.eq.${category.name},sub_category.eq.${category.name}`)
            .eq('is_active', true);

          return {
            ...category,
            professional_count: count || 0
          };
        })
      );

      // Sort by professional count and take top 10
      const topCategories = categoriesWithCount
        .sort((a, b) => b.professional_count - a.professional_count)
        .slice(0, 10);

      setCategories(topCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const filterCategories = categories.map(cat => ({
    id: cat.id,
    label: cat.name,
    value: cat.name
  }));

  const filterPriceRanges = [
    { id: '1', label: '0-1000 DJF/h', value: '0-1000' },
    { id: '2', label: '1000-2000 DJF/h', value: '1000-2000' },
    { id: '3', label: '2000-3000 DJF/h', value: '2000-3000' },
    { id: '4', label: '3000+ DJF/h', value: '3000+' }
  ];

  const filterRatings = [
    { id: '1', label: '4.8+ étoiles', value: '4.8' },
    { id: '2', label: '4.5+ étoiles', value: '4.5' },
    { id: '3', label: '4+ étoiles', value: '4' },
    { id: '4', label: '3.5+ étoiles', value: '3.5' }
  ];

  const filterLocations = [
    { id: '1', label: 'Djibouti-Ville', value: 'Djibouti-Ville' },
    { id: '2', label: 'Balbala', value: 'Balbala' },
    { id: '3', label: 'Ambouli', value: 'Ambouli' },
    { id: '4', label: 'PK12', value: 'PK12' },
    { id: '5', label: 'Boulaos', value: 'Boulaos' }
  ];

  const filterAvailability = [
    { id: '1', label: 'Disponible maintenant', value: 'available' },
    { id: '2', label: 'Tous', value: 'all' }
  ];

  const filterDistances = [
    { id: '1', label: 'Moins de 2 km', value: '2' },
    { id: '2', label: 'Moins de 5 km', value: '5' },
    { id: '3', label: 'Moins de 10 km', value: '10' },
    { id: '4', label: 'Moins de 20 km', value: '20' }
  ];

  const filteredDrivers = useMemo(() => {
    let filtered = drivers.filter(driver => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesSearch = 
          driver.full_name?.toLowerCase().includes(search) ||
          driver.business_name?.toLowerCase().includes(search) ||
          driver.service_category?.toLowerCase().includes(search) ||
          driver.sub_category?.toLowerCase().includes(search);
        
        if (!matchesSearch) return false;
      }

      // Category filter - check both service_category AND sub_category
      if (filters.category) {
        const categoryMatch = 
          driver.service_category?.toLowerCase() === filters.category.toLowerCase() ||
          driver.sub_category?.toLowerCase() === filters.category.toLowerCase();
        
        if (!categoryMatch) return false;
      }

      // Price range filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
        if (max) {
          if (driver.hourly_rate < parseInt(min) || driver.hourly_rate > parseInt(max)) return false;
        } else {
          if (driver.hourly_rate < parseInt(min)) return false;
        }
      }

      // Rating filter
      if (filters.rating && driver.rating < parseFloat(filters.rating)) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'rating') {
      filtered = filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price') {
      filtered = filtered.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
    }

    return filtered;
  }, [searchQuery, filters, sortBy, drivers]);

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBookingClick = (driver: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setSelectedDriver(driver);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedDriver(null);
    alert('Réservation effectuée avec succès! Vous pouvez la consulter dans votre tableau de bord.');
  };

  const scrollToDrivers = () => {
    const driversSection = document.getElementById('drivers-section');
    if (driversSection) {
      driversSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleInstantBooking = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!latitude || !longitude) {
      alert('Veuillez activer la géolocalisation pour utiliser la réservation instantanée');
      getLocation();
      return;
    }

    setShowInstantBookingModal(true);
  };

  const handleDriverSelected = (driver: any) => {
    setSelectedDriver(driver);
    setShowBookingModal(true);
  };

  const getAvatarUrl = (driver: Driver) => {
    if (driver.avatar_url && driver.avatar_url.trim() !== '') {
      return driver.avatar_url;
    }
    // Use business name first 2 letters as fallback
    const initials = driver.business_name?.substring(0, 2).toUpperCase() || 'CH';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=0d9488&color=fff&bold=true&length=2`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />
      
      <div className="pt-16 sm:pt-20">
        {/* Hero Section */}
        <AnimatedSection animation="fadeIn" className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedSection animation="slideUp">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                  <strong>Services de Chauffeurs Professionnels</strong>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-teal-50">
                  Trouvez le chauffeur parfait pour tous vos besoins de transport à Djibouti
                </p>
              </AnimatedSection>

              <AnimatedSection animation="slideUp" delay={200}>
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un chauffeur ou un service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 text-base sm:text-lg border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-white/70"
                    />
                    <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 text-xl"></i>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={handleInstantBooking}
                      className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap shadow-lg"
                    >
                      <i className="ri-flashlight-fill text-xl"></i>
                      Réserver maintenant
                    </button>

                    <button
                      onClick={getLocation}
                      disabled={locationLoading}
                      className="flex-1 px-6 py-3 bg-white text-teal-700 hover:bg-teal-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap"
                    >
                      {locationLoading ? (
                        <LoadingSpinner size="sm" color="text-teal-700" />
                      ) : (
                        <i className="ri-map-pin-line"></i>
                      )}
                      Chauffeurs près de moi
                    </button>
                    
                    <button
                      onClick={() => setShowFilters(true)}
                      className="lg:hidden flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap"
                    >
                      <i className="ri-filter-line"></i>
                      Filtres
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-100">
                        <i className="ri-alert-line"></i>
                        <span className="text-sm sm:text-base">{error}</span>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>

        {/* Service Categories */}
        {categories.length > 0 && (
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <AnimatedSection animation="slideUp">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  <strong>Catégories de Services</strong>
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Choisissez le type de chauffeur adapté à vos besoins
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
              {categories.map((category, index) => (
                <AnimatedSection key={category.id} animation="slideUp" delay={index * 100}>
                  <div
                    onClick={() => {
                      setFilters({ ...filters, category: category.name });
                      scrollToDrivers();
                    }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 p-6"
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="ri-car-line text-3xl text-teal-600"></i>
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-gray-900">{category.name}</h3>
                      <span className="text-sm font-medium text-teal-600">
                        {category.professional_count} chauffeur{category.professional_count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 pb-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Desktop Filters */}
            <div className="hidden lg:block lg:w-80">
              <AnimatedSection animation="slideLeft">
                <div className="sticky top-24">
                  <FilterBar
                    categories={filterCategories}
                    priceRanges={filterPriceRanges}
                    ratings={filterRatings}
                    locations={filterLocations}
                    availability={filterAvailability}
                    distances={filterDistances}
                    onFilterChange={setFilters}
                    className=""
                  />
                </div>
              </AnimatedSection>
            </div>

            {/* Mobile Filters Modal */}
            <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
              showFilters ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}>
              <div 
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => setShowFilters(false)}
              ></div>
              
              <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl max-h-[80vh] overflow-hidden transform transition-transform duration-300 ${
                showFilters ? 'translate-y-0' : 'translate-y-full'
              }`}>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                  <FilterBar
                    categories={filterCategories}
                    priceRanges={filterPriceRanges}
                    ratings={filterRatings}
                    locations={filterLocations}
                    availability={filterAvailability}
                    distances={filterDistances}
                    onFilterChange={(newFilters) => {
                      setFilters(newFilters);
                      setShowFilters(false);
                    }}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>

            {/* Drivers List */}
            <div className="flex-1">
              <AnimatedSection animation="slideUp">
                <div id="drivers-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Chauffeurs disponibles ({filteredDrivers.length})
                  </h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
                  >
                    <option value="rating">Trier par note</option>
                    <option value="price">Trier par prix</option>
                  </select>
                </div>
              </AnimatedSection>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner size="large" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredDrivers.map((driver, index) => (
                    <AnimatedSection key={driver.id} animation="slideUp" delay={index * 100}>
                      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                        <div className="flex gap-4 p-6">
                          {/* Driver Avatar */}
                          <div className="relative flex-shrink-0">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-teal-100">
                              <img
                                src={getAvatarUrl(driver)}
                                alt={driver.full_name || driver.business_name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  const initials = driver.business_name?.substring(0, 2).toUpperCase() || 'CH';
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=0d9488&color=fff&bold=true&length=2`;
                                }}
                              />
                            </div>
                            {driver.is_verified && (
                              <div className="absolute -top-1 -right-1 bg-teal-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                                <i className="ri-checkbox-circle-fill"></i>
                                Vérifié
                              </div>
                            )}
                          </div>

                          {/* Driver Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {driver.full_name || driver.business_name}
                                </h3>
                                <p className="text-sm text-teal-600 font-medium mb-1">
                                  {driver.service_category}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-teal-600 whitespace-nowrap">
                                  {driver.hourly_rate} DJF/h
                                </div>
                              </div>
                            </div>

                            {/* Rating and Reviews */}
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-1">
                                <i className="ri-star-fill text-yellow-400 text-sm"></i>
                                <span className="text-sm font-semibold text-gray-900">{driver.rating || 0}</span>
                                <span className="text-sm text-gray-500">({driver.total_reviews || 0} avis)</span>
                              </div>
                            </div>

                            {/* Experience */}
                            <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <i className="ri-time-line text-teal-500"></i>
                                <span>Expérience: {driver.experience_years || 0} ans</span>
                              </div>
                              {driver.certifications && driver.certifications.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <i className="ri-award-line text-teal-500"></i>
                                  <span>{driver.certifications.length} certification{driver.certifications.length > 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 mb-3 text-sm text-gray-600">
                              <i className="ri-map-pin-line text-gray-400"></i>
                              <span>À 64.3 km de vous</span>
                            </div>

                            {/* Availability */}
                            <div className="mb-3">
                              {driver.is_available ? (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                  <i className="ri-checkbox-circle-line"></i>
                                  Disponible
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  <i className="ri-time-line"></i>
                                  Indisponible
                                </span>
                              )}
                              <span className="ml-3 text-xs text-gray-500">
                                Temps de réponse: &lt; 2h
                              </span>
                            </div>

                            {/* Skills */}
                            {driver.skills && driver.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {driver.skills.slice(0, 4).map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-teal-50 text-teal-700 rounded text-xs"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => navigate(`/professionnel/${driver.id}`)}
                                className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                              >
                                <i className="ri-user-line"></i>
                                Voir le profil
                              </button>
                              <button
                                onClick={() => handleBookingClick(driver)}
                                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
                              >
                                <i className="ri-calendar-check-line"></i>
                                Réserver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              )}

              {!loading && filteredDrivers.length === 0 && (
                <AnimatedSection animation="fadeIn" className="text-center py-16">
                  <i className="ri-car-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun chauffeur trouvé</h3>
                  <p className="text-base text-gray-500">Essayez de modifier vos critères de recherche</p>
                </AnimatedSection>
              )}
            </div>
          </div>
        </div>

        {/* Instant Booking Modal */}
        {latitude && longitude && (
          <InstantBookingModal
            isOpen={showInstantBookingModal}
            onClose={() => setShowInstantBookingModal(false)}
            userLatitude={latitude}
            userLongitude={longitude}
            serviceType="Chauffeur"
            onDriverSelected={handleDriverSelected}
          />
        )}

        {/* Booking Modal */}
        <BookingModal
          service={selectedDriver}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDriver(null);
          }}
          onSuccess={handleBookingSuccess}
        />

        {/* Auth Modal */}
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
