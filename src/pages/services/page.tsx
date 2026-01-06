import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';
import AnimatedSection from '../../components/feature/AnimatedSection';
import ProfessionalCard from './components/ProfessionalCard';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import TestimonialsSection from '../../components/feature/TestimonialsSection';
import FilterBar from '../../components/base/FilterBar';
import ProfessionalsMap from '../../components/map/ProfessionalsMap';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../../components/booking/AuthModal';
import BookingModal from '../../components/booking/BookingModal';
import useGeolocation from '../../hooks/useGeolocation';

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  link: string | null;
  professional_count?: number;
  image?: string;
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    rating: '',
    location: '',
    availability: '',
    distance: '',
    district: ''
  });
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { latitude, longitude, error: geoError, loading: geoLoading, getLocation, calculateDistance } = useGeolocation();
  
  // Nouveaux états pour les localisations
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Charger les catégories depuis Supabase
  useEffect(() => {
    loadCategories();
    loadLocations();
  }, []);

  // Charger les professionnels depuis Supabase
  useEffect(() => {
    loadProfessionals();
  }, []);

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

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);

      // Fetch active service categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Count professionals for each category
      const categoriesWithCount = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('professional_profiles')
            .select('*', { count: 'exact', head: true })
            .or(`service_category.eq.${category.name},sub_category.eq.${category.name}`)
            .eq('is_active', true);

          // Map category to include icon, link, and image
          let icon = 'ri-service-line';
          let link: string | null = null;
          let image = '';

          switch (category.name.toLowerCase()) {
            case 'chauffeur':
              icon = 'ri-steering-2-line';
              link = '/services/chauffeurs';
              image = 'https://readdy.ai/api/search-image?query=professional%20chauffeur%20driver%20in%20elegant%20uniform%20beside%20luxury%20vehicle%2C%20premium%20transportation%20service%2C%20clean%20modern%20background&width=400&height=250&seq=cat-chauffeur&orientation=landscape';
              break;
            case 'technicien':
              icon = 'ri-tools-line';
              link = '/services/techniciens';
              image = 'https://readdy.ai/api/search-image?query=skilled%20technician%20with%20tools%20and%20equipment%2C%20professional%20repair%20service%2C%20modern%20technical%20background&width=400&height=250&seq=cat-technicien&orientation=landscape';
              break;
            case 'plomberie':
              icon = 'ri-drop-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=professional%20plumber%20installing%20modern%20bathroom%20fixtures%20and%20pipes%2C%20plumbing%20service%2C%20clean%20contemporary%20space&width=400&height=250&seq=cat-plomberie&orientation=landscape';
              break;
            case 'électricité':
              icon = 'ri-flashlight-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=professional%20electrician%20working%20on%20electrical%20panel%20and%20wiring%2C%20electrical%20service%2C%20modern%20technical%20background&width=400&height=250&seq=cat-electricite&orientation=landscape';
              break;
            case 'menuiserie':
              icon = 'ri-hammer-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=skilled%20carpenter%20crafting%20custom%20wooden%20furniture%2C%20woodworking%20service%2C%20modern%20workshop%20background&width=400&height=250&seq=cat-menuiserie&orientation=landscape';
              break;
            case 'peinture':
              icon = 'ri-paint-brush-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=professional%20painter%20applying%20paint%20on%20modern%20interior%20wall%2C%20painting%20service%2C%20clean%20contemporary%20space&width=400&height=250&seq=cat-peinture&orientation=landscape';
              break;
            case 'maçonnerie':
              icon = 'ri-building-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=skilled%20mason%20building%20brick%20wall%20structure%2C%20masonry%20construction%20service%2C%20modern%20building%20site&width=400&height=250&seq=cat-maconnerie&orientation=landscape';
              break;
            case 'climatisation':
              icon = 'ri-temp-cold-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=hvac%20technician%20installing%20modern%20air%20conditioning%20unit%2C%20climate%20control%20service%2C%20contemporary%20interior&width=400&height=250&seq=cat-climatisation&orientation=landscape';
              break;
            case 'ménage':
              icon = 'ri-brush-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20cleaning%20service%20worker%20with%20equipment%2C%20housekeeping%20service%2C%20clean%20modern%20interior&width=400&height=250&seq=cat-menage&orientation=landscape';
              break;
            case 'jardinage':
              icon = 'ri-plant-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20gardener%20with%20plants%20and%20tools%2C%20landscaping%20service%2C%20beautiful%20garden%20background&width=400&height=250&seq=cat-jardinage&orientation=landscape';
              break;
            case 'coiffure':
              icon = 'ri-scissors-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20hairstylist%20in%20modern%20salon%2C%20hair%20styling%20service%2C%20elegant%20salon%20interior&width=400&height=250&seq=cat-coiffure&orientation=landscape';
              break;
            case 'cuisine':
              icon = 'ri-restaurant-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20chef%20cooking%20in%20modern%20kitchen%2C%20culinary%20service%2C%20contemporary%20kitchen%20background&width=400&height=250&seq=cat-cuisine&orientation=landscape';
              break;
            case 'éducation':
              icon = 'ri-book-open-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20tutor%20teaching%20student%2C%20education%20service%2C%20modern%20learning%20environment&width=400&height=250&seq=cat-education&orientation=landscape';
              break;
            case 'santé':
              icon = 'ri-heart-pulse-line';
              image = 'https://readdy.ai/api/search-image?query=healthcare%20professional%20in%20medical%20setting%2C%20health%20service%2C%20modern%20medical%20facility&width=400&height=250&seq=cat-sante&orientation=landscape';
              break;
            case 'soudure':
              icon = 'ri-fire-line';
              link = '/services/artisans';
              image = 'https://readdy.ai/api/search-image?query=professional%20welder%20working%20with%20welding%20equipment%2C%20welding%20service%2C%20industrial%20workshop%20background&width=400&height=250&seq=cat-soudure&orientation=landscape';
              break;
            default:
              icon = 'ri-service-line';
              image = 'https://readdy.ai/api/search-image?query=professional%20service%20provider%20at%20work%2C%20general%20service%2C%20modern%20professional%20background&width=400&height=250&seq=cat-default&orientation=landscape';
          }

          return {
            id: category.id,
            name: category.name,
            description: category.description || '',
            icon,
            link,
            image,
            professional_count: count || 0
          };
        })
      );

      // Sort by professional count (descending) and take top 10
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

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch professionals with their profile data (avatar_url, full_name)
      const { data, error: fetchError } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!inner (
            full_name,
            avatar_url
          )
        `)
        .eq('is_active', true) // Only fetch active professionals
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
      console.error('Erreur lors du chargement des professionnels:', err);
      setError('Impossible de charger les professionnels. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string, categoryName: string, link: string | null) => {
    if (link) {
      window.REACT_APP_NAVIGATE(link);
    } else {
      setFilters({ ...filters, category: categoryName });
      setSelectedCategory(categoryName);
      // Scroll vers la section des professionnels
      const professionalsSection = document.getElementById('professionals-section');
      if (professionalsSection) {
        professionalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setFilters({
      category: '',
      priceRange: '',
      rating: '',
    });
  };

  // Créer les options de filtres dynamiquement depuis les localisations
  const filterLocations = useMemo(() => {
    const villes = locations.filter(loc => loc.type === 'ville');
    return villes.map(ville => ({
      id: ville.id,
      label: ville.name,
      value: ville.name
    }));
  }, [locations]);

  const filterDistricts = useMemo(() => {
    // Si une ville est sélectionnée, afficher uniquement ses quartiers
    if (filters.location) {
      const selectedVille = locations.find(loc => loc.name === filters.location && loc.type === 'ville');
      if (selectedVille) {
        const quartiers = locations.filter(loc => loc.type === 'quartier' && loc.parent_id === selectedVille.id);
        return quartiers.map(quartier => ({
          id: quartier.id,
          label: quartier.name,
          value: quartier.name
        }));
      }
    }
    
    // Sinon, afficher tous les quartiers
    const quartiers = locations.filter(loc => loc.type === 'quartier');
    return quartiers.map(quartier => ({
      id: quartier.id,
      label: quartier.name,
      value: quartier.name
    }));
  }, [locations, filters.location]);

  // Créer les options de catégories pour les filtres
  const filterCategories = useMemo(() => {
    return categories.map(cat => ({
      id: cat.id,
      label: cat.name,
      value: cat.name
    }));
  }, [categories]);

  const filterPriceRanges = [
    { id: '1', label: 'Moins de 2000 DJF/h', value: '0-2000' },
    { id: '2', label: '2000 - 4000 DJF/h', value: '2000-4000' },
    { id: '3', label: '4000 - 6000 DJF/h', value: '4000-6000' },
    { id: '4', label: 'Plus de 6000 DJF/h', value: '6000+' }
  ];

  const filterRatings = [
    { id: '1', label: '4.8+ étoiles', value: '4.8' },
    { id: '2', label: '4.5+ étoiles', value: '4.5' },
    { id: '3', label: '4+ étoiles', value: '4' },
    { id: '4', label: '3.5+ étoiles', value: '3.5' }
  ];

  const filterAvailability = [
    { id: '1', label: 'Disponible maintenant', value: 'available' },
    { id: '2', label: 'Tous les professionnels', value: 'all' }
  ];

  const filterDistances = [
    { id: '1', label: 'Moins de 2 km', value: '2' },
    { id: '2', label: 'Moins de 5 km', value: '5' },
    { id: '3', label: 'Moins de 10 km', value: '10' },
    { id: '4', label: 'Moins de 20 km', value: '20' },
    { id: '5', label: 'Toutes distances', value: '' }
  ];

  const filteredProfessionals = useMemo(() => {
    let filtered = professionals.filter(prof => {
      if (searchQuery && !prof.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prof.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !prof.service_category?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prof.sub_category?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !prof.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.category) {
        const categoryMatch = prof.service_category?.toLowerCase() === filters.category.toLowerCase() ||
                             prof.sub_category?.toLowerCase() === filters.category.toLowerCase();
        if (!categoryMatch) return false;
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
        const rate = Number(prof.hourly_rate) || 0;
        if (max) {
          if (rate < parseInt(min) || rate > parseInt(max)) return false;
        } else {
          if (rate < parseInt(min)) return false;
        }
      }

      if (filters.rating && (Number(prof.rating) || 0) < parseFloat(filters.rating)) {
        return false;
      }

      // Filtre par localisation - recherche exacte et partielle
      if (filters.location) {
        const profLocation = (prof.location || prof.city || '').toLowerCase().trim();
        const filterLocation = filters.location.toLowerCase().trim();
        
        // Vérifier si la localisation du professionnel contient ou correspond au filtre
        const locationMatch = profLocation.includes(filterLocation) || 
                             filterLocation.includes(profLocation) ||
                             profLocation === filterLocation;
        
        if (!locationMatch) {
          return false;
        }
      }

      // Filtre par quartier
      if (filters.district) {
        const profDistrict = (prof.district || '').toLowerCase().trim();
        const filterDistrict = filters.district.toLowerCase().trim();
        
        if (profDistrict !== filterDistrict) {
          return false;
        }
      }

      // Availability filter - based on is_active field
      if (filters.availability === 'available' && !prof.is_active) {
        return false;
      }

      // Filtre par distance - nécessite la géolocalisation de l'utilisateur
      if (filters.distance && latitude && longitude) {
        if (prof.latitude && prof.longitude) {
          const distance = calculateDistance(latitude, longitude, prof.latitude, prof.longitude);
          const maxDistance = parseFloat(filters.distance);
          
          if (distance > maxDistance) {
            return false;
          }
        } else {
          return false;
        }
      }

      return true;
    });

    // Ajouter le calcul de distance à tous les professionnels si la localisation est disponible
    if (latitude && longitude) {
      filtered = filtered.map(prof => {
        if (prof.latitude && prof.longitude) {
          return {
            ...prof,
            distance: calculateDistance(latitude, longitude, prof.latitude, prof.longitude)
          };
        }
        return prof;
      });
    }

    // Tri
    if (sortBy === 'distance' && latitude && longitude) {
      filtered = filtered.sort((a, b) => {
        const distA = a.distance ?? Infinity;
        const distB = b.distance ?? Infinity;
        return distA - distB;
      });
    } else if (sortBy === 'rating') {
      // Sort by rating first, then by is_active status
      filtered = filtered.sort((a, b) => {
        // Active professionals first
        if (a.is_active !== b.is_active) {
          return b.is_active ? 1 : -1;
        }
        // Then by rating
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (sortBy === 'price') {
      filtered = filtered.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
    }

    return filtered;
  }, [searchQuery, filters, sortBy, professionals, latitude, longitude, calculateDistance]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBookingClick = (professional: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Transform professional data to match the format expected by BookingModal
    const transformedProfessional = {
      id: professional.id,
      name: professional.full_name || professional.business_name || 'Professionnel',
      service: professional.business_name || professional.service_category,
      category: professional.service_category?.toLowerCase() || '',
      rating: professional.rating || 0,
      reviews: professional.total_reviews || 0,
      price: professional.hourly_rate || 0,
      priceDisplay: professional.hourly_rate ? `${professional.hourly_rate} FDJ/h` : 'Sur devis',
      location: professional.city || professional.location || 'Djibouti',
      latitude: professional.latitude || 11.8251,
      longitude: professional.longitude || 42.5903,
      image: professional.avatar_url || null,
      verified: professional.is_verified || false,
      responseTime: professional.response_time || '< 2h',
      availability: professional.is_active ? 'Disponible' : 'Indisponible',
      skills: professional.skills || [],
      experience: professional.years_of_experience ? `${professional.years_of_experience} ans` : 'Expérimenté',
      languages: ['Français', 'Arabe'],
      description: professional.description || '',
      phone: professional.phone || '',
      business_name: professional.business_name || '',
      hourly_rate: professional.hourly_rate || 0,
      service_category: professional.service_category || '',
      full_name: professional.full_name || '',
      avatar_url: professional.avatar_url || null,
      is_verified: professional.is_verified || false,
      total_reviews: professional.total_reviews || 0,
      experience_years: professional.experience_years || professional.years_of_experience || 0
    };

    setSelectedProfessional(transformedProfessional);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedProfessional(null);
    alert('Réservation effectuée avec succès! Vous pouvez la consulter dans votre tableau de bord.');
  };

  const scrollToProfessionals = () => {
    const professionalsSection = document.getElementById('professionals-section');
    if (professionalsSection) {
      professionalsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToSearch = () => {
    const searchSection = document.getElementById('search-section');
    if (searchSection) {
      searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Focus on search input after scroll
      setTimeout(() => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 500);
    }
  };

  const handleProfessionalMapClick = (professional: any) => {
    setSelectedProfessional(professional);
    setShowBookingModal(true);
    setShowMap(false);
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead
        title="Services Professionnels Djibouti | Chauffeurs, Techniciens, Artisans"
        description="Découvrez tous les services professionnels disponibles à Djibouti. Chauffeurs, techniciens, artisans qualifiés pour tous vos besoins. Réservation en ligne facile."
        keywords="services Djibouti, chauffeur Djibouti, technicien Djibouti, artisan Djibouti, professionnel Djibouti"
        canonical="/services"
      />
      
      <div className="min-h-screen bg-gray-50 font-inter pt-16 sm:pt-20">
        <Header />
        
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
                  <strong>Services Professionnels à Djibouti</strong>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-teal-50">
                  Trouvez et réservez les meilleurs professionnels pour tous vos besoins
                </p>
              </AnimatedSection>

              <AnimatedSection animation="slideUp" delay={200}>
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un professionnel ou un service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 text-base sm:text-lg border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-white/70"
                    />
                    <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 text-xl"></i>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={getLocation}
                      disabled={geoLoading}
                      className="flex-1 px-6 py-3 bg-white text-teal-700 hover:bg-teal-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      {geoLoading ? (
                        <LoadingSpinner size="sm" color="text-teal-700" />
                      ) : (
                        <i className="ri-map-pin-line"></i>
                      )}
                      Professionnels près de moi
                    </button>
                    
                    <button
                      onClick={() => setShowFilters(true)}
                      className="lg:hidden flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      <i className="ri-filter-line"></i>
                      Filtres
                    </button>
                  </div>

                  {geoError && (
                    <div className="mt-4 p-4 bg-amber-500/20 backdrop-blur-sm border border-amber-300/30 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-100">
                        <i className="ri-alert-line"></i>
                        <span className="text-sm sm:text-base">{geoError}</span>
                      </div>
                    </div>
                  )}

                  {latitude && longitude && (
                    <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                      <div className="flex items-center gap-2 text-white">
                        <i className="ri-map-pin-line"></i>
                        <span className="text-sm sm:text-base">Position détectée - Filtrage par distance disponible</span>
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            </div>
          </div>
        </AnimatedSection>

        {/* Service Categories */}
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <AnimatedSection animation="slideUp">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                <strong>Catégories de Services</strong>
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Choisissez le type de service adapté à vos besoins
              </p>
            </div>
          </AnimatedSection>

          {loadingCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-40 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
              {categories.map((category, index) => (
                <AnimatedSection key={category.id} animation="slideUp" delay={index * 100}>
                  <div
                    onClick={() => handleCategoryClick(category.id, category.name, category.link)}
                    className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-2 text-white mb-1">
                          <i className={`${category.icon} text-xl`}></i>
                          <h3 className="font-bold text-lg">{category.name}</h3>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-teal-600">
                          {category.professional_count} professionnel{category.professional_count !== 1 ? 's' : ''}
                        </span>
                        <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all"></i>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>

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
                    districts={filterDistricts}
                    onFilterChange={setFilters}
                    showDistanceFilter={!!(latitude && longitude)}
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
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 touch-manipulation cursor-pointer"
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
                    districts={filterDistricts}
                    onFilterChange={(newFilters) => {
                      setFilters(newFilters);
                      setShowFilters(false);
                    }}
                    showDistanceFilter={!!(latitude && longitude)}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>

            {/* Professionals List */}
            <div className="flex-1">
              <AnimatedSection animation="slideUp">
                <div id="professionals-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Professionnels disponibles ({filteredProfessionals.length})
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        showMap
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <i className={`${showMap ? 'ri-list-check' : 'ri-map-pin-line'}`}></i>
                      {showMap ? 'Vue liste' : 'Vue carte'}
                    </button>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base cursor-pointer"
                    >
                      {latitude && longitude && (
                        <option value="distance">Trier par proximité</option>
                      )}
                      <option value="rating">Trier par note</option>
                      <option value="price">Trier par prix</option>
                    </select>
                  </div>
                </div>
              </AnimatedSection>

              {/* Carte interactive */}
              {showMap && (
                <AnimatedSection animation="fadeIn" className="mb-6">
                  <ProfessionalsMap
                    professionals={filteredProfessionals}
                    userLocation={latitude && longitude ? { latitude, longitude } : undefined}
                    onProfessionalClick={handleProfessionalMapClick}
                    height="600px"
                  />
                </AnimatedSection>
              )}

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <LoadingSpinner size="large" />
                </div>
              ) : error ? (
                <div className="text-center py-20">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                      onClick={loadProfessionals}
                      className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              ) : filteredProfessionals.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredProfessionals.map((professional, index) => (
                    <AnimatedSection key={professional.id} animation="slideUp" delay={index * 100}>
                      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-48 h-48 sm:h-auto relative flex-shrink-0">
                            <img
                              src={professional.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.business_name?.substring(0, 2) || 'PR')}&size=300&background=14b8a6&color=fff&bold=true&length=2`}
                              alt={professional.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.business_name?.substring(0, 2) || 'PR')}&size=300&background=14b8a6&color=fff&bold=true&length=2`;
                              }}
                            />
                            {professional.is_verified && (
                              <div className="absolute top-3 right-3 bg-teal-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <i className="ri-verified-badge-line"></i>
                                Vérifié
                              </div>
                            )}
                            <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
                              professional.is_active 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-500 text-white'
                            }`}>
                              {professional.is_active ? 'Disponible' : 'Indisponible'}
                            </div>
                          </div>

                          <div className="flex-1 p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{professional.full_name}</h3>
                                <p className="text-teal-600 font-medium mb-2">{professional.service_category}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                  <div className="flex items-center gap-1">
                                    <i className="ri-star-fill text-amber-400"></i>
                                    <span className="font-medium">{Number(professional.rating || 0).toFixed(1)}</span>
                                    <span>({professional.total_reviews || 0} avis)</span>
                                  </div>
                                  {professional.location && (
                                    <div className="flex items-center gap-1">
                                      <i className="ri-map-pin-line text-gray-400"></i>
                                      <span>{professional.location}</span>
                                      {professional.district && (
                                        <span className="text-gray-400">• {professional.district}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right">
                                <div className="text-2xl font-bold text-teal-600 mb-1">
                                  {Number(professional.hourly_rate || 0).toFixed(0)} DJF/h
                                </div>
                                {professional.response_time && (
                                  <div className="text-sm text-gray-500">Temps de réponse: {professional.response_time}</div>
                                )}
                              </div>
                            </div>

                            {professional.description && (
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {professional.description}
                              </p>
                            )}

                            {professional.years_of_experience && (
                              <div className="flex items-center gap-2 text-sm mb-4">
                                <i className="ri-time-line text-teal-600"></i>
                                <span className="text-gray-700">Expérience: <strong>{professional.years_of_experience} ans</strong></span>
                              </div>
                            )}

                            {professional.distance !== undefined && (
                              <div className="mb-4 flex items-center gap-2 text-sm">
                                <i className="ri-map-pin-distance-line text-teal-600"></i>
                                <span className="text-gray-700">
                                  À <strong>{professional.distance.toFixed(1)} km</strong> de vous
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2">
                              <Link
                                to={`/professionnel/${professional.id}`}
                                className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-user-line mr-2"></i>
                                Voir le profil
                              </Link>
                              <button
                                onClick={() => handleBookingClick(professional)}
                                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                              >
                                <i className="ri-calendar-check-line mr-2"></i>
                                Réserver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
              ) : (
                <AnimatedSection animation="fadeIn" className="text-center py-16">
                  <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun professionnel trouvé</h3>
                  <p className="text-base text-gray-500 mb-6">Essayez de modifier vos critères de recherche</p>
                  <button
                    onClick={handleResetFilters}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                </AnimatedSection>
              )}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <TestimonialsSection 
          title="Avis de nos clients"
          subtitle="Découvrez pourquoi nos clients nous font confiance pour leurs besoins quotidiens"
          limit={3}
        />

        <Footer />
      </div>

      {/* Booking Modal */}
      <BookingModal
        professional={selectedProfessional}
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedProfessional(null);
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
    </>
  );
}
