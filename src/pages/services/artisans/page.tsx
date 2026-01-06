import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../../components/feature/Header';
import Footer from '../../../components/feature/Footer';
import SEOHead from '../../../components/feature/SEOHead';
import AnimatedSection from '../../../components/feature/AnimatedSection';
import ProfessionalCard from '../components/ProfessionalCard';
import LoadingSpinner from '../../../components/base/LoadingSpinner';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import AuthModal from '../../../components/auth/AuthModal';

export default function ArtisansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const { user, profile } = useAuth();

  useEffect(() => {
    loadArtisans();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const { data, error: fetchError } = await supabase
        .from('service_categories')
        .select('*')
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
      console.error('Erreur lors du chargement des catégories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadArtisans = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all active professionals with their profile data (avatar_url, full_name)
      const { data, error: fetchError } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!inner (
            full_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data to include profile information
      const transformedData = (data || []).map(prof => ({
        ...prof,
        full_name: prof.profiles?.full_name || prof.business_name || 'Professionnel',
        avatar_url: prof.profiles?.avatar_url || null
      }));

      setProfessionals(transformedData);
    } catch (err) {
      console.error('Erreur lors du chargement des artisans:', err);
      setError('Impossible de charger les artisans. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedPriceRange('');
    setSelectedRating('');
  };

  const handleBecomePartner = () => {
    if (user && profile) {
      // Vérifier le type de compte
      if (profile.user_type === 'professional') {
        // Si c'est un professionnel, rediriger vers le dashboard
        window.REACT_APP_NAVIGATE('/dashboard');
      } else {
        // Si c'est un client, afficher un message de notification
        setNotificationMessage('Pour devenir artisan partenaire, vous devez créer un compte professionnel. Veuillez vous inscrire avec un compte de type "Professionnel".');
        setShowNotification(true);
      }
    } else {
      // Si l'utilisateur n'est pas connecté, ouvrir le modal d'inscription
      setAuthModalMode('register');
      setIsAuthModalOpen(true);
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
    setNotificationMessage('');
  };

  const priceRangeOptions = [
    { id: 'all', label: 'Tous les prix', value: '' },
    { id: 'low', label: 'Moins de 2000 DJF/h', value: '0-2000' },
    { id: 'medium', label: '2000 - 4000 DJF/h', value: '2000-4000' },
    { id: 'high', label: 'Plus de 4000 DJF/h', value: '4000-10000' },
  ];

  const ratingOptions = [
    { id: 'all', label: 'Toutes les notes', value: '' },
    { id: '4plus', label: '4+ étoiles', value: '4' },
    { id: '3plus', label: '3+ étoiles', value: '3' },
    { id: '2plus', label: '2+ étoiles', value: '2' },
  ];

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = (prof.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (prof.business_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (prof.service_category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (prof.sub_category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                         (prof.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Check both service_category AND sub_category for category filter
    const matchesCategory = !selectedCategory || 
                           prof.service_category?.toLowerCase() === selectedCategory.toLowerCase() ||
                           prof.sub_category?.toLowerCase() === selectedCategory.toLowerCase();
    
    let matchesPrice = true;
    if (selectedPriceRange && prof.hourly_rate) {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      const rate = Number(prof.hourly_rate);
      matchesPrice = rate >= min && rate <= max;
    }
    
    const matchesRating = !selectedRating || (Number(prof.rating) || 0) >= Number(selectedRating);

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  const specialties = [
    {
      icon: 'ri-hammer-line',
      title: 'Menuiserie',
      description: 'Fabrication et installation de meubles, portes, fenêtres',
      image: 'https://readdy.ai/api/search-image?query=professional%20skilled%20carpenter%20woodworker%20crafting%20custom%20wooden%20furniture%20in%20modern%20bright%20workshop%20with%20natural%20wood%20materials%20and%20professional%20tools%20clean%20minimalist%20background%20warm%20lighting%20artisan%20at%20work&width=400&height=300&seq=artisan-menuiserie-1&orientation=landscape'
    },
    {
      icon: 'ri-drop-line',
      title: 'Plomberie',
      description: 'Installation, réparation et maintenance des systèmes sanitaires',
      image: 'https://readdy.ai/api/search-image?query=professional%20plumber%20installing%20modern%20bathroom%20fixtures%20and%20pipes%20in%20clean%20contemporary%20space%20with%20chrome%20fittings%20bright%20white%20background%20expert%20technician%20working%20with%20precision%20tools&width=400&height=300&seq=artisan-plomberie-1&orientation=landscape'
    },
    {
      icon: 'ri-flashlight-line',
      title: 'Électricité',
      description: 'Installation électrique, dépannage et mise aux normes',
      image: 'https://readdy.ai/api/search-image?query=professional%20electrician%20working%20on%20modern%20electrical%20panel%20and%20wiring%20installation%20in%20bright%20clean%20environment%20with%20safety%20equipment%20contemporary%20electrical%20systems%20expert%20technician%20focused%20work&width=400&height=300&seq=artisan-electricite-1&orientation=landscape'
    },
    {
      icon: 'ri-building-line',
      title: 'Maçonnerie',
      description: 'Construction, rénovation et travaux de gros œuvre',
      image: 'https://readdy.ai/api/search-image?query=skilled%20mason%20building%20modern%20brick%20wall%20structure%20with%20professional%20tools%20and%20materials%20in%20bright%20construction%20site%20clean%20background%20expert%20craftsman%20precise%20bricklaying%20work%20contemporary%20architecture&width=400&height=300&seq=artisan-maconnerie-1&orientation=landscape'
    },
    {
      icon: 'ri-paint-brush-line',
      title: 'Peinture',
      description: 'Peinture intérieure et extérieure, décoration murale',
      image: 'https://readdy.ai/api/search-image?query=professional%20painter%20applying%20smooth%20paint%20finish%20on%20modern%20interior%20wall%20with%20quality%20brushes%20and%20rollers%20bright%20clean%20white%20room%20expert%20decorator%20creating%20perfect%20surface%20contemporary%20home&width=400&height=300&seq=artisan-peinture-1&orientation=landscape'
    },
    {
      icon: 'ri-temp-cold-line',
      title: 'Climatisation',
      description: 'Installation et entretien de systèmes de climatisation',
      image: 'https://readdy.ai/api/search-image?query=professional%20hvac%20technician%20installing%20modern%20air%20conditioning%20unit%20in%20contemporary%20bright%20interior%20space%20with%20clean%20white%20walls%20expert%20working%20with%20precision%20tools%20and%20equipment%20climate%20control%20system&width=400&height=300&seq=artisan-climatisation-1&orientation=landscape'
    }
  ];

  return (
    <>
      <SEOHead
        title="Artisans Professionnels Djibouti | Menuisiers, Plombiers, Électriciens"
        description="Trouvez les meilleurs artisans à Djibouti : menuisiers, plombiers, électriciens, maçons, peintres. Services de qualité pour tous vos travaux. Réservez en ligne facilement."
        keywords="artisans Djibouti, menuisier Djibouti, plombier Djibouti, électricien Djibouti, maçon Djibouti, peintre Djibouti, travaux Djibouti"
        canonical="/services/artisans"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-orange-50">
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-300/10"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            <AnimatedSection animation="fade-up">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                  <i className="ri-tools-fill text-4xl text-orange-500"></i>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  Artisans Professionnels
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  Des artisans qualifiés et expérimentés pour tous vos travaux de menuiserie, plomberie, électricité, maçonnerie et plus encore
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <div className="bg-white rounded-lg px-6 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <i className="ri-shield-check-line text-orange-500 text-xl"></i>
                      <span className="font-semibold text-gray-900">Artisans Vérifiés</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg px-6 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <i className="ri-star-fill text-orange-500 text-xl"></i>
                      <span className="font-semibold text-gray-900">Travail de Qualité</span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg px-6 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <i className="ri-time-line text-orange-500 text-xl"></i>
                      <span className="font-semibold text-gray-900">Intervention Rapide</span>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Specialties Section */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Nos Spécialités Artisanales
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Des experts dans chaque domaine pour répondre à tous vos besoins
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                {specialties.map((specialty, index) => (
                  <div
                    key={index}
                    className="group bg-gradient-to-br from-white to-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100"
                  >
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={specialty.image}
                        alt={specialty.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                          <i className={`${specialty.icon} text-2xl text-white`}></i>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{specialty.title}</h3>
                      <p className="text-gray-600">{specialty.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Why Choose Our Artisans */}
        <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-white">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Pourquoi Choisir Nos Artisans ?
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: 'ri-medal-line',
                    title: 'Expertise Reconnue',
                    description: 'Artisans qualifiés avec plusieurs années d\'expérience'
                  },
                  {
                    icon: 'ri-shield-check-line',
                    title: 'Travail Garanti',
                    description: 'Garantie sur tous les travaux effectués'
                  },
                  {
                    icon: 'ri-price-tag-3-line',
                    title: 'Tarifs Transparents',
                    description: 'Devis clairs et prix compétitifs'
                  },
                  {
                    icon: 'ri-customer-service-2-line',
                    title: 'Service Client',
                    description: 'Support disponible pour toute question'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all text-center"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className={`${item.icon} text-3xl text-orange-500`}></i>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Artisans List Section */}
        <section id="artisans-section" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <AnimatedSection animation="fade-up">
              {/* Search Bar */}
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
                  <input
                    type="text"
                    placeholder="Rechercher un artisan, une spécialité..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <i className="ri-search-line absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Artisans Disponibles
                  <span className="ml-3 text-lg font-normal text-gray-600">
                    ({filteredProfessionals.length} {filteredProfessionals.length > 1 ? 'résultats' : 'résultat'})
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Filters Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 lg:sticky lg:top-24">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="ri-filter-line text-orange-500"></i>
                        Filtres
                      </h3>
                      {(selectedCategory || selectedPriceRange || selectedRating) && (
                        <button
                          onClick={handleResetFilters}
                          className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer whitespace-nowrap"
                        >
                          Effacer
                        </button>
                      )}
                    </div>

                    {/* Category Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="ri-service-line text-orange-500"></i>
                        Catégorie
                      </h4>
                      <div className="space-y-2">
                        {loadingCategories ? (
                          <div className="text-sm text-gray-500 p-2">
                            Chargement des catégories...
                          </div>
                        ) : (
                          <>
                            <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors">
                              <input
                                type="radio"
                                name="category"
                                value=""
                                checked={selectedCategory === ''}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                              />
                              <span className="text-sm text-gray-700">Toutes les catégories</span>
                            </label>
                            {categories.map((category) => (
                              <label
                                key={category.id}
                                className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
                              >
                                <input
                                  type="radio"
                                  name="category"
                                  value={category.name}
                                  checked={selectedCategory === category.name}
                                  onChange={(e) => setSelectedCategory(e.target.value)}
                                  className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700">{category.name}</span>
                              </label>
                            ))}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="ri-money-dollar-circle-line text-orange-500"></i>
                        Prix horaire
                      </h4>
                      <div className="space-y-2">
                        {priceRangeOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="priceRange"
                              value={option.value}
                              checked={selectedPriceRange === option.value}
                              onChange={(e) => setSelectedPriceRange(e.target.value)}
                              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Rating Filter */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <i className="ri-star-line text-orange-500"></i>
                        Note minimale
                      </h4>
                      <div className="space-y-2">
                        {ratingOptions.map((option) => (
                          <label
                            key={option.id}
                            className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors"
                          >
                            <input
                              type="radio"
                              name="rating"
                              value={option.value}
                              checked={selectedRating === option.value}
                              onChange={(e) => setSelectedRating(e.target.value)}
                              className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Artisans Grid */}
                <div className="lg:col-span-3">
                  {/* Loading State */}
                  {loading && (
                    <div className="flex justify-center items-center py-20">
                      <LoadingSpinner size="large" />
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="text-center py-20">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                        <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button
                          onClick={loadArtisans}
                          className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Réessayer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Artisans List */}
                  {!loading && !error && (
                    <>
                      {filteredProfessionals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredProfessionals.map((professional) => (
                            <ProfessionalCard
                              key={professional.id}
                              professional={professional}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-20">
                          <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
                          <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Aucun artisan trouvé
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Essayez de modifier vos critères de recherche
                          </p>
                          <button
                            onClick={handleResetFilters}
                            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                          >
                            Réinitialiser les filtres
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection animation="fade-up">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Vous êtes artisan professionnel ?
              </h2>
              <p className="text-xl text-orange-50 mb-8">
                Rejoignez notre plateforme et développez votre activité
              </p>
              <button
                onClick={handleBecomePartner}
                className="bg-white text-orange-500 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-lg whitespace-nowrap cursor-pointer"
              >
                Devenir Artisan Partenaire
              </button>
            </AnimatedSection>
          </div>
        </section>

        <Footer />
      </div>

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Notification Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <i className="ri-information-line text-orange-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Compte Professionnel Requis
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">{notificationMessage}</p>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  closeNotification();
                  setAuthModalMode('register');
                  setIsAuthModalOpen(true);
                }}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Créer un compte professionnel
              </button>
              <button
                onClick={closeNotification}
                className="text-gray-600 hover:text-gray-800 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
