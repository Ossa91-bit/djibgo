import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import BookingModal from '../../components/booking/BookingModal';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface ProfessionalProfileData {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  city: string;
  business_name?: string;
  service_category: string;
  sub_category?: string;
  experience_years: number;
  hourly_rate: number;
  description: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  services: string[];
  availability: string[];
  gallery: string[];
}

interface Review {
  id: string;
  client_name: string;
  client_avatar?: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const mockProfessionals: { [key: string]: ProfessionalProfileData } = {
  '1': {
    id: '1',
    full_name: 'Ahmed Hassan',
    phone: '+253 77 123 456',
    avatar_url: 'https://readdy.ai/api/search-image?query=professional%20african%20man%20electrician%20uniform%20tools%20confident%20portrait%20simple%20background&width=200&height=200&seq=prof1&orientation=squarish',
    city: 'Balbala',
    business_name: 'Hassan Électricité',
    service_category: 'Électricien',
    experience_years: 8,
    hourly_rate: 25,
    description: 'Électricien professionnel avec plus de 8 ans d\'expérience dans l\'installation et la réparation électrique. Spécialisé dans les installations domestiques et commerciales, je garantis un travail de qualité et respecte toutes les normes de sécurité.',
    rating: 4.8,
    total_reviews: 127,
    is_verified: true,
    services: [
      'Installation électrique complète',
      'Réparation de pannes électriques',
      'Mise aux normes électriques',
      'Installation d\'éclairage',
      'Dépannage d\'urgence 24h/7j',
      'Installation de prises et interrupteurs'
    ],
    availability: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    gallery: [
      'https://readdy.ai/api/search-image?query=electrical%20installation%20professional%20work%20house%20wiring%20clean%20modern%20setup%20lighting&width=400&height=300&seq=elec1&orientation=landscape',
      'https://readdy.ai/api/search-image?query=electrical%20panel%20circuit%20breaker%20installation%20professional%20electrician%20work%20modern%20equipment&width=400&height=300&seq=elec2&orientation=landscape',
      'https://readdy.ai/api/search-image?query=modern%20lighting%20installation%20ceiling%20lights%20professional%20electrical%20work%20indoor&width=400&height=300&seq=elec3&orientation=landscape',
      'https://readdy.ai/api/search-image?query=electrical%20outlet%20installation%20wall%20sockets%20professional%20work%20clean%20finish&width=400&height=300&seq=elec4&orientation=landscape'
    ]
  },
  '2': {
    id: '2',
    full_name: 'Fatima Mohamed',
    phone: '+253 77 234 567',
    avatar_url: 'https://readdy.ai/api/search-image?query=professional%20african%20woman%20plumber%20uniform%20confident%20portrait%20tools%20simple%20background&width=200&height=200&seq=prof2&orientation=squarish',
    city: 'Hayableh',
    business_name: 'Plomberie Fatima',
    service_category: 'Plombier',
    experience_years: 6,
    hourly_rate: 22,
    description: 'Plombière experte spécialisée dans tous types de travaux de plomberie. Installation, réparation, dépannage d\'urgence. Je propose des solutions durables et économiques pour tous vos problèmes de plomberie.',
    rating: 4.9,
    total_reviews: 89,
    is_verified: true,
    services: [
      'Installation de plomberie complète',
      'Réparation de fuites d\'eau',
      'Débouchage de canalisations',
      'Installation sanitaire',
      'Dépannage d\'urgence',
      'Rénovation de salles de bain'
    ],
    availability: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
    gallery: [
      'https://readdy.ai/api/search-image?query=bathroom%20plumbing%20installation%20modern%20pipes%20fixtures%20professional%20work%20clean%20finish&width=400&height=300&seq=plumb1&orientation=landscape',
      'https://readdy.ai/api/search-image?query=kitchen%20sink%20installation%20plumbing%20professional%20work%20modern%20faucet%20clean%20setup&width=400&height=300&seq=plumb2&orientation=landscape',
      'https://readdy.ai/api/search-image?query=pipe%20installation%20plumbing%20work%20professional%20tools%20modern%20bathroom%20setup&width=400&height=300&seq=plumb3&orientation=landscape',
      'https://readdy.ai/api/search-image?query=water%20heater%20installation%20plumbing%20professional%20work%20modern%20equipment%20setup&width=400&height=300&seq=plumb4&orientation=landscape'
    ]
  },
  '3': {
    id: '3',
    full_name: 'Omar Abdillahi',
    phone: '+253 77 345 678',
    avatar_url: 'https://readdy.ai/api/search-image?query=professional%20african%20man%20mechanic%20uniform%20confident%20portrait%20tools%20simple%20background&width=200&height=200&seq=prof3&orientation=squarish',
    city: 'Djibouti Centre',
    business_name: 'Garage Omar',
    service_category: 'Mécanicien',
    experience_years: 12,
    hourly_rate: 30,
    description: 'Mécanicien automobile avec plus de 12 ans d\'expérience. Spécialisé dans la réparation et l\'entretien de tous types de véhicules. Diagnostic précis, réparations durables et conseils d\'entretien personnalisés.',
    rating: 4.7,
    total_reviews: 203,
    is_verified: true,
    services: [
      'Réparation moteur',
      'Entretien périodique',
      'Diagnostic électronique',
      'Réparation de freins',
      'Changement d\'huile et filtres',
      'Réparation de transmission'
    ],
    availability: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    gallery: [
      'https://readdy.ai/api/search-image?query=car%20engine%20repair%20mechanic%20professional%20work%20modern%20garage%20tools%20equipment&width=400&height=300&seq=mech1&orientation=landscape',
      'https://readdy.ai/api/search-image?query=automotive%20diagnostic%20computer%20modern%20garage%20mechanic%20professional%20work%20equipment&width=400&height=300&seq=mech2&orientation=landscape',
      'https://readdy.ai/api/search-image?query=brake%20repair%20car%20maintenance%20professional%20mechanic%20work%20clean%20garage%20setup&width=400&height=300&seq=mech3&orientation=landscape',
      'https://readdy.ai/api/search-image?query=car%20transmission%20repair%20professional%20mechanic%20work%20modern%20garage%20tools&width=400&height=300&seq=mech4&orientation=landscape'
    ]
  }
};

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [professional, setProfessional] = useState<ProfessionalProfileData | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);

  const daysOfWeek = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' }
  ];

  // Validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    const fetchProfessional = async () => {
      setLoading(true);
      
      try {
        // Validate that the ID is a valid UUID
        if (!id || !isValidUUID(id)) {
          console.error('Invalid professional ID format:', id);
          navigate('/services');
          return;
        }

        // Fetch professional data from Supabase with profile data
        const { data: professionalData, error } = await supabase
          .from('professional_profiles')
          .select(`
            *,
            profiles!inner (
              full_name,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (professionalData) {
          console.log('Professional data fetched:', professionalData);
          console.log('Avatar URL from database:', professionalData.profiles?.avatar_url);

          // Get the avatar URL from profiles table
          let avatarUrl = professionalData.profiles?.avatar_url;
          
          console.log('Avatar URL:', avatarUrl);

          // If no avatar, use placeholder with business name first 2 letters
          if (!avatarUrl) {
            const initials = professionalData.business_name?.substring(0, 2).toUpperCase() || 'PR';
            avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=f97316&color=fff&bold=true&length=2`;
          }

          // Fetch reviews count for this professional
          const { count: reviewsCount } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('professional_id', id);

          const actualReviewCount = reviewsCount || 0;
          setReviewCount(actualReviewCount);

          // Fetch professional availability schedule
          const { data: availabilityData, error: availabilityError } = await supabase
            .from('professional_availability')
            .select('*')
            .eq('professional_id', id)
            .order('day_of_week', { ascending: true });

          if (availabilityError) {
            console.error('Error fetching availability:', availabilityError);
          } else {
            setAvailabilitySlots(availabilityData || []);
            console.log('Availability slots fetched:', availabilityData);
          }

          // Transform data to match component expectations
          const transformedProfessional: ProfessionalProfileData = {
            id: professionalData.id,
            full_name: professionalData.profiles?.full_name || professionalData.business_name || 'Professionnel',
            phone: professionalData.phone || '',
            avatar_url: avatarUrl,
            city: professionalData.city || 'Djibouti',
            business_name: professionalData.business_name || '',
            service_category: professionalData.service_category || '',
            sub_category: professionalData.sub_category || '',
            experience_years: professionalData.experience_years || 0,
            hourly_rate: professionalData.hourly_rate || 0,
            description: professionalData.description || '',
            rating: professionalData.rating || 0,
            total_reviews: actualReviewCount,
            is_verified: professionalData.is_verified || false,
            services: professionalData.skills || [],
            availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            gallery: [
              `https://readdy.ai/api/search-image?query=professional%20$%7BprofessionalData.service_category%7D%20work%20quality%20service%20clean%20modern%20setup&width=400&height=300&seq=${professionalData.id}-1&orientation=landscape`,
              `https://readdy.ai/api/search-image?query=professional%20$%7BprofessionalData.service_category%7D%20equipment%20tools%20modern%20workspace&width=400&height=300&seq=${professionalData.id}-2&orientation=landscape`,
              `https://readdy.ai/api/search-image?query=professional%20$%7BprofessionalData.service_category%7D%20completed%20project%20quality%20work&width=400&height=300&seq=${professionalData.id}-3&orientation=landscape`,
              `https://readdy.ai/api/search-image?query=professional%20$%7BprofessionalData.service_category%7D%20service%20modern%20equipment%20setup&width=400&height=300&seq=${professionalData.id}-4&orientation=landscape`
            ]
          };

          setProfessional(transformedProfessional);

          // Fetch reviews for this professional with client information
          const { data: reviewsData } = await supabase
            .from('reviews')
            .select(`
              *,
              profiles!reviews_client_id_fkey (
                full_name,
                avatar_url
              )
            `)
            .eq('professional_id', id)
            .order('created_at', { ascending: false });

          if (reviewsData && reviewsData.length > 0) {
            const transformedReviews: Review[] = reviewsData.map((review) => {
              let clientAvatarUrl = review.profiles?.avatar_url;

              // Use placeholder if no avatar
              if (!clientAvatarUrl) {
                const clientName = review.profiles?.full_name || 'Client';
                clientAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&size=80&background=14b8a6&color=fff&bold=true`;
              }

              return {
                id: review.id,
                client_name: review.profiles?.full_name || 'Client Anonyme',
                client_avatar: clientAvatarUrl,
                rating: review.rating || 0,
                comment: review.comment || '',
                date: new Date(review.created_at).toLocaleDateString('fr-FR'),
                avatar: clientAvatarUrl
              };
            });
            setReviews(transformedReviews);
          }
        } else {
          navigate('/services');
        }
      } catch (error) {
        console.error('Error fetching professional:', error);
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProfessional();
    } else {
      navigate('/services');
    }
  }, [id, navigate]);

  const handleBookingClick = () => {
    if (!user) {
      // If the user is not logged in, open the booking modal directly (or could open auth modal)
      setIsBookingModalOpen(true);
    } else {
      setIsBookingModalOpen(true);
    }
  };

  const handleWhatsAppContact = () => {
    if (!professional?.phone) {
      alert('Numéro de téléphone non disponible pour ce professionnel.');
      return;
    }

    // Format the phone number for WhatsApp (remove spaces and special characters)
    const formattedPhone = professional.phone.replace(/[\s\-\(\)]/g, '');
    
    // Pre-filled message for WhatsApp
    const message = `Bonjour ${professional.business_name || professional.full_name}, je suis intéressé(e) par vos services de ${professional.service_category}. Pouvez-vous me donner plus d'informations ?`;
    
    // Create the WhatsApp link
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };

  const handleGalleryClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryModalOpen(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <i key={i} className="ri-star-fill text-yellow-400"></i>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <i key="half" className="ri-star-half-fill text-yellow-400"></i>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <i key={`empty-${i}`} className="ri-star-line text-gray-300"></i>
      );
    }

    return stars;
  };

  const getAvailabilityForDay = (dayValue: number): AvailabilitySlot | null => {
    return availabilitySlots.find(slot => slot.day_of_week === dayValue && slot.is_available) || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="ri-loader-4-line text-4xl text-orange-500 animate-spin mb-4"></i>
            <p className="text-gray-600">Chargement du profil...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="ri-error-warning-line text-4xl text-red-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Professionnel introuvable</h2>
            <p className="text-gray-600 mb-6">Le professionnel que vous cherchez n'existe pas.</p>
            <button
              onClick={() => navigate('/services')}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retour aux services
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header du profil */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative">
                <img
                  src={professional.avatar_url}
                  alt={professional.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-orange-100"
                />
                {professional.is_verified && (
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-2 rounded-full">
                    <i className="ri-check-line text-sm"></i>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-center lg:text-left">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(professional.rating)}
                  <span className="text-sm text-gray-600">
                    ({reviewCount} avis)
                  </span>
                </div>
                <p className="text-gray-600 text-sm">
                  <i className="ri-map-pin-line mr-1"></i>
                  {professional.city}
                </p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    <strong>{professional.full_name}</strong>
                  </h1>
                  {professional.business_name && (
                    <p className="text-lg text-orange-600 font-medium mb-2">
                      {professional.business_name}
                    </p>
                  )}
                  <p className="text-lg text-gray-700 mb-2">
                    {professional.service_category}
                  </p>
                  <p className="text-sm text-gray-600">
                    {professional.experience_years} ans d'expérience
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-600 mb-2">
                    {professional.hourly_rate} DJF<span className="text-sm text-gray-600">/heure</span>
                  </p>
                  <button
                    onClick={handleBookingClick}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap"
                  >
                    <i className="ri-calendar-check-line mr-2"></i>
                    Réserver maintenant
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <i className="ri-time-line text-2xl text-orange-600 mb-2"></i>
                  <p className="text-sm text-gray-700 font-medium">Expérience</p>
                  <p className="text-lg font-bold text-orange-600">{professional.experience_years} ans</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <i className="ri-star-line text-2xl text-green-600 mb-2"></i>
                  <p className="text-sm text-gray-700 font-medium">Note moyenne</p>
                  <p className="text-lg font-bold text-green-600">{professional.rating}/5</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <i className="ri-user-line text-2xl text-blue-600 mb-2"></i>
                  <p className="text-sm text-gray-700 font-medium">Clients satisfaits</p>
                  <p className="text-lg font-bold text-blue-600">{reviewCount}+</p>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">
                {professional.description}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Services proposés */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <i className="ri-tools-line mr-2 text-orange-600"></i>
                Services proposés
              </h2>
              
              {/* Display sub_category if available */}
              {professional.sub_category && (
                <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="ri-service-line text-white text-lg"></i>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-orange-600 mb-1">Spécialité principale</p>
                      <p className="text-base font-bold text-gray-900">{professional.sub_category}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {professional.services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                      <i className="ri-check-line text-orange-600"></i>
                    </div>
                    <span className="text-gray-700 font-medium">{service}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Galerie de travaux */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <i className="ri-image-line mr-2 text-orange-600"></i>
                Galerie de travaux
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {professional.gallery.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleGalleryClick(index)}
                  >
                    <img
                      src={image}
                      alt={`Travail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                      <i className="ri-zoom-in-line text-white text-2xl opacity-0 hover:opacity-100 transition-opacity"></i>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avis clients */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                <i className="ri-chat-1-line mr-2 text-orange-600"></i>
                Avis clients ({reviewCount})
              </h2>
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <img
                          src={review.avatar}
                          alt={review.client_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{review.client_name}</h4>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <i className="ri-chat-3-line text-4xl mb-3"></i>
                    <p>Aucun avis pour le moment</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <i className="ri-phone-line mr-2 text-orange-600"></i>
                Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <i className="ri-phone-fill text-orange-600"></i>
                  <span className="text-gray-700">{professional.phone}</span>
                </div>
                <button 
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  <i className="ri-whatsapp-line mr-2"></i>
                  Contacter via WhatsApp
                </button>
              </div>
            </div>

            {/* Disponibilité */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <i className="ri-calendar-line mr-2 text-orange-600"></i>
                Disponibilité
              </h3>
              <div className="space-y-2">
                {daysOfWeek.map((day) => {
                  const availability = getAvailabilityForDay(day.value);
                  const isAvailable = availability !== null;
                  
                  return (
                    <div key={day.value} className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700 font-medium">{day.label}</span>
                      {isAvailable && availability ? (
                        <div className="text-right">
                          <span className="text-sm font-medium text-green-600 block">
                            Disponible
                          </span>
                          <span className="text-xs text-gray-600">
                            {availability.start_time} - {availability.end_time}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-red-500">
                          Indisponible
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {availabilitySlots.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-information-line text-yellow-600 text-lg mr-2 mt-0.5"></i>
                    <p className="text-sm text-yellow-800">
                      Ce professionnel n'a pas encore défini ses disponibilités. Contactez-le directement pour plus d'informations.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Localisation */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                <i className="ri-map-pin-line mr-2 text-orange-600"></i>
                Localisation
              </h3>
              <div className="space-y-4">
                <p className="text-gray-700 flex items-center gap-2">
                  <i className="ri-map-pin-2-fill text-orange-600"></i>
                  {professional.city}, Djibouti
                </p>
                <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <i className="ri-map-line text-3xl mb-2"></i>
                    <p className="text-sm">Carte interactive bientôt disponible</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de galerie */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setIsGalleryModalOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
            >
              <i className="ri-close-line"></i>
            </button>
            
            <img
              src={professional.gallery[selectedImageIndex]}
              alt={`Travail ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {professional.gallery.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === selectedImageIndex ? 'bg-white' : 'bg-gray-500'
                  }`}
                />
              ))}
            </div>
            
            {professional.gallery.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex > 0 ? selectedImageIndex - 1 : professional.gallery.length - 1
                  )}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>
                <button
                  onClick={() => setSelectedImageIndex(
                    selectedImageIndex < professional.gallery.length - 1 ? selectedImageIndex + 1 : 0
                  )}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-3xl"
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de réservation */}
      {isBookingModalOpen && professional && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          professional={{
            id: professional.id,
            name: professional.full_name,
            category: professional.service_category,
            rating: professional.rating,
            hourlyRate: professional.hourly_rate,
            avatar: professional.avatar_url || '',
            services: professional.services
          }}
        />
      )}

      <Footer />
    </div>
  );
}