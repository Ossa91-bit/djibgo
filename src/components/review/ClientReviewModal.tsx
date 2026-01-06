import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface ClientReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    client_id: string;
    client_name: string;
    client_avatar?: string;
  };
  onReviewSubmitted: () => void;
}

export default function ClientReviewModal({ isOpen, onClose, booking, onReviewSubmitted }: ClientReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [punctualityRating, setPunctualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [respectRating, setRespectRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Veuillez sélectionner une note globale');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Vous devez être connecté pour laisser un avis');
      }

      // Créer l'avis client
      const { error: insertError } = await supabase
        .from('client_reviews')
        .insert({
          booking_id: booking.id,
          professional_id: user.id,
          client_id: booking.client_id,
          rating,
          punctuality_rating: punctualityRating || null,
          communication_rating: communicationRating || null,
          respect_rating: respectRating || null,
          comment: comment.trim() || null
        });

      if (insertError) throw insertError;

      // Envoyer une notification au client
      await supabase.functions.invoke('notification-system', {
        body: {
          userId: booking.client_id,
          type: 'review_received',
          title: 'Nouvel avis reçu',
          message: `Vous avez reçu un avis de ${rating} étoiles pour votre comportement en tant que client`,
          bookingId: booking.id
        }
      });

      onReviewSubmitted();
      onClose();
      
      // Réinitialiser le formulaire
      setRating(0);
      setPunctualityRating(0);
      setCommunicationRating(0);
      setRespectRating(0);
      setComment('');
      
    } catch (err: any) {
      console.error('Erreur lors de la soumission de l\'avis:', err);
      setError(err.message || 'Une erreur est survenue lors de la soumission de l\'avis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (currentRating: number, setRatingFunc: (rating: number) => void, label: string) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="flex items-center space-x-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRatingFunc(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <i
                className={`text-3xl ${
                  star <= currentRating
                    ? 'ri-star-fill text-yellow-400'
                    : 'ri-star-line text-gray-300'
                }`}
              ></i>
            </button>
          ))}
          <span className="text-sm text-gray-600 ml-2">
            {currentRating > 0 ? `${currentRating}/5` : 'Non noté'}
          </span>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Évaluer le client</h2>
              <p className="text-sm text-gray-600 mt-1">
                Partagez votre expérience avec ce client
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Informations du client */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              {booking.client_avatar ? (
                <img
                  src={booking.client_avatar}
                  alt={booking.client_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <i className="ri-user-line text-teal-600 text-xl"></i>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                <p className="text-sm text-gray-600">Client</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-600 mr-2"></i>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Note globale */}
            {renderStars(rating, setRating, 'Note globale *')}

            {/* Critères détaillés */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center">
                <i className="ri-star-line mr-2"></i>
                Critères détaillés (optionnel)
              </h3>
              
              {renderStars(punctualityRating, setPunctualityRating, 'Ponctualité')}
              {renderStars(communicationRating, setCommunicationRating, 'Communication')}
              {renderStars(respectRating, setRespectRating, 'Respect et courtoisie')}
            </div>

            {/* Commentaire */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                placeholder="Partagez votre expérience avec ce client..."
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Votre avis aidera les autres professionnels
                </p>
                <span className="text-xs text-gray-500">
                  {comment.length}/500
                </span>
              </div>
            </div>

            {/* Note d'information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <i className="ri-information-line text-amber-600 mt-0.5 mr-2"></i>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">À propos des évaluations clients</p>
                  <p>
                    Les évaluations bidirectionnelles permettent de maintenir une communauté de qualité. 
                    Le client pourra voir votre avis et cela l'aidera à améliorer son comportement.
                  </p>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Envoi en cours...
                  </span>
                ) : (
                  'Publier l\'avis'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
