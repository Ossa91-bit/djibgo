import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/feature/Header';
import Footer from '../../../components/feature/Footer';
import FilterBar from '../../../components/base/FilterBar';
import LoadingSpinner from '../../../components/base/LoadingSpinner';
import AnimatedSection from '../../../components/feature/AnimatedSection';
import BookingModal from '../../../components/booking/BookingModal';
import AuthModal from '../../../components/booking/AuthModal';
import useGeolocation from '../../../hooks/useGeolocation';
import { useAuth } from '../../../hooks/useAuth';

interface Technician {
  id: number;
  name: string;
  service: string;
  category: string;
  rating: number;
  reviews: number;
  price: number;
  priceDisplay: string;
  location: string;
  latitude: number;
  longitude: number;
  image: string;
  verified: boolean;
  responseTime: string;
  availability: string;
  experience: string;
  certifications: string[];
  specialties: string[];
  distance?: number;
}

export default function TechniciensPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    priceRange: '',
    rating: ''
  });
  const { latitude, longitude, error, loading, getLocation, calculateDistance } = useGeolocation();

  const technicians: Technician[] = [
    {
      id: 201,
      name: 'Ahmed Hassan',
      service: 'Électricien Professionnel',
      category: 'electrician',
      rating: 4.9,
      reviews: 87,
      price: 45,
      priceDisplay: '45 DJF/h',
      location: 'Quartier 1',
      latitude: 11.8251,
      longitude: 42.5903,
      image: 'https://readdy.ai/api/search-image?query=professional%20african%20electrician%20in%20work%20uniform%20with%20electrical%20tools%20and%20equipment%2C%20experienced%20technician%20portrait%2C%20safety%20gear%20visible%2C%20modern%20electrical%20workshop%20background%20with%20organized%20tools%20and%20cables&width=300&height=300&seq=tech201&orientation=squarish',
      verified: true,
      responseTime: '< 2h',
      availability: 'Disponible',
      experience: '15 ans',
      certifications: ['Certification électrique', 'Habilitation basse tension', 'Formation sécurité'],
      specialties: ['Installation électrique', 'Dépannage urgent', 'Mise aux normes', 'Tableaux électriques']
    },
    {
      id: 202,
      name: 'Mohamed Ali',
      service: 'Plombier Expert',
      category: 'plumber',
      rating: 4.8,
      reviews: 124,
      price: 40,
      priceDisplay: '40 DJF/h',
      location: 'Quartier 3',
      latitude: 11.8201,
      longitude: 42.5953,
      image: 'https://readdy.ai/api/search-image?query=skilled%20african%20plumber%20in%20professional%20work%20clothes%20holding%20plumbing%20tools%2C%20expert%20technician%20portrait%2C%20pipe%20wrench%20and%20equipment%20visible%2C%20clean%20plumbing%20workshop%20background%20with%20organized%20supplies&width=300&height=300&seq=tech202&orientation=squarish',
      verified: true,
      responseTime: '< 1h',
      availability: 'Disponible',
      experience: '12 ans',
      certifications: ['Certification plomberie', 'Gaz naturel', 'Assainissement'],
      specialties: ['Fuites d\'eau', 'Installation sanitaire', 'Débouchage', 'Chauffe-eau']
    },
    {
      id: 203,
      name: 'Ibrahim Youssouf',
      service: 'Climatisation & Réfrigération',
      category: 'hvac',
      rating: 4.9,
      reviews: 96,
      price: 50,
      priceDisplay: '50 DJF/h',
      location: 'Quartier 5',
      latitude: 11.8351,
      longitude: 42.6003,
      image: 'https://readdy.ai/api/search-image?query=professional%20african%20HVAC%20technician%20in%20uniform%20working%20with%20air%20conditioning%20unit%2C%20cooling%20system%20specialist%20portrait%2C%20technical%20equipment%20and%20gauges%20visible%2C%20modern%20climate%20control%20workshop%20background&width=300&height=300&seq=tech203&orientation=squarish',
      verified: true,
      responseTime: '< 3h',
      availability: 'Disponible',
      experience: '10 ans',
      certifications: ['Frigoriste certifié', 'Manipulation fluides frigorigènes', 'Climatisation'],
      specialties: ['Installation climatisation', 'Maintenance préventive', 'Réparation urgente', 'Chambres froides']
    },
    {
      id: 204,
      name: 'Abdoulkader Omar',
      service: 'Menuisier Ébéniste',
      category: 'carpenter',
      rating: 4.8,
      reviews: 73,
      price: 35,
      priceDisplay: '35 DJF/h',
      location: 'Quartier 2',
      latitude: 11.8151,
      longitude: 42.5803,
      image: 'https://readdy.ai/api/search-image?query=talented%20african%20carpenter%20in%20workshop%20apron%20with%20woodworking%20tools%2C%20skilled%20craftsman%20portrait%2C%20wood%20pieces%20and%20measuring%20tools%20visible%2C%20organized%20carpentry%20workshop%20background%20with%20quality%20materials&width=300&height=300&seq=tech204&orientation=squarish',
      verified: true,
      responseTime: '< 4h',
      availability: 'Disponible',
      experience: '18 ans',
      certifications: ['CAP Menuiserie', 'Ébénisterie', 'Agencement'],
      specialties: ['Meubles sur mesure', 'Portes et fenêtres', 'Agencement intérieur', 'Rénovation bois']
    },
    {
      id: 205,
      name: 'Hassan Farah',
      service: 'Peintre Décorateur',
      category: 'painter',
      rating: 4.7,
      reviews: 89,
      price: 30,
      priceDisplay: '30 DJF/h',
      location: 'Quartier 4',
      latitude: 11.8301,
      longitude: 42.6053,
      image: 'https://readdy.ai/api/search-image?query=professional%20african%20painter%20in%20clean%20work%20clothes%20with%20painting%20equipment%2C%20skilled%20decorator%20portrait%2C%20paint%20brushes%20and%20rollers%20visible%2C%20bright%20painting%20studio%20background%20with%20color%20samples&width=300&height=300&seq=tech205&orientation=squarish',
      verified: true,
      responseTime: '< 1 jour',
      availability: 'Disponible',
      experience: '14 ans',
      certifications: ['Peinture professionnelle', 'Décoration intérieure', 'Revêtements'],
      specialties: ['Peinture intérieure', 'Peinture extérieure', 'Décoration murale', 'Enduits décoratifs']
    },
    {
      id: 206,
      name: 'Youssouf Ahmed',
      service: 'Maçon Professionnel',
      category: 'mason',
      rating: 4.9,
      reviews: 112,
      price: 40,
      priceDisplay: '40 DJF/h',
      location: 'Quartier 7',
      latitude: 11.8451,
      longitude: 42.6103,
      image: 'https://readdy.ai/api/search-image?query=experienced%20african%20mason%20in%20construction%20gear%20with%20masonry%20tools%2C%20professional%20builder%20portrait%2C%20trowel%20and%20level%20visible%2C%20construction%20site%20background%20with%20quality%20brickwork%20and%20materials&width=300&height=300&seq=tech206&orientation=squarish',
      verified: true,
      responseTime: '< 1 jour',
      availability: 'Sur réservation',
      experience: '20 ans',
      certifications: ['Maçonnerie générale', 'Béton armé', 'Construction'],
      specialties: ['Construction neuve', 'Rénovation', 'Murs et cloisons', 'Fondations']
    },
    {
      id: 207,
      name: 'Khadija Mohamed',
      service: 'Technicienne Informatique',
      category: 'it',
      rating: 4.8,
      reviews: 145,
      price: 55,
      priceDisplay: '55 DJF/h',
      location: 'Quartier 6',
      latitude: 11.8401,
      longitude: 42.6153,
      image: 'https://readdy.ai/api/search-image?query=professional%20female%20IT%20technician%20in%20modern%20office%20attire%20with%20computer%20equipment%2C%20tech%20specialist%20portrait%2C%20laptop%20and%20diagnostic%20tools%20visible%2C%20clean%20technology%20workspace%20background%20with%20servers&width=300&height=300&seq=tech207&orientation=squarish',
      verified: true,
      responseTime: '< 2h',
      availability: 'Disponible',
      experience: '8 ans',
      certifications: ['CompTIA A+', 'Network+', 'Microsoft Certified'],
      specialties: ['Dépannage PC', 'Réseaux', 'Installation logiciels', 'Sécurité informatique']
    },
    {
      id: 208,
      name: 'Zahra Hassan',
      service: 'Couturière Professionnelle',
      category: 'tailor',
      rating: 4.9,
      reviews: 156,
      price: 25,
      priceDisplay: '25 DJF/h',
      location: 'Quartier 1',
      latitude: 11.8271,
      longitude: 42.5923,
      image: 'https://readdy.ai/api/search-image?query=talented%20female%20seamstress%20in%20professional%20attire%20at%20sewing%20machine%2C%20skilled%20tailor%20portrait%2C%20fabric%20and%20measuring%20tape%20visible%2C%20bright%20tailoring%20studio%20background%20with%20organized%20materials%20and%20patterns&width=300&height=300&seq=tech208&orientation=squarish',
      verified: true,
      responseTime: '< 1 jour',
      availability: 'Disponible',
      experience: '16 ans',
      certifications: ['CAP Couture', 'Stylisme', 'Retouches'],
      specialties: ['Vêtements sur mesure', 'Retouches', 'Robes de cérémonie', 'Ameublement']
    },
    {
      id: 209,
      name: 'Saïd Abdillahi',
      service: 'Mécanicien Auto',
      category: 'mechanic',
      rating: 4.8,
      reviews: 134,
      price: 45,
      priceDisplay: '45 DJF/h',
      location: 'Quartier 3',
      latitude: 11.8221,
      longitude: 42.5973,
      image: 'https://readdy.ai/api/search-image?query=professional%20african%20auto%20mechanic%20in%20work%20uniform%20with%20automotive%20tools%2C%20experienced%20car%20technician%20portrait%2C%20wrench%20and%20diagnostic%20equipment%20visible%2C%20modern%20garage%20workshop%20background%20with%20vehicles&width=300&height=300&seq=tech209&orientation=squarish',
      verified: true,
      responseTime: '< 3h',
      availability: 'Disponible',
      experience: '13 ans',
      certifications: ['Mécanique automobile', 'Diagnostic électronique', 'Climatisation auto'],
      specialties: ['Révision complète', 'Diagnostic panne', 'Freinage', 'Moteur']
    },
    {
      id: 210,
      name: 'Amina Ali',
      service: 'Jardinière Paysagiste',
      category: 'gardener',
      rating: 4.7,
      reviews: 68,
      price: 30,
      priceDisplay: '30 DJF/h',
      location: 'Quartier 5',
      latitude: 11.8331,
      longitude: 42.6023,
      image: 'https://readdy.ai/api/search-image?query=professional%20female%20gardener%20in%20outdoor%20work%20attire%20with%20gardening%20tools%2C%20landscape%20specialist%20portrait%2C%20pruning%20shears%20and%20plants%20visible%2C%20beautiful%20garden%20background%20with%20lush%20greenery%20and%20flowers&width=300&height=300&seq=tech210&orientation=squarish',
      verified: true,
      responseTime: '< 1 jour',
      availability: 'Disponible',
      experience: '9 ans',
      certifications: ['Horticulture', 'Paysagisme', 'Arrosage automatique'],
      specialties: ['Entretien jardins', 'Création espaces verts', 'Taille arbres', 'Irrigation']
    }
  ];

  const serviceCategories = [
    {
      id: 'electrician',
      name: 'Électricien',
      icon: 'ri-flashlight-line',
      description: 'Installation et dépannage électrique',
      count: technicians.filter(t => t.category === 'electrician').length,
      image: 'https://readdy.ai/api/search-image?query=electrical%20installation%20work%20with%20modern%20tools%20and%20equipment%2C%20professional%20electrical%20panel%20and%20wiring%2C%20clean%20technical%20workspace%20with%20organized%20cables%20and%20safety%20equipment&width=400&height=250&seq=cat-electrician&orientation=landscape'
    },
    {
      id: 'plumber',
      name: 'Plombier',
      icon: 'ri-drop-line',
      description: 'Plomberie et sanitaire',
      count: technicians.filter(t => t.category === 'plumber').length,
      image: 'https://readdy.ai/api/search-image?query=modern%20plumbing%20installation%20with%20quality%20pipes%20and%20fixtures%2C%20professional%20bathroom%20fittings%2C%20clean%20plumbing%20workspace%20with%20organized%20tools%20and%20materials&width=400&height=250&seq=cat-plumber&orientation=landscape'
    },
    {
      id: 'hvac',
      name: 'Climatisation',
      icon: 'ri-temp-cold-line',
      description: 'Climatisation et réfrigération',
      count: technicians.filter(t => t.category === 'hvac').length,
      image: 'https://readdy.ai/api/search-image?query=modern%20air%20conditioning%20unit%20installation%2C%20professional%20HVAC%20system%2C%20clean%20climate%20control%20equipment%20with%20technical%20gauges%20and%20cooling%20technology&width=400&height=250&seq=cat-hvac&orientation=landscape'
    },
    {
      id: 'carpenter',
      name: 'Menuisier',
      icon: 'ri-hammer-line',
      description: 'Menuiserie et ébénisterie',
      count: technicians.filter(t => t.category === 'carpenter').length,
      image: 'https://readdy.ai/api/search-image?query=quality%20woodworking%20craftsmanship%20with%20fine%20furniture%20pieces%2C%20professional%20carpentry%20workshop%2C%20organized%20wood%20materials%20and%20precision%20tools%20in%20clean%20workspace&width=400&height=250&seq=cat-carpenter&orientation=landscape'
    },
    {
      id: 'painter',
      name: 'Peintre',
      icon: 'ri-paint-brush-line',
      description: 'Peinture et décoration',
      count: technicians.filter(t => t.category === 'painter').length,
      image: 'https://readdy.ai/api/search-image?query=professional%20interior%20painting%20work%20with%20quality%20finishes%2C%20modern%20wall%20decoration%2C%20clean%20painting%20workspace%20with%20color%20samples%20and%20professional%20equipment&width=400&height=250&seq=cat-painter&orientation=landscape'
    },
    {
      id: 'mason',
      name: 'Maçon',
      icon: 'ri-building-line',
      description: 'Maçonnerie et construction',
      count: technicians.filter(t => t.category === 'mason').length,
      image: 'https://readdy.ai/api/search-image?query=quality%20masonry%20construction%20work%20with%20professional%20brickwork%2C%20modern%20building%20materials%2C%20organized%20construction%20site%20with%20tools%20and%20cement%20mixers&width=400&height=250&seq=cat-mason&orientation=landscape'
    },
    {
      id: 'it',
      name: 'Informatique',
      icon: 'ri-computer-line',
      description: 'Dépannage et maintenance IT',
      count: technicians.filter(t => t.category === 'it').length,
      image: 'https://readdy.ai/api/search-image?query=modern%20computer%20repair%20workspace%20with%20technical%20equipment%2C%20professional%20IT%20diagnostic%20tools%2C%20clean%20technology%20workspace%20with%20servers%20and%20networking%20equipment&width=400&height=250&seq=cat-it&orientation=landscape'
    },
    {
      id: 'tailor',
      name: 'Couture',
      icon: 'ri-scissors-cut-line',
      description: 'Couture et retouches',
      count: technicians.filter(t => t.category === 'tailor').length,
      image: 'https://readdy.ai/api/search-image?query=professional%20sewing%20studio%20with%20quality%20fabrics%20and%20patterns%2C%20modern%20tailoring%20workspace%2C%20organized%20sewing%20machines%20and%20colorful%20materials%20in%20bright%20atelier&width=400&height=250&seq=cat-tailor&orientation=landscape'
    },
    {
      id: 'mechanic',
      name: 'Mécanique',
      icon: 'ri-tools-line',
      description: 'Mécanique automobile',
      count: technicians.filter(t => t.category === 'mechanic').length,
      image: 'https://readdy.ai/api/search-image?query=modern%20auto%20repair%20garage%20with%20professional%20equipment%2C%20car%20maintenance%20workspace%2C%20clean%20automotive%20workshop%20with%20diagnostic%20tools%20and%20vehicle%20lifts&width=400&height=250&seq=cat-mechanic&orientation=landscape'
    },
    {
      id: 'gardener',
      name: 'Jardinage',
      icon: 'ri-plant-line',
      description: 'Jardinage et paysagisme',
      count: technicians.filter(t => t.category === 'gardener').length,
      image: 'https://readdy.ai/api/search-image?query=beautiful%20landscaped%20garden%20with%20professional%20maintenance%2C%20lush%20green%20plants%20and%20flowers%2C%20organized%20gardening%20tools%20and%20irrigation%20system%20in%20outdoor%20setting&width=400&height=250&seq=cat-gardener&orientation=landscape'
    }
  ];

  const filterCategories = serviceCategories.map(cat => ({
    id: cat.id,
    label: cat.name,
    value: cat.id
  }));

  const filterPriceRanges = [
    { id: '1', label: '20-30 DJF/h', value: '20-30' },
    { id: '2', label: '30-40 DJF/h', value: '30-40' },
    { id: '3', label: '40-50 DJF/h', value: '40-50' },
    { id: '4', label: '50+ DJF/h', value: '50+' }
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
    { id: '3', label: 'Quartier 1', value: 'Quartier 1' },
    { id: '4', label: 'Quartier 2', value: 'Quartier 2' },
    { id: '5', label: 'Quartier 3', value: 'Quartier 3' },
    { id: '6', label: 'Quartier 4', value: 'Quartier 4' },
    { id: '7', label: 'Quartier 5', value: 'Quartier 5' },
    { id: '8', label: 'Quartier 6', value: 'Quartier 6' },
    { id: '9', label: 'Quartier 7', value: 'Quartier 7' }
  ];

  const filterAvailability = [
    { id: '1', label: 'Disponible maintenant', value: 'Disponible' },
    { id: '2', label: 'Sur réservation', value: 'Sur réservation' }
  ];

  const filterDistances = [
    { id: '1', label: 'Moins de 2 km', value: '2' },
    { id: '2', label: 'Moins de 5 km', value: '5' },
    { id: '3', label: 'Moins de 10 km', value: '10' },
    { id: '4', label: 'Moins de 20 km', value: '20' }
  ];

  const filteredTechnicians = useMemo(() => {
    let filtered = technicians.filter(tech => {
      if (searchQuery && !tech.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !tech.service.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.category && tech.category !== filters.category) {
        return false;
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(p => p.replace('+', ''));
        if (max) {
          if (tech.price < parseInt(min) || tech.price > parseInt(max)) return false;
        } else {
          if (tech.price < parseInt(min)) return false;
        }
      }

      if (filters.rating && tech.rating < parseFloat(filters.rating)) {
        return false;
      }

      return true;
    });

    if (sortBy === 'distance' && latitude && longitude) {
      filtered = filtered.map(tech => ({
        ...tech,
        distance: calculateDistance(latitude, longitude, tech.latitude, tech.longitude)
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (sortBy === 'rating') {
      filtered = filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'price') {
      filtered = filtered.sort((a, b) => a.price - b.price);
    }

    return filtered;
  }, [searchQuery, filters, sortBy, technicians, latitude, longitude, calculateDistance]);

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

  const handleBookingClick = (tech: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const serviceData = {
      id: `tech-${tech.id}`,
      title: tech.service,
      description: `Expérience: ${tech.experience}. Spécialités: ${tech.specialties.join(', ')}`,
      price: tech.price,
      duration_minutes: 60,
      professional_id: `tech-${tech.id}`,
      professional_name: tech.name,
      professional_rating: tech.rating,
      technician_data: {
        location: tech.location,
        certifications: tech.certifications,
        experience: tech.experience,
        responseTime: tech.responseTime
      }
    };

    setSelectedTechnician(serviceData);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedTechnician(null);
    alert('Réservation effectuée avec succès! Vous pouvez la consulter dans votre tableau de bord.');
  };

  const scrollToTechnicians = () => {
    const techSection = document.getElementById('technicians-section');
    if (techSection) {
      techSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Header />
      
      <div className="pt-16 sm:pt-20">
        {/* Hero Section */}
        <AnimatedSection animation="fadeIn" className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/20"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 py-16 sm:py-24 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <AnimatedSection animation="slideUp">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
                  <strong>Techniciens Professionnels à Djibouti</strong>
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-12 text-orange-50">
                  Trouvez le technicien qualifié pour tous vos travaux et réparations
                </p>
              </AnimatedSection>

              <AnimatedSection animation="slideUp" delay={200}>
                <div className="max-w-2xl mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Rechercher un technicien ou un service..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 text-base sm:text-lg border-2 border-white/30 rounded-xl focus:ring-2 focus:ring-white focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-white/70"
                    />
                    <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 text-xl"></i>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={getLocation}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-white text-orange-700 hover:bg-orange-50 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" color="text-orange-700" />
                      ) : (
                        <i className="ri-map-pin-line"></i>
                      )}
                      Techniciens près de moi
                    </button>
                    
                    <button
                      onClick={() => setShowFilters(true)}
                      className="lg:hidden flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
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

                  {latitude && longitude && (
                    <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
                      <div className="flex items-center gap-2 text-white">
                        <i className="ri-map-pin-line"></i>
                        <span className="text-sm sm:text-base">Position détectée - Tri par proximité activé</span>
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
                <strong>Catégories de Services Techniques</strong>
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Choisissez le type de technicien adapté à vos besoins
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-12">
            {serviceCategories.map((category, index) => (
              <AnimatedSection key={category.id} animation="slideUp" delay={index * 100}>
                <div
                  onClick={() => {
                    setFilters({ ...filters, category: category.id });
                    scrollToTechnicians();
                  }}
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
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-orange-600">
                        {category.count} technicien{category.count > 1 ? 's' : ''}
                      </span>
                      <i className="ri-arrow-right-line text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all"></i>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
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

            {/* Technicians List */}
            <div className="flex-1">
              <AnimatedSection animation="slideUp">
                <div id="technicians-section" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Techniciens disponibles ({filteredTechnicians.length})
                  </h2>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm sm:text-base cursor-pointer"
                  >
                    {latitude && longitude && (
                      <option value="distance">Trier par proximité</option>
                    )}
                    <option value="rating">Trier par note</option>
                    <option value="price">Trier par prix</option>
                  </select>
                </div>
              </AnimatedSection>

              <div className="grid grid-cols-1 gap-6">
                {filteredTechnicians.map((tech, index) => (
                  <AnimatedSection key={tech.id} animation="slideUp" delay={index * 100}>
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
                      <div className="flex flex-col sm:flex-row">
                        <div className="sm:w-48 h-48 sm:h-auto relative flex-shrink-0">
                          <img
                            src={tech.image}
                            alt={tech.name}
                            className="w-full h-full object-cover"
                          />
                          {tech.verified && (
                            <div className="absolute top-3 right-3 bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                              <i className="ri-verified-badge-line"></i>
                              Vérifié
                            </div>
                          )}
                          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${
                            tech.availability === 'Disponible' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-amber-500 text-white'
                          }`}>
                            {tech.availability}
                          </div>
                        </div>

                        <div className="flex-1 p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{tech.name}</h3>
                              <p className="text-orange-600 font-medium mb-2">{tech.service}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <i className="ri-star-fill text-amber-400"></i>
                                  <span className="font-medium">{tech.rating}</span>
                                  <span>({tech.reviews} avis)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <i className="ri-map-pin-line text-gray-400"></i>
                                  <span>{tech.location}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-2xl font-bold text-orange-600 mb-1">{tech.priceDisplay}</div>
                              <div className="text-sm text-gray-500">Temps de réponse: {tech.responseTime}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <i className="ri-time-line text-orange-600"></i>
                              <span className="text-gray-700">Expérience: <strong>{tech.experience}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <i className="ri-award-line text-orange-600"></i>
                              <span className="text-gray-700"><strong>{tech.certifications.length}</strong> certification{tech.certifications.length > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {tech.specialties.map((specialty, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium"
                                >
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>

                          {tech.distance !== undefined && (
                            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                              <i className="ri-map-pin-distance-line text-orange-600"></i>
                              <span>À <strong>{tech.distance.toFixed(1)} km</strong> de vous</span>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => navigate(`/professionnel/${tech.id}`)}
                              className="flex-1 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                              <i className="ri-user-line mr-2"></i>
                              Voir le profil
                            </button>
                            <button
                              onClick={() => handleBookingClick(tech)}
                              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap cursor-pointer"
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

              {filteredTechnicians.length === 0 && (
                <AnimatedSection animation="fadeIn" className="text-center py-16">
                  <i className="ri-tools-line text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">Aucun technicien trouvé</h3>
                  <p className="text-base text-gray-500">Essayez de modifier vos critères de recherche</p>
                </AnimatedSection>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          service={selectedTechnician}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedTechnician(null);
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
