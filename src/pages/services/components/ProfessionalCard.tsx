import { useState } from 'react';
import { ProfessionalProfile } from '../../../hooks/useAuth';
import LazyImage from '../../../components/base/LazyImage';
import BookingModal from '../../../components/booking/BookingModal';
import { useNavigate } from 'react-router-dom';

interface ProfessionalCardProps {
  professional: ProfessionalProfile;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const navigate = useNavigate();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleViewProfile = () => {
    navigate(`/professionnel/${professional.id}`);
  };

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookingModalOpen(true);
  };

  const getAvatarUrl = () => {
    // Use the avatar_url from profiles table if available
    if (professional.avatar_url && professional.avatar_url.trim() !== '') {
      return professional.avatar_url;
    }
    
    // Fallback to business name first 2 letters
    const initials = professional.business_name?.substring(0, 2).toUpperCase() || 'PR';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=f97316&color=fff&bold=true&length=2`;
  };

  // Calculate distance if coordinates are available
  const getDistanceText = () => {
    // This would need user's location to calculate
    // For now, return a placeholder
    return 'À 64.3 km de vous';
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
        <div className="flex gap-4 p-6">
          {/* Professional Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-orange-100">
              <img
                src={getAvatarUrl()}
                alt={professional.full_name || professional.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const initials = professional.business_name?.substring(0, 2).toUpperCase() || 'PR';
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=300&background=f97316&color=fff&bold=true&length=2`;
                }}
              />
            </div>
            {professional.is_verified && (
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                <i className="ri-checkbox-circle-fill"></i>
                Vérifié
              </div>
            )}
          </div>

          {/* Professional Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {professional.full_name || professional.business_name}
                </h3>
                <p className="text-sm text-orange-600 font-medium mb-1">
                  {professional.service_category}
                </p>
              </div>
              <div className="text-right ml-4">
                <div className="text-2xl font-bold text-orange-600 whitespace-nowrap">
                  {professional.hourly_rate} DJF/h
                </div>
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                <i className="ri-star-fill text-yellow-400 text-sm"></i>
                <span className="text-sm font-semibold text-gray-900">{professional.rating || 0}</span>
                <span className="text-sm text-gray-500">({professional.total_reviews || 0} avis)</span>
              </div>
            </div>

            {/* Experience and Certifications */}
            <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <i className="ri-time-line text-orange-500"></i>
                <span>Expérience: {professional.experience_years || 0} ans</span>
              </div>
              {professional.certifications && professional.certifications.length > 0 && (
                <div className="flex items-center gap-1">
                  <i className="ri-award-line text-orange-500"></i>
                  <span>{professional.certifications.length} certification{professional.certifications.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Location and Distance */}
            <div className="flex items-center gap-1 mb-3 text-sm text-gray-600">
              <i className="ri-map-pin-line text-gray-400"></i>
              <span>{getDistanceText()}</span>
            </div>

            {/* Services proposés (subcategory) */}
            {professional.sub_category && (
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <i className="ri-tools-line text-orange-500 text-sm mt-0.5"></i>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-500 block mb-1">Services proposés:</span>
                    <span className="text-sm text-gray-700 font-medium">{professional.sub_category}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Status */}
            <div className="mb-3">
              {professional.is_active ? (
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

            {/* Skills/Specialties */}
            {professional.skills && professional.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {professional.skills.slice(0, 4).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleViewProfile}
                className="flex-1 px-4 py-2 font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap border border-gray-300 hover:border-gray-400 text-gray-700 cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-user-line"></i>
                Voir le profil
              </button>
              <button
                onClick={handleBooking}
                className="flex-1 px-4 py-2 font-medium rounded-lg transition-colors text-center touch-manipulation active:scale-95 whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white cursor-pointer flex items-center justify-center gap-2"
              >
                <i className="ri-calendar-check-line"></i>
                Réserver
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        professional={professional}
      />
    </>
  );
}
