import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    professional_id: string;
    professional_name: string;
    service_category: string;
  };
  onReviewSubmitted?: () => void;
}

export default function ReviewModal({ isOpen, onClose, booking, onReviewSubmitted }: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [isCheckingReview, setIsCheckingReview] = useState(false);

  // Vérifier si un avis existe déjà pour cette réservation
  useEffect(() => {
    if (isOpen && user && booking.id) {
      checkExistingReview();
    }
  }, [isOpen, user, booking.id]);

  const checkExistingReview = async () => {
    setIsCheckingReview(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at')
        .eq('booking_id', booking.id)
        .eq('client_id', user?.id)
        .maybeSingle();

      if (!error && data) {
        setHasExistingReview(true);
        setError('Vous avez déjà laissé un avis pour ce service. Un seul avis par service est autorisé.');
        // Afficher l'avis existant
        setRating(data.rating);
        setComment(data.comment);
      } else {
        setHasExistingReview(false);
        setError('');
        setRating(0);
        setComment('');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'avis existant:', err);
    } finally {
      setIsCheckingReview(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Vous devez être connecté pour laisser un avis');
      return;
    }

    // Vérifier à nouveau avant la soumission
    if (hasExistingReview) {
      setError('Vous avez déjà laissé un avis pour ce service. Un seul avis par service est autorisé.');
      return;
    }

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Votre commentaire doit contenir au moins 10 caractères');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Vérification finale juste avant l'insertion
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('client_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Erreur lors de la vérification:', checkError);
      }

      if (existingReview) {
        setHasExistingReview(true);
        setError('Vous avez déjà laissé un avis pour ce service. Un seul avis par service est autorisé.');
        setIsSubmitting(false);
        return;
      }

      // Insert review directly into database
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .insert({
          professional_id: booking.professional_id,
          client_id: user.id,
          booking_id: booking.id,
          rating,
          comment: comment.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (reviewError) {
        // Vérifier si c'est une erreur de contrainte unique
        if (reviewError.code === '23505' || reviewError.message.includes('unique')) {
          setHasExistingReview(true);
          setError('Vous avez déjà laissé un avis pour ce service. Un seul avis par service est autorisé.');
          setIsSubmitting(false);
          return;
        }
        throw reviewError;
      }

      // Calculate new average rating for the professional
      const { data: allReviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('professional_id', booking.professional_id);

      if (!reviewsError && allReviews) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allReviews.length;
        const totalReviews = allReviews.length;

        // Update professional profile with new rating
        await supabase
          .from('professional_profiles')
          .update({
            rating: Number(averageRating.toFixed(1)),
            total_reviews: totalReviews
          })
          .eq('id', booking.professional_id);
      }

      // Récupérer le nom du client pour la notification
      const { data: clientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      // Create notification for professional avec le bon type 'new_review'
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.professional_id,
          type: 'new_review',
          title: 'Nouvel avis reçu',
          message: `${clientProfile?.full_name || 'Un client'} a laissé un avis de ${rating} étoiles sur votre service`,
          booking_id: booking.id,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('Erreur lors de la création de la notification:', notificationError);
      } else {
        console.log('✅ Notification créée avec succès pour le professionnel');
      }

      // Success - close modal and refresh
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      onClose();
      
      // Show success message
      alert('Merci pour votre avis ! Il a été publié avec succès.');
      
    } catch (err: any) {
      console.error('Error submitting review:', err);
      
      // Vérifier si c'est une erreur de contrainte unique
      if (err.code === '23505' || err.message?.includes('unique') || err.message?.includes('duplicate')) {
        setHasExistingReview(true);
        setError('Vous avez déjà laissé un avis pour ce service. Un seul avis par service est autorisé.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'envoi de votre avis');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      setError('');
      setHasExistingReview(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {hasExistingReview ? 'Votre avis' : 'Laisser un avis'}
            </h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Professional Info */}
          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">
              {hasExistingReview ? 'Votre avis pour' : 'Vous évaluez'}
            </p>
            <p className="font-semibold text-gray-900">{booking.professional_name}</p>
            <p className="text-sm text-orange-600">{booking.service_category}</p>
          </div>

          {/* Loading State */}
          {isCheckingReview && (
            <div className="flex items-center justify-center py-8">
              <i className="ri-loader-4-line animate-spin text-3xl text-orange-500"></i>
            </div>
          )}

          {/* Error Message */}
          {error && !isCheckingReview && (
            <div className={`border rounded-lg p-4 mb-6 ${
              hasExistingReview 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                <i className={`${
                  hasExistingReview 
                    ? 'ri-information-line text-yellow-600' 
                    : 'ri-error-warning-line text-red-600'
                } mr-2 mt-0.5 flex-shrink-0`}></i>
                <p className={`text-sm ${
                  hasExistingReview ? 'text-yellow-700' : 'text-red-600'
                }`}>{error}</p>
              </div>
            </div>
          )}

          {/* Review Form */}
          {!isCheckingReview && (
            <form onSubmit={handleSubmit}>
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Note {!hasExistingReview && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => !hasExistingReview && setRating(star)}
                      onMouseEnter={() => !hasExistingReview && setHoveredRating(star)}
                      onMouseLeave={() => !hasExistingReview && setHoveredRating(0)}
                      disabled={hasExistingReview}
                      className="text-4xl transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i
                        className={
                          star <= (hoveredRating || rating)
                            ? 'ri-star-fill text-yellow-400'
                            : 'ri-star-line text-gray-300'
                        }
                      ></i>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-gray-600 font-medium">
                      {rating}/5
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre commentaire {!hasExistingReview && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => !hasExistingReview && setComment(e.target.value)}
                  placeholder={hasExistingReview ? '' : 'Partagez votre expérience avec ce professionnel...'}
                  rows={5}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50"
                  disabled={isSubmitting || hasExistingReview}
                  readOnly={hasExistingReview}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {comment.length}/500 caractères
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Fermer
                </button>
                {!hasExistingReview && (
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        Envoi...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line mr-2"></i>
                        Publier l'avis
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
