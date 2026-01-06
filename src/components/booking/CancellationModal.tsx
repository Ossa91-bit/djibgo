
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CancellationModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancellationModal({ booking, onClose, onSuccess }: CancellationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refundInfo, setRefundInfo] = useState<{
    percentage: number;
    amount: number;
    message: string;
  } | null>(null);

  // Calculate refund based on cancellation policy
  const calculateRefund = () => {
    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let percentage = 0;
    let message = '';

    if (hoursUntilBooking >= 24) {
      percentage = 100;
      message = 'Annulation plus de 24h avant - Remboursement complet (100%)';
    } else if (hoursUntilBooking >= 12) {
      percentage = 50;
      message = 'Annulation entre 12h et 24h avant - Remboursement partiel (50%)';
    } else {
      percentage = 0;
      message = 'Annulation moins de 12h avant - Aucun remboursement (0%)';
    }

    const amount = (booking.total_amount * percentage) / 100;

    return { percentage, amount, message };
  };

  const handleCancelBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const refund = calculateRefund();
      setRefundInfo(refund);

      // Check if cancellation is allowed
      if (refund.percentage === 0) {
        const bookingDate = new Date(booking.booking_date);
        const now = new Date();
        const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursUntilBooking < 12) {
          setError('Selon nos CGU, les annulations moins de 12h avant le service ne sont pas remboursables.');
          setLoading(false);
          return;
        }
      }

      // Get user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Vous devez être connecté pour annuler une réservation');
        setLoading(false);
        return;
      }

      // Call payment processing edge function to handle cancellation
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/payment-processing`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'cancel_booking',
            bookingId: booking.id,
            refundPercentage: refund.percentage
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'annulation');
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      // Create notification for professional
      await supabase.from('notifications').insert({
        user_id: booking.professional_id,
        title: 'Réservation annulée',
        message: `Une réservation a été annulée par le client. Remboursement: ${refund.percentage}%`,
        type: 'booking_cancelled',
        related_id: booking.id,
        created_at: new Date().toISOString()
      });

      // Create notification for client
      await supabase.from('notifications').insert({
        user_id: booking.client_id,
        title: 'Annulation confirmée',
        message: `Votre remboursement de ${refund.amount.toLocaleString()} DJF (${refund.percentage}%) a été traité`,
        type: 'refund_processed',
        related_id: booking.id,
        created_at: new Date().toISOString()
      });

      onSuccess();
    } catch (err: any) {
      console.error('Erreur lors de l\'annulation:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  const refund = calculateRefund();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Annuler la réservation
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {refundInfo && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 text-xl mr-3 mt-0.5"></i>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Remboursement: {refundInfo.percentage}%
                </p>
                <p className="text-sm text-blue-700">
                  {refundInfo.message}
                </p>
                <p className="text-sm font-semibold text-blue-900 mt-2">
                  Montant du remboursement: {refundInfo.amount.toLocaleString()} DJF
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Détails de la réservation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium text-gray-900">{booking.services?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(booking.booking_date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Montant total:</span>
                <span className="font-medium text-gray-900">
                  {booking.total_amount?.toLocaleString()} DJF
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="ri-alert-line text-yellow-600 text-xl mr-3 mt-0.5"></i>
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">
                  Politique d'annulation
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Plus de 24h avant: Remboursement complet (100%)</li>
                  <li>• Entre 12h et 24h avant: Remboursement partiel (50%)</li>
                  <li>• Moins de 12h avant: Aucun remboursement (0%)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer whitespace-nowrap"
          >
            Retour
          </button>
          <button
            onClick={handleCancelBooking}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Annulation...
              </span>
            ) : (
              'Confirmer l\'annulation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
