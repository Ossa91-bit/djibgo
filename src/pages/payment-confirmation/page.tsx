
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import SEOHead from '../../components/feature/SEOHead';
import { supabase } from '../../lib/supabase';

interface BookingDetails {
  id: string;
  total_amount: number;
  commission_amount: number;
  payment_status: string;
  payment_date: string;
  scheduled_date: string;
  status: string;
  booking_reference: string;
  service: {
    title: string;
    description: string;
  };
  professional: {
    full_name: string;
    phone: string;
    email: string;
  };
  client: {
    full_name: string;
    email: string;
  };
}

export default function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const bookingId = searchParams.get('booking_id');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const processPayment = async () => {
      if (!paymentIntentId) {
        setError('Aucune réservation trouvée');
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/');
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            id,
            total_amount,
            commission_amount,
            payment_status,
            payment_date,
            scheduled_date,
            status,
            booking_reference,
            service:services(title, description),
            professional:profiles!bookings_professional_id_fkey(full_name, phone, email),
            client:profiles!bookings_client_id_fkey(full_name, email)
          `)
          .eq('id', bookingId)
          .single();

        if (fetchError || !data) {
          setError('Impossible de charger les détails de la réservation');
          setLoading(false);
          return;
        }

        setBooking(data as unknown as BookingDetails);
        setLoading(false);

        // Traiter le split de commission
        try {
          await fetch(
            `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/process-commission-split`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                bookingId: booking.id,
                paymentIntentId: paymentIntentId,
                paymentMethod: 'card',
              }),
            }
          );
        } catch (splitError) {
          console.error('Erreur lors du split de commission:', splitError);
          // Ne pas bloquer le flux même si le split échoue
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Une erreur est survenue');
        setLoading(false);
      }
    };

    processPayment();
  }, [paymentIntentId, navigate]);

  const downloadReceipt = () => {
    if (!booking) return;

    const receiptContent = `
REÇU DE PAIEMENT
================

Référence: #${booking.booking_reference}
Date: ${new Date(booking.payment_date).toLocaleDateString('fr-FR')}

SERVICE
-------
${booking.service.title}

MONTANT
-------
Total payé: ${booking.total_amount} DJF
Commission: ${booking.commission_amount} DJF
Net professionnel: ${booking.total_amount - booking.commission_amount} DJF

PROFESSIONNEL
-------------
${booking.professional.full_name}
${booking.professional.email}
${booking.professional.phone}

CLIENT
------
${booking.client.full_name}
${booking.client.email}

DATE DE PRESTATION
------------------
${new Date(booking.scheduled_date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

STATUT
------
Paiement: ${booking.payment_status === 'paid' ? 'Payé' : 'En attente'}
Réservation: ${booking.status === 'confirmed' ? 'Confirmée' : booking.status}

Transaction ID: ${paymentIntentId || 'N/A'}

---
Readdy Services
© ${new Date().getFullYear()}
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-${booking.booking_reference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Confirmation de paiement"
          description="Confirmation de votre paiement"
          keywords="paiement, confirmation, réservation"
        />
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement des détails...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <SEOHead
          title="Erreur - Confirmation de paiement"
          description="Erreur lors de la confirmation de paiement"
          keywords="paiement, erreur"
        />
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-error-warning-line text-4xl text-red-500"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Erreur</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition whitespace-nowrap"
              >
                Retour au tableau de bord
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const netAmount = booking.total_amount - booking.commission_amount;

  return (
    <>
      <SEOHead
        title="Paiement confirmé - Readdy Services"
        description="Votre paiement a été confirmé avec succès"
        keywords="paiement confirmé, réservation, confirmation"
      />
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
        <Header />
        
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                <i className="ri-check-line text-5xl text-white"></i>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Paiement Confirmé !
              </h1>
              <p className="text-xl text-gray-600">
                Votre réservation est confirmée
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <div>
                  <span className="text-sm text-gray-500">Référence</span>
                  <p className="text-lg font-bold text-gray-900">#{booking.booking_reference}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Date de paiement</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(booking.payment_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="text-center py-8 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl mb-6">
                <span className="text-sm text-gray-600 uppercase tracking-wide">Montant payé</span>
                <div className="text-5xl font-bold text-teal-600 my-2">
                  {booking.total_amount} DJF
                </div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mt-2">
                  <i className="ri-check-line"></i>
                  Paiement réussi
                </div>
              </div>

              {/* Service Details */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-service-line text-2xl text-teal-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{booking.service.title}</h3>
                    <p className="text-sm text-gray-600">{booking.service.description}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-user-line text-2xl text-blue-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{booking.professional.full_name}</h3>
                    <p className="text-sm text-gray-600">{booking.professional.email}</p>
                    <p className="text-sm text-gray-600">{booking.professional.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="ri-calendar-line text-2xl text-purple-600"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Date de prestation</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.scheduled_date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Détails financiers</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Montant total</span>
                    <span className="font-semibold">{booking.total_amount} DJF</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Commission plateforme (10%)</span>
                    <span className="font-semibold">-{booking.commission_amount} DJF</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-teal-600 pt-3 border-t border-gray-200">
                    <span>Montant professionnel</span>
                    <span>{netAmount} DJF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <i className="ri-information-line text-blue-600"></i>
                Prochaines étapes
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Confirmation envoyée</h3>
                    <p className="text-gray-600 text-sm">
                      Un email de confirmation a été envoyé à votre adresse email avec tous les détails
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Professionnel notifié</h3>
                    <p className="text-gray-600 text-sm">
                      Le professionnel a reçu votre réservation et vous contactera avant la date prévue
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Prestation du service</h3>
                    <p className="text-gray-600 text-sm">
                      Le professionnel effectuera la prestation à la date et l'heure convenues
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Paiement du professionnel</h3>
                    <p className="text-gray-600 text-sm">
                      Le professionnel recevra son paiement sous 7 jours ouvrables après la prestation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 mb-6 border-l-4 border-amber-500">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <i className="ri-alert-line text-amber-600"></i>
                Politique d'annulation
              </h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <i className="ri-check-line text-green-600 mt-1"></i>
                  <p><strong>Plus de 24h avant :</strong> Remboursement complet (100%)</p>
                </div>
                <div className="flex items-start gap-3">
                  <i className="ri-check-line text-orange-600 mt-1"></i>
                  <p><strong>Entre 12h et 24h :</strong> Remboursement partiel (50%)</p>
                </div>
                <div className="flex items-start gap-3">
                  <i className="ri-close-line text-red-600 mt-1"></i>
                  <p><strong>Moins de 12h :</strong> Aucun remboursement</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-teal-500 text-white px-8 py-4 rounded-lg hover:bg-teal-600 transition flex items-center gap-2 font-semibold shadow-lg whitespace-nowrap"
              >
                <i className="ri-dashboard-line"></i>
                Voir mon tableau de bord
              </button>
              <button
                onClick={downloadReceipt}
                className="bg-white text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 font-semibold border-2 border-gray-200 shadow-lg whitespace-nowrap"
              >
                <i className="ri-download-line"></i>
                Télécharger le reçu
              </button>
            </div>

            {/* Support */}
            <div className="text-center mt-8 text-gray-600">
              <p className="mb-2">Besoin d'aide ?</p>
              <button
                onClick={() => navigate('/support')}
                className="text-teal-600 hover:text-teal-700 font-semibold whitespace-nowrap"
              >
                Contactez notre support →
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
