import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface AutoReviewPromptProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export default function AutoReviewPrompt({ booking, isOpen, onClose, onReviewSubmitted }: AutoReviewPromptProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !booking) return;

    setLoading(true);
    try {
      // Créer l'avis
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          client_id: user.id,
          professional_id: booking.professional_id,
          booking_id: booking.id,
          rating,
          comment: comment.trim(),
          is_auto_requested: true
        });

      if (reviewError) throw reviewError;

      // Ajouter des points de fidélité
      const { data: loyaltyData } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (loyaltyData) {
        // Mettre à jour les points
        await supabase
          .from('loyalty_points')
          .update({
            points: loyaltyData.points + 10,
            total_earned: loyaltyData.total_earned + 10
          })
          .eq('user_id', user.id);

        // Enregistrer la transaction
        await supabase
          .from('loyalty_transactions')
          .insert({
            user_id: user.id,
            booking_id: booking.id,
            points: 10,
            transaction_type: 'earned',
            description: 'Avis laissé pour une course'
          });
      }

      // Mettre à jour le booking
      await supabase
        .from('bookings')
        .update({ auto_review_sent: true })
        .eq('id', booking.id);

      onReviewSubmitted();
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'envoi de l\'avis');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        {/* En-tête */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-star-line text-teal-600 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Comment s'est passée votre course ?</h2>
          <p className="text-sm text-gray-600 mt-2">
            Votre avis aide les autres utilisateurs et améliore nos services
          </p>
        </div>

        {/* Informations de la course */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            {booking.profiles?.avatar_url ? (
              <img
                src={booking.profiles.avatar_url}
                alt={booking.profiles.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <i className="ri-user-line text-teal-600"></i>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{booking.profiles?.full_name}</p>
              <p className="text-sm text-gray-600">{booking.services?.title}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Notation par étoiles */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Notez votre expérience
            </label>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <i
                    className={`text-4xl ${
                      star <= (hoveredRating || rating)
                        ? 'ri-star-fill text-yellow-400'
                        : 'ri-star-line text-gray-300'
                    }`}
                  ></i>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {rating === 5 && 'Excellent !'}
              {rating === 4 && 'Très bien'}
              {rating === 3 && 'Bien'}
              {rating === 2 && 'Moyen'}
              {rating === 1 && 'Décevant'}
            </p>
          </div>

          {/* Commentaire */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Partagez votre expérience (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              rows={4}
              placeholder="Qu'avez-vous pensé de cette course ?"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/500 caractères</p>
          </div>

          {/* Bonus de fidélité */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="ri-gift-line text-teal-600 text-xl mr-3"></i>
              <div>
                <p className="text-sm font-medium text-teal-900">Gagnez 10 points de fidélité</p>
                <p className="text-xs text-teal-700">En laissant cet avis</p>
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-teal-500 text-white px-4 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Envoi...
                </span>
              ) : (
                'Envoyer l\'avis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
