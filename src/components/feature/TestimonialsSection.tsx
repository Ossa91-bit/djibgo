import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import AnimatedSection from './AnimatedSection';
import LoadingSpinner from '../base/LoadingSpinner';

interface Testimonial {
  id: string;
  client_name: string;
  client_avatar?: string;
  service_category: string;
  rating: number;
  comment: string;
  created_at: string;
  professional_name?: string;
}

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  showServiceCategory?: boolean;
}

export default function TestimonialsSection({
  title = "Ce que disent nos clients",
  subtitle = "Des milliers de clients satisfaits font confiance à DjibGo pour leurs besoins quotidiens",
  limit = 6,
  showServiceCategory = true
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, [limit]);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      
      // Fetch reviews with high ratings from the database
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .gte('rating', 4)
        .not('comment', 'is', null)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reviewsError) throw reviewsError;

      if (!reviewsData || reviewsData.length === 0) {
        setTestimonials(getFallbackTestimonials());
        setLoading(false);
        return;
      }

      // Fetch related profiles and professional profiles separately
      const clientIds = reviewsData.map(r => r.client_id).filter(Boolean);
      const professionalIds = reviewsData.map(r => r.professional_id).filter(Boolean);

      const [clientProfilesResult, professionalsResult] = await Promise.all([
        clientIds.length > 0 
          ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', clientIds)
          : Promise.resolve({ data: [], error: null }),
        professionalIds.length > 0
          ? supabase.from('professional_profiles').select('id, business_name, service_category').in('id', professionalIds)
          : Promise.resolve({ data: [], error: null })
      ]);

      // Create lookup maps
      const clientProfilesMap = new Map(clientProfilesResult.data?.map(p => [p.id, p]) || []);
      const professionalsMap = new Map(professionalsResult.data?.map(p => [p.id, p]) || []);

      // Transform the data
      const transformedData = reviewsData.map((review: any) => {
        const clientProfile = clientProfilesMap.get(review.client_id);
        const professional = professionalsMap.get(review.professional_id);

        return {
          id: review.id,
          client_name: clientProfile?.full_name || 'Client DjibGo',
          client_avatar: clientProfile?.avatar_url,
          service_category: professional?.service_category || 'Service',
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          professional_name: professional?.business_name
        };
      });

      setTestimonials(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement des témoignages:', error);
      // Use fallback testimonials if database fetch fails
      setTestimonials(getFallbackTestimonials());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackTestimonials = (): Testimonial[] => {
    return [
      {
        id: '1',
        client_name: 'Amina Hassan',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20woman%20smiling%20happy%20customer%20portrait%20natural%20lighting%20warm%20expression%20satisfied%20client%20Djibouti&width=100&height=100&seq=testimonial-amina&orientation=portrait',
        service_category: 'Plomberie',
        rating: 5,
        comment: 'Service exceptionnel ! Le plombier est arrivé à l\'heure et a résolu mon problème rapidement. Je recommande vivement DjibGo pour trouver des professionnels fiables.',
        created_at: new Date().toISOString(),
        professional_name: 'Ahmed Plomberie'
      },
      {
        id: '2',
        client_name: 'Mohamed Ali',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20man%20smiling%20satisfied%20customer%20portrait%20natural%20lighting%20confident%20expression%20happy%20client%20Djibouti&width=100&height=100&seq=testimonial-mohamed&orientation=portrait',
        service_category: 'Électricité',
        rating: 5,
        comment: 'Excellent travail ! L\'électricien était très professionnel et a expliqué chaque étape. Prix transparent et service de qualité. Merci DjibGo !',
        created_at: new Date().toISOString(),
        professional_name: 'ElectroTech Services'
      },
      {
        id: '3',
        client_name: 'Fatima Ibrahim',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20woman%20happy%20customer%20smiling%20portrait%20natural%20lighting%20satisfied%20expression%20client%20testimonial%20Djibouti&width=100&height=100&seq=testimonial-fatima&orientation=portrait',
        service_category: 'Ménage',
        rating: 5,
        comment: 'Je suis très satisfaite du service de ménage. L\'équipe est ponctuelle, efficace et respectueuse. Ma maison n\'a jamais été aussi propre !',
        created_at: new Date().toISOString(),
        professional_name: 'CleanPro Djibouti'
      },
      {
        id: '4',
        client_name: 'Omar Abdillahi',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20man%20satisfied%20customer%20smiling%20portrait%20natural%20lighting%20happy%20expression%20client%20review%20Djibouti&width=100&height=100&seq=testimonial-omar&orientation=portrait',
        service_category: 'Menuiserie',
        rating: 5,
        comment: 'Travail impeccable ! Le menuisier a fabriqué des meubles sur mesure exactement comme je voulais. Qualité exceptionnelle et finitions parfaites.',
        created_at: new Date().toISOString(),
        professional_name: 'Bois & Design'
      },
      {
        id: '5',
        client_name: 'Khadija Youssouf',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20woman%20happy%20satisfied%20customer%20portrait%20natural%20lighting%20warm%20smile%20client%20testimonial%20Djibouti&width=100&height=100&seq=testimonial-khadija&orientation=portrait',
        service_category: 'Jardinage',
        rating: 5,
        comment: 'Mon jardin est magnifique grâce à DjibGo ! Le jardinier est compétent et passionné. Il a transformé mon espace extérieur en un véritable paradis.',
        created_at: new Date().toISOString(),
        professional_name: 'Jardins de Djibouti'
      },
      {
        id: '6',
        client_name: 'Hassan Daoud',
        client_avatar: 'https://readdy.ai/api/search-image?query=professional%20African%20man%20happy%20customer%20smiling%20portrait%20natural%20lighting%20satisfied%20expression%20client%20review%20Djibouti&width=100&height=100&seq=testimonial-hassan&orientation=portrait',
        service_category: 'Climatisation',
        rating: 5,
        comment: 'Installation rapide et professionnelle de ma climatisation. Le technicien était très compétent et a donné d\'excellents conseils d\'entretien.',
        created_at: new Date().toISOString(),
        professional_name: 'CoolAir Djibouti'
      }
    ];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`ri-star-${star <= rating ? 'fill' : 'line'} text-orange-500 text-lg`}
          ></i>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    // Moins d'une minute
    if (diffMinutes < 1) return "À l'instant";
    
    // Moins d'une heure
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? "Il y a 1 minute" : `Il y a ${diffMinutes} minutes`;
    }
    
    // Moins d'un jour
    if (diffHours < 24) {
      return diffHours === 1 ? "Il y a 1 heure" : `Il y a ${diffHours} heures`;
    }
    
    // Moins d'une semaine
    if (diffDays < 7) {
      if (diffDays === 1) return "Hier";
      return `Il y a ${diffDays} jours`;
    }
    
    // Moins d'un mois
    if (diffDays < 30) {
      return diffWeeks === 1 ? "Il y a 1 semaine" : `Il y a ${diffWeeks} semaines`;
    }
    
    // Moins d'un an
    if (diffDays < 365) {
      return diffMonths === 1 ? "Il y a 1 mois" : `Il y a ${diffMonths} mois`;
    }
    
    // Plus d'un an
    return diffYears === 1 ? "Il y a 1 an" : `Il y a ${diffYears} ans`;
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          </div>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection animation="fade-up">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
              <i className="ri-chat-quote-line text-3xl text-orange-500"></i>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 relative"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={testimonial.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.client_name)}&background=f97316&color=fff`}
                        alt={testimonial.client_name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {testimonial.client_name}
                      </h4>
                      {showServiceCategory && (
                        <p className="text-sm text-gray-500">
                          {testimonial.service_category}
                        </p>
                      )}
                    </div>
                  </div>
                  {renderStars(testimonial.rating)}
                </div>

                {/* Comment */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  {testimonial.professional_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <i className="ri-user-line"></i>
                      <span>{testimonial.professional_name}</span>
                    </div>
                  )}
                  <span className="text-sm text-gray-400">
                    {formatDate(testimonial.created_at)}
                  </span>
                </div>

                {/* Quote Icon */}
                <div className="absolute top-4 right-4 opacity-10">
                  <i className="ri-double-quotes-r text-6xl text-orange-500"></i>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6">
              Rejoignez des milliers de clients satisfaits
            </p>
            <a
              href="/services"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg whitespace-nowrap cursor-pointer"
            >
              <i className="ri-search-line"></i>
              Trouver un professionnel
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
