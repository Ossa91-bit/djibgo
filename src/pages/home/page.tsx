import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import AnimatedSection from '../../components/feature/AnimatedSection';
import ServiceCard from '../services/components/ServiceCard';
import ProfessionalCard from '../services/components/ProfessionalCard';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import LazyImage from '../../components/base/LazyImage';
import AuthModal from '../../components/auth/AuthModal';
import BookingModal from '../../components/booking/BookingModal';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import TestimonialsSection from '../../components/feature/TestimonialsSection';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [featuredProfessionals, setFeaturedProfessionals] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const { preloadImages, measurePerformance } = usePerformance();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    loadServices();
    loadFeaturedProfessionals();
    
    // Preload critical images for better performance
    const criticalImages = [
      'https://readdy.ai/api/search-image?query=modern%20Djibouti%20cityscape%20with%20professional%20services%2C%20bustling%20urban%20environment%2C%20quality%20infrastructure%2C%20economic%20development%2C%20bright%20daylight&width=1200&height=600&seq=hero_bg3&orientation=landscape'
    ];
    
    preloadImages(criticalImages);

    // Measure initial performance
    const metrics = measurePerformance();
    console.log('Page Performance:', metrics);
  }, [preloadImages, measurePerformance]);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      
      // Fetch all active service categories
      const { data: categories, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Count bookings and professionals for each category
      const servicesWithStats = await Promise.all(
        (categories || []).map(async (category) => {
          // Count bookings for this category
          const { data: bookings, error: bookingError } = await supabase
            .from('bookings')
            .select('id, professional_id')
            .not('professional_id', 'is', null);

          if (bookingError) {
            console.error('Error fetching bookings:', bookingError);
          }

          // Get all professionals to match categories
          const { data: allProfessionals, error: profError } = await supabase
            .from('professional_profiles')
            .select('id, service_category, hourly_rate')
            .eq('is_active', true);

          if (profError) {
            console.error('Error fetching professionals:', profError);
          }

          // Filter professionals that match this category
          const matchingProfessionals = (allProfessionals || []).filter(prof => {
            const profCategory = (prof.service_category || '').toLowerCase().trim();
            const categoryName = category.name.toLowerCase().trim();
            return profCategory === categoryName || 
                   profCategory.includes(categoryName) || 
                   categoryName.includes(profCategory);
          });

          const professionalIds = matchingProfessionals.map(p => p.id);

          // Count bookings for professionals in this category
          const bookingCount = (bookings || []).filter(booking => 
            professionalIds.includes(booking.professional_id)
          ).length;

          const professionalCount = matchingProfessionals.length;

          // Calculate average price for the category
          const avgRate = matchingProfessionals.length > 0
            ? Math.round(matchingProfessionals.reduce((sum, p) => sum + (p.hourly_rate || 0), 0) / matchingProfessionals.length)
            : 0;

          return {
            id: category.id,
            name: category.name,
            icon: getIconForCategory(category.name),
            description: category.description || `Services professionnels de ${category.name.toLowerCase()}`,
            professionalCount: professionalCount,
            bookingCount: bookingCount,
            avgPrice: avgRate > 0 ? `${avgRate} DJF/h` : 'Sur devis',
            image: getCategoryImage(category.name)
          };
        })
      );

      // Sort by booking count (most demanded) and filter out services with 0 professionals
      const topServices = servicesWithStats
        .filter(service => service.professionalCount > 0) // Only show services with at least 1 professional
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 4);

      setServices(topServices);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadFeaturedProfessionals = async () => {
    try {
      setLoadingProfessionals(true);
      
      // Fetch ONLY active professionals (is_active = true)
      const { data: professionals, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('is_active', true); // Only get active professionals

      if (error) throw error;

      // Calculate real ratings from reviews table for each professional
      const professionalsWithRealRatings = await Promise.all(
        (professionals || []).map(async (prof) => {
          // Get real review count and average rating from reviews table
          const { data: reviewsData, error: reviewError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('professional_id', prof.id);

          if (reviewError) {
            console.error('Error fetching reviews:', reviewError);
          }

          const realReviewCount = reviewsData?.length || 0;
          const realAverageRating = realReviewCount > 0
            ? (reviewsData?.reduce((sum, review) => sum + review.rating, 0) || 0) / realReviewCount
            : 0;

          return {
            ...prof,
            total_reviews: realReviewCount,
            rating: parseFloat(realAverageRating.toFixed(1))
          };
        })
      );

      // Sort by: 1. is_active (true first), 2. rating (high to low), 3. review count (high to low)
      // Only show professionals with reviews
      const topProfessionals = professionalsWithRealRatings
        .filter(prof => prof.is_active && prof.total_reviews > 0 && prof.rating > 0) // Only active professionals with reviews
        .sort((a, b) => {
          // First sort by rating (descending)
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          // Then by review count (descending)
          return b.total_reviews - a.total_reviews;
        })
        .slice(0, 5); // Top 5 professionals

      // Transform data to match component expectations
      const transformedProfessionals = topProfessionals.map(prof => ({
        id: prof.id,
        name: prof.full_name || prof.business_name || 'Professionnel',
        service: prof.business_name || prof.service_category,
        category: prof.service_category?.toLowerCase() || '',
        rating: prof.rating, // Real rating from reviews
        reviews: prof.total_reviews, // Real review count
        price: prof.hourly_rate || 0,
        priceDisplay: prof.hourly_rate ? `${prof.hourly_rate} FDJ/h` : 'Sur devis',
        location: prof.city || 'Djibouti',
        latitude: prof.latitude || 11.8251,
        longitude: prof.longitude || 42.5903,
        image: prof.avatar_url || null,
        verified: prof.is_verified || false,
        responseTime: '< 2h',
        availability: prof.is_active ? 'Disponible' : 'Indisponible', // Based on is_active field
        skills: prof.skills || [],
        experience: prof.experience_years ? `${prof.experience_years} ans` : 'Expérimenté',
        languages: ['Français', 'Arabe'],
        description: prof.description || '',
        phone: prof.phone || '',
        business_name: prof.business_name || '',
        hourly_rate: prof.hourly_rate || 0,
        service_category: prof.service_category || '',
        sub_category: prof.sub_category || '',
        full_name: prof.full_name || '',
        avatar_url: prof.avatar_url || null,
        is_verified: prof.is_verified || false,
        is_active: prof.is_active, // Include is_active field
        total_reviews: prof.total_reviews, // Real count
        experience_years: prof.experience_years || 0
      }));

      setFeaturedProfessionals(transformedProfessionals);
    } catch (error) {
      console.error('Error loading featured professionals:', error);
    } finally {
      setLoadingProfessionals(false);
    }
  };

  const getIconForCategory = (categoryName: string): string => {
    const iconMap: { [key: string]: string } = {
      'Plomberie': 'ri-drop-line',
      'Électricité': 'ri-flashlight-line',
      'Ménage': 'ri-home-smile-line',
      'Jardinage': 'ri-leaf-line',
      'Menuiserie': 'ri-hammer-line',
      'Climatisation': 'ri-temp-cold-line',
      'Peinture': 'ri-paint-brush-line',
      'Maçonnerie': 'ri-building-line',
      'Soudure': 'ri-tools-line'
    };
    return iconMap[categoryName] || 'ri-tools-line';
  };

  const getCategoryImage = (categoryName: string): string => {
    const imageMap: { [key: string]: string } = {
      'Plomberie': 'https://readdy.ai/api/search-image?query=modern%20plumbing%20tools%20and%20equipment%20organized%20in%20professional%20workspace%2C%20clean%20bright%20environment%2C%20quality%20plumbing%20supplies%2C%20expert%20craftsmanship%20focus&width=400&height=250&seq=plumb3&orientation=landscape',
      'Électricité': 'https://readdy.ai/api/search-image?query=electrical%20installation%20tools%20and%20modern%20electrical%20components%20in%20organized%20technical%20workspace%2C%20professional%20lighting%2C%20safety%20equipment%20visible&width=400&height=250&seq=elec3&orientation=landscape',
      'Ménage': 'https://readdy.ai/api/search-image?query=professional%20cleaning%20supplies%20and%20equipment%20arranged%20neatly%2C%20bright%20clean%20environment%2C%20quality%20cleaning%20products%2C%20organized%20service%20setup&width=400&height=250&seq=clean3&orientation=landscape',
      'Jardinage': 'https://readdy.ai/api/search-image?query=professional%20gardening%20tools%20and%20plants%20in%20bright%20outdoor%20setting%2C%20organized%20garden%20workspace%2C%20quality%20horticultural%20equipment%2C%20natural%20green%20environment&width=400&height=250&seq=garden3&orientation=landscape',
      'Menuiserie': 'https://readdy.ai/api/search-image?query=professional%20woodworking%20tools%20and%20materials%20in%20organized%20carpentry%20workshop%2C%20quality%20wood%20pieces%2C%20expert%20craftsmanship%20environment&width=400&height=250&seq=carpentry3&orientation=landscape',
      'Climatisation': 'https://readdy.ai/api/search-image?query=modern%20air%20conditioning%20units%20and%20hvac%20equipment%20in%20professional%20technical%20workspace%2C%20clean%20installation%20tools%2C%20climate%20control%20systems&width=400&height=250&seq=hvac3&orientation=landscape',
      'Peinture': 'https://readdy.ai/api/search-image?query=professional%20painting%20supplies%20brushes%20rollers%20and%20color%20samples%20organized%20workspace%2C%20quality%20paint%20products%2C%20artistic%20craftsmanship%20setup&width=400&height=250&seq=painting3&orientation=landscape',
      'Maçonnerie': 'https://readdy.ai/api/search-image?query=professional%20masonry%20tools%20bricks%20and%20construction%20materials%20organized%20workspace%2C%20quality%20building%20supplies%2C%20expert%20construction%20environment&width=400&height=250&seq=masonry3&orientation=landscape',
      'Soudure': 'https://readdy.ai/api/search-image?query=professional%20welding%20equipment%20and%20metal%20working%20tools%20in%20organized%20technical%20workspace%2C%20safety%20gear%20visible%2C%20expert%20metalwork%20environment&width=400&height=250&seq=welding3&orientation=landscape'
    };
    return imageMap[categoryName] || 'https://readdy.ai/api/search-image?query=professional%20service%20tools%20and%20equipment%20organized%20workspace%2C%20quality%20supplies%2C%20expert%20craftsmanship%20environment&width=400&height=250&seq=default3&orientation=landscape';
  };

  const getDefaultAvatar = (name: string): string => {
    const seed = name || 'default';
    return `https://readdy.ai/api/search-image?query=professional%20service%20provider%20portrait%20confident%20skilled%20worker%20clean%20background%20trustworthy%20appearance&width=300&height=300&seq=avatar-${seed}&orientation=squarish`;
  };

  const handleSearch = async () => {
    setIsLoading(true);
    
    // Simulate search with performance optimization
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsLoading(false);
    
    // Navigate to services page with search params
    window.location.href = `/services?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(selectedLocation)}`;
  };

  const handleBookingClick = async (serviceCategory: string) => {
    // Check if user is logged in
    if (!user || !profile) {
      // Show auth modal if not logged in
      setShowAuthModal(true);
      return;
    }

    // If logged in, find a professional from this category and show booking modal
    try {
      const { data: professionals, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('service_category', serviceCategory)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (professionals) {
        const transformedProfessional = {
          id: professionals.id,
          name: professionals.full_name || professionals.business_name || 'Professionnel',
          service: professionals.business_name || professionals.service_category,
          category: professionals.service_category?.toLowerCase() || '',
          rating: professionals.rating || 0,
          reviews: professionals.total_reviews || 0,
          price: professionals.hourly_rate || 0,
          priceDisplay: professionals.hourly_rate ? `${professionals.hourly_rate} FDJ/h` : 'Sur devis',
          location: professionals.city || 'Djibouti',
          latitude: professionals.latitude || 11.8251,
          longitude: professionals.longitude || 42.5903,
          image: professionals.avatar_url || null, // Use uploaded avatar
          verified: professionals.is_verified || false,
          responseTime: '< 2h',
          availability: 'Disponible',
          skills: professionals.skills || [],
          experience: professionals.experience_years ? `${professionals.experience_years} ans` : 'Expérimenté',
          languages: ['Français', 'Arabe'],
          description: professionals.description || '',
          phone: professionals.phone || '',
          business_name: professionals.business_name || '',
          hourly_rate: professionals.hourly_rate || 0,
          service_category: professionals.service_category || '',
          full_name: professionals.full_name || '',
          avatar_url: professionals.avatar_url || null, // Include avatar_url
          is_verified: professionals.is_verified || false,
          total_reviews: professionals.total_reviews || 0,
          experience_years: professionals.experience_years || 0
        };

        setSelectedProfessional(transformedProfessional);
        setShowBookingModal(true);
      }
    } catch (error) {
      console.error('Error loading professional:', error);
      // If no professional found, redirect to services page
      window.location.href = `/services?category=${encodeURIComponent(serviceCategory)}`;
    }
  };

  const handleAuthSuccess = () => {
    // Close auth modal after successful login
    setShowAuthModal(false);
    // Optionally show a success message or redirect
  };

  return (
    <div className="min-h-screen bg-white font-inter">
      <Header />

      {/* Hero Section with optimized background image */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <LazyImage
            src="https://readdy.ai/api/search-image?query=modern%20Djibouti%20cityscape%20with%20professional%20services%2C%20bustling%20urban%20environment%2C%20quality%20infrastructure%2C%20economic%20development%2C%20bright%20daylight&width=1920&height=1080&seq=hero_bg3&orientation=landscape"
            alt="Services professionnels à Djibouti - DjibGo plateforme de réservation"
            className="w-full h-full"
            priority={true}
            quality={85}
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center text-white w-full">
          <AnimatedSection animation="fadeIn" className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Trouvez les meilleurs <strong>professionnels</strong> à{' '}
              <strong className="text-orange-400">Djibouti</strong>
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8 text-gray-200 max-w-3xl mx-auto">
              Plus de <strong>150 professionnels vérifiés</strong> prêts à vous aider. 
              Réservation en ligne, paiement sécurisé, satisfaction garantie à <strong>Djibouti</strong>.
            </p>

            {/* Barre de recherche optimisée */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Que recherchez-vous ?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      aria-label="Rechercher un service professionnel à Djibouti"
                    />
                    <i className="ri-search-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
                  </div>
                  
                  <div className="flex-1 lg:flex-none lg:w-64 relative">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-4 py-3 sm:py-4 text-base sm:text-lg text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      aria-label="Sélectionner un quartier à Djibouti"
                    >
                      <option value="">Tous les quartiers</option>
                      <option value="quartier-1">Quartier 1</option>
                      <option value="quartier-2">Quartier 2</option>
                      <option value="quartier-3">Quartier 3</option>
                      <option value="quartier-4">Quartier 4</option>
                      <option value="quartier-5">Quartier 5</option>
                    </select>
                    <i className="ri-map-pin-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
                  </div>
                  
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="lg:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                    aria-label="Rechercher des professionnels à Djibouti"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="sm" color="text-white" />
                    ) : (
                      <>
                        <i className="ri-search-line text-lg"></i>
                        <span className="hidden sm:inline">Rechercher</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-12">
              {[
                { number: '150+', label: 'Professionnels' },
                { number: '1200+', label: 'Clients satisfaits' },
                { number: '98%', label: 'Satisfaction' },
                { number: '24/7', label: 'Support' }
              ].map((stat, index) => (
                <AnimatedSection key={index} animation="slideUp" delay={index * 200}>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-400 mb-1 sm:mb-2">
                      <strong>{stat.number}</strong>
                    </div>
                    <div className="text-sm sm:text-base text-gray-300">
                      {stat.label}
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Services les plus demandés à <strong>Djibouti</strong>
              </h3>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Découvrez nos <strong>services professionnels</strong> les plus populaires avec des professionnels certifiés à <strong>Djibouti</strong>
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {loadingServices ? (
              // Loading state
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))
            ) : (
              services.map((service, index) => (
                <AnimatedSection key={service.id} animation="slideUp" delay={index * 150}>
                  <article className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                    <div className="h-40 w-full overflow-hidden">
                      <LazyImage
                        src={service.image}
                        alt={`Service ${service.name} à Djibouti - ${service.description}`}
                        className="w-full h-full"
                        quality={85}
                        width={400}
                        height={250}
                        objectFit="cover"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center mb-3">
                        <i className={`${service.icon} text-2xl text-orange-500 mr-3`} aria-hidden="true"></i>
                        <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                      </div>
                      <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div className="flex items-center gap-1 text-gray-700">
                          <i className="ri-user-line text-orange-500" aria-hidden="true"></i>
                          <span className="font-medium">{service.professionalCount}</span>
                          <span className="text-gray-500">professionnel{service.professionalCount > 1 ? 's' : ''}</span>
                        </div>
                        <span className="font-semibold text-orange-500">{service.avgPrice}</span>
                      </div>
                      <button
                        onClick={() => handleBookingClick(service.name)}
                        className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                        aria-label={`Réserver un ${service.name} à Djibouti`}
                      >
                        {user ? 'Réserver ce professionnel' : 'Se connecter pour réserver'}
                      </button>
                    </div>
                  </article>
                </AnimatedSection>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Professionnels recommandés */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                Professionnels recommandés à <strong>Djibouti</strong>
              </h3>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                Nos meilleurs <strong>professionnels vérifiés</strong>, notés par la communauté à <strong>Djibouti</strong>
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {loadingProfessionals ? (
              // Loading state
              Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-gray-300 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : featuredProfessionals.length > 0 ? (
              featuredProfessionals.map((professional, index) => (
                <AnimatedSection key={professional.id} animation="slideUp" delay={index * 200}>
                  <ProfessionalCard professional={professional} />
                </AnimatedSection>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <i className="ri-user-search-line text-6xl text-gray-300 mb-4" aria-hidden="true"></i>
                <p className="text-gray-600 text-lg">Aucun professionnel avec des avis disponible pour le moment</p>
              </div>
            )}
          </div>

          <AnimatedSection animation="slideUp" delay={400}>
            <div className="text-center mt-8 sm:mt-12">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                aria-label="Voir tous les professionnels à Djibouti"
              >
                Voir tous les professionnels
                <i className="ri-arrow-right-line" aria-hidden="true"></i>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <TestimonialsSection />

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
      />

      {/* Booking Modal */}
      {selectedProfessional && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedProfessional(null);
          }}
          professional={selectedProfessional}
        />
      )}
    </div>
  );
}
