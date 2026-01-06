import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import PaymentMethodModal from './PaymentMethodModal';
import LocalPaymentInstructionsModal from './LocalPaymentInstructionsModal';

interface ProfessionalProfile {
  id: string;
  full_name: string;
  business_name?: string;
  service_category: string;
  rating: number;
  avatar_url?: string;
  phone?: string;
}

interface BookingModalProps {
  professional: ProfessionalProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_hours: number;
  description?: string;
}

export default function BookingModal({ professional, isOpen, onClose }: BookingModalProps) {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  
  // États pour les localisations
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [professionalServiceZones, setProfessionalServiceZones] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    address_city: '',
    address_district: '',
    address_details: '',
    notes: '',
    service_description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showLocalPaymentModal, setShowLocalPaymentModal] = useState(false);
  const [localPaymentData, setLocalPaymentData] = useState<any>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  // Load professional's services and service zones
  useEffect(() => {
    if (isOpen && professional) {
      loadServices();
      loadLocations();
      loadProfessionalServiceZones();
    }
  }, [isOpen, professional]);

  const loadServices = async () => {
    if (!professional?.id) return;
    
    setLoadingServices(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, description, price, duration_minutes')
        .eq('professional_id', professional.id)
        .eq('is_active', true);

      if (error) throw error;
      
      setServices(data || []);
      
      // Auto-select first service if available
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, service_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading services:', err);
    } finally {
      setLoadingServices(false);
    }
  };

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

  const loadProfessionalServiceZones = async () => {
    if (!professional?.id) return;
    
    try {
      console.log('🔍 Chargement des zones de service pour le professionnel:', professional.id);
      
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('service_zones')
        .eq('id', professional.id)
        .single();

      if (error) {
        console.error('❌ Erreur lors du chargement des zones de service:', error);
        throw error;
      }
      
      console.log('✅ Données reçues:', data);
      console.log('📍 Zones de service:', data?.service_zones);
      console.log('📊 Type de données:', typeof data?.service_zones);
      console.log('📏 Nombre de zones:', data?.service_zones?.length || 0);
      
      const zones = data?.service_zones || [];
      setProfessionalServiceZones(zones);
      
      if (zones.length === 0) {
        console.warn('⚠️ Aucune zone de service définie pour ce professionnel');
      } else {
        console.log('✅ Zones de service chargées avec succès:', zones);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des zones de service:', err);
    }
  };

  // Obtenir les villes disponibles dans les zones de service du professionnel
  const availableCities = locations.filter(loc => {
    const isAvailable = loc.type === 'ville' && professionalServiceZones.includes(loc.name);
    if (loc.type === 'ville') {
      console.log(`🏙️ Ville "${loc.name}": ${isAvailable ? '✅ Disponible' : '❌ Non disponible'}`);
    }
    return isAvailable;
  });

  console.log('📋 Villes disponibles:', availableCities.map(c => c.name));
  console.log('📋 Total villes disponibles:', availableCities.length);

  // Obtenir les quartiers disponibles pour la ville sélectionnée
  const availableDistricts = formData.address_city 
    ? locations.filter(loc => {
        const ville = locations.find(v => v.name === formData.address_city && v.type === 'ville');
        return loc.type === 'quartier' && 
               loc.parent_id === ville?.id && 
               professionalServiceZones.includes(loc.name);
      })
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !professional) return;

    if (!formData.service_id) {
      setError('Veuillez sélectionner un service');
      return;
    }

    if (!formData.address_city) {
      setError('Veuillez sélectionner une ville pour l\'intervention');
      return;
    }

    if (!formData.address_details.trim()) {
      setError('Veuillez fournir les détails de l\'adresse');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get selected service details
      const selectedService = services.find(s => s.id === formData.service_id);
      if (!selectedService) {
        throw new Error('Service not found');
      }

      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);
      
      // Calculate amounts
      const totalAmount = selectedService.price;
      const commissionAmount = totalAmount * 0.10;

      // Construire l'adresse complète
      const fullAddress = [
        formData.address_details,
        formData.address_district,
        formData.address_city
      ].filter(Boolean).join(', ');

      console.log('📝 Creating booking with data:', {
        client_id: profile.id,
        professional_id: professional.id,
        service_id: formData.service_id,
        address: fullAddress,
        total_amount: totalAmount
      });

      // Step 1: Create booking first (with pending payment status)
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: profile.id,
          professional_id: professional.id,
          service_id: formData.service_id,
          scheduled_date: scheduledDateTime.toISOString(),
          address: fullAddress,
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          notes: `${formData.service_description}\n\n${formData.notes}`,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (bookingError) {
        console.error('❌ Booking creation error:', bookingError);
        throw bookingError;
      }

      console.log('✅ Booking created successfully:', bookingData.id);
      setCurrentBookingId(bookingData.id);
      
      // Send WhatsApp notification to professional
      if (professional?.phone) {
        const whatsappMessage = `🎉 *Nouvelle réservation !*\n\n👤 Client : ${user.user_metadata?.full_name || 'Client'}\n📅 Date : ${new Date(formData.scheduled_date).toLocaleDateString('fr-FR')}\n⏰ Heure : ${formData.scheduled_time}\n📍 Adresse : ${fullAddress}\n💰 Montant : ${totalAmount} DJF\n\nConnectez-vous à votre tableau de bord pour accepter la réservation.`;
        const phone = professional.phone.replace(/[^0-9]/g, '');
        const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Open WhatsApp in new tab
        window.open(whatsappLink, '_blank');
      }
      
      setLoading(false);
      
      // Step 2: Show payment method selection modal
      setShowPaymentMethodModal(true);

    } catch (err: any) {
      console.error('❌ Booking error:', err);
      setError(err.message || 'Une erreur est survenue lors de la réservation');
      setLoading(false);
      setCurrentBookingId(null);
    }
  };

  const handlePaymentMethodSelected = async (
    method: 'stripe' | 'waafipay' | 'dmoney',
    phoneNumber?: string
  ) => {
    if (!currentBookingId) {
      console.error('❌ No booking ID available');
      setError('Erreur: ID de réservation manquant. Veuillez réessayer.');
      setShowPaymentMethodModal(true);
      return;
    }

    console.log('💳 Processing payment:', {
      method,
      bookingId: currentBookingId,
      phoneNumber
    });

    setProcessingPayment(true);
    setShowPaymentMethodModal(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (method === 'stripe') {
        // Process Stripe payment
        console.log('💳 Initiating Stripe payment for booking:', currentBookingId);
        
        const paymentResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/payment-processing`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'create_payment_intent',
              booking_id: currentBookingId,
              amount: services.find(s => s.id === formData.service_id)?.price
            })
          }
        );

        if (!paymentResponse.ok) {
          const errorData = await paymentResponse.json();
          throw new Error(errorData.error || 'Payment processing failed');
        }

        const { paymentIntentId } = await paymentResponse.json();

        // Simulate successful payment in test mode
        const updateResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/payment-processing`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'simulate_test_payment',
              payment_intent_id: paymentIntentId,
              booking_id: currentBookingId
            })
          }
        );

        if (!updateResponse.ok) {
          throw new Error('Payment confirmation failed');
        }

        const updateData = await updateResponse.json();
        
        if (!updateData.success) {
          throw new Error('Payment was not successful');
        }

        setProcessingPayment(false);

        setSuccess(true);
        
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            service_id: '',
            scheduled_date: '',
            scheduled_time: '',
            address_city: '',
            address_district: '',
            address_details: '',
            notes: '',
            service_description: ''
          });
          setCurrentBookingId(null);
          window.location.reload();
        }, 2000);

      } else {
        // Process local payment (WaafiPay or D-Money)
        console.log('📱 Initiating local payment:', {
          method,
          bookingId: currentBookingId,
          phoneNumber
        });

        if (!phoneNumber) {
          throw new Error('Numéro de téléphone requis pour le paiement local');
        }

        const localPaymentResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/local-payment-processing`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'initiate_local_payment',
              booking_id: currentBookingId,
              payment_method: method,
              phone_number: phoneNumber
            })
          }
        );

        const responseText = await localPaymentResponse.text();
        console.log('📱 Local payment response:', responseText);

        if (!localPaymentResponse.ok) {
          let errorMessage = 'Local payment initiation failed';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
            console.error('❌ Local payment error:', errorData);
          } catch (e) {
            console.error('❌ Failed to parse error response:', responseText);
          }
          throw new Error(errorMessage);
        }

        const paymentData = JSON.parse(responseText);
        console.log('✅ Local payment initiated:', paymentData);
        
        setLocalPaymentData({
          ...paymentData,
          booking_id: currentBookingId
        });
        setProcessingPayment(false);
        setShowLocalPaymentModal(true);
      }

    } catch (err: any) {
      console.error('❌ Payment error:', err);
      setError(err.message || 'Payment processing failed');
      setProcessingPayment(false);
      setShowPaymentMethodModal(true);
    }
  };

  // Obtenir la date minimale (aujourd'hui)
  const minDate = new Date().toISOString().split('T')[0];

  // Fonction helper pour formater la date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get selected service details
  const selectedService = services.find(s => s.id === formData.service_id);

  if (!isOpen || !professional) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Réserver ce professionnel</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Détails du professionnel */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                {professional.avatar_url ? (
                  <img 
                    src={professional.avatar_url} 
                    alt={professional.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                    <i className="ri-user-line text-orange-500 text-2xl"></i>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{professional.full_name}</h3>
                {professional.business_name && (
                  <p className="text-sm text-orange-600 font-medium">{professional.business_name}</p>
                )}
                <p className="text-sm text-gray-600">{professional.service_category}</p>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`ri-star-${i < Math.floor(professional.rating) ? 'fill' : 'line'} text-yellow-400 text-sm`}
                    ></i>
                  ))}
                  <span className="text-sm text-gray-500 ml-1">({professional.rating})</span>
                </div>
              </div>
            </div>
            
            {/* Zones de service du professionnel */}
            {professionalServiceZones.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  <i className="ri-map-pin-line mr-1"></i>
                  Zones de service :
                </p>
                <div className="flex flex-wrap gap-1">
                  {professionalServiceZones.slice(0, 5).map((zone, idx) => (
                    <span key={idx} className="inline-block px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs">
                      {zone}
                    </span>
                  ))}
                  {professionalServiceZones.length > 5 && (
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{professionalServiceZones.length - 5} autres
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Test Mode Banner */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <i className="ri-flask-line text-yellow-600 text-xl mr-2 flex-shrink-0"></i>
              <div className="flex-1">
                <p className="text-yellow-800 font-semibold text-sm">🧪 Stripe Test Mode Active</p>
                <p className="text-yellow-700 text-xs mt-1">Use test card: <code className="bg-yellow-100 px-1 rounded">4242 4242 4242 4242</code></p>
                <p className="text-yellow-700 text-xs">No real charges will be made</p>
              </div>
            </div>
          </div>

          {!user && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-800 text-sm">
                <i className="ri-information-line mr-2"></i>
                Vous devez être connecté pour réserver un service.
              </p>
            </div>
          )}

          {user && profile?.user_type !== 'client' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                <i className="ri-alert-line mr-2"></i>
                Seuls les clients peuvent réserver des services.
              </p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <i className="ri-check-line text-green-600 text-xl mr-2"></i>
                <div>
                  <p className="text-green-800 font-medium">Réservation confirmée & Paiement réussi !</p>
                  <p className="text-green-700 text-sm">Vous recevrez une notification de confirmation.</p>
                </div>
              </div>
            </div>
          )}

          {user && profile?.user_type === 'client' && !success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service souhaité *
                </label>
                {loadingServices ? (
                  <div className="flex items-center justify-center py-4">
                    <i className="ri-loader-4-line animate-spin text-orange-500 text-xl"></i>
                  </div>
                ) : services.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      <i className="ri-alert-line mr-2"></i>
                      Ce professionnel n'a pas encore ajouté de services. Veuillez le contacter directement.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.service_id || ''}
                      onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="">Sélectionner un service</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.title} - {service.price} DJF
                          {service.duration_minutes && ` (${Math.floor(service.duration_minutes / 60)}h${service.duration_minutes % 60 > 0 ? ` ${service.duration_minutes % 60}min` : ''})`}
                        </option>
                      ))}
                    </select>

                    {/* Service Details */}
                    {selectedService && (
                      <div className="bg-teal-50 p-4 rounded-lg mt-3">
                        <h4 className="font-semibold text-teal-900 mb-2">Détails du service</h4>
                        <div className="space-y-2 text-sm text-teal-800">
                          <p><span className="font-medium">Service:</span> {selectedService.title}</p>
                          {selectedService.description && (
                            <p><span className="font-medium">Description:</span> {selectedService.description}</p>
                          )}
                          {selectedService.duration_minutes && (
                            <p><span className="font-medium">Durée:</span> {Math.floor(selectedService.duration_minutes / 60)}h{selectedService.duration_minutes % 60 > 0 ? ` ${selectedService.duration_minutes % 60}min` : ''}</p>
                          )}
                          <p><span className="font-medium">Prix:</span> {selectedService.price} DJF</p>
                          <p><span className="font-medium">Commission (10%):</span> {(selectedService.price * 0.1).toFixed(0)} DJF</p>
                          <p className="font-semibold text-lg"><span className="font-medium">Total:</span> {selectedService.price} DJF</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Détails supplémentaires
                </label>
                <textarea
                  value={formData.service_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  rows={2}
                  placeholder="Décrivez vos besoins spécifiques (optionnel)"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.service_description.length}/200 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date souhaitée *
                </label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure souhaitée *
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Adresse d'intervention */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <i className="ri-map-pin-line text-teal-600"></i>
                  Adresse d'intervention
                </h4>
                
                {/* Debug info - À retirer après correction */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-3 p-3 bg-gray-100 rounded-lg text-xs">
                    <p className="font-medium mb-1">🔍 Debug Info:</p>
                    <p>Zones de service: {professionalServiceZones.length > 0 ? professionalServiceZones.join(', ') : 'Aucune'}</p>
                    <p>Villes disponibles: {availableCities.length}</p>
                    <p>Localisations chargées: {locations.length}</p>
                  </div>
                )}
                
                {professionalServiceZones.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      <i className="ri-alert-line mr-2"></i>
                      Ce professionnel n'a pas encore défini ses zones de service.
                    </p>
                    <p className="text-yellow-700 text-xs mt-2">
                      Le professionnel doit configurer ses zones de service dans son tableau de bord.
                    </p>
                  </div>
                ) : availableCities.length === 0 ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-orange-800 text-sm">
                      <i className="ri-alert-line mr-2"></i>
                      Les zones de service de ce professionnel ne correspondent pas aux villes disponibles.
                    </p>
                    <p className="text-orange-700 text-xs mt-2">
                      Zones définies: {professionalServiceZones.join(', ')}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Ville */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ville *
                      </label>
                      {loadingLocations ? (
                        <div className="flex items-center justify-center py-2">
                          <i className="ri-loader-4-line animate-spin text-teal-500"></i>
                        </div>
                      ) : (
                        <select
                          value={formData.address_city}
                          onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value, address_district: '' }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                          required
                        >
                          <option value="">Sélectionnez une ville</option>
                          {availableCities.map(city => (
                            <option key={city.id} value={city.name}>{city.name}</option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Zones disponibles pour ce professionnel
                      </p>
                    </div>

                    {/* Quartier */}
                    {formData.address_city && availableDistricts.length > 0 && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quartier (optionnel)
                        </label>
                        <select
                          value={formData.address_district}
                          onChange={(e) => setFormData(prev => ({ ...prev, address_district: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        >
                          <option value="">Sélectionnez un quartier</option>
                          {availableDistricts.map(district => (
                            <option key={district.id} value={district.name}>{district.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Détails de l'adresse */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse complète *
                      </label>
                      <textarea
                        required
                        value={formData.address_details}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_details: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        rows={3}
                        placeholder="Numéro, rue, bâtiment, étage, points de repère..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes complémentaires
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  rows={3}
                  placeholder="Informations supplémentaires pour le professionnel (optionnel)"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.notes.length}/500 caractères</p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    <i className="ri-error-warning-line mr-2"></i>
                    {error}
                  </p>
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-teal-50 rounded-lg p-4 border-2 border-teal-200">
                <h4 className="font-semibold text-teal-900 mb-2 flex items-center">
                  <i className="ri-secure-payment-line mr-2"></i>
                  Informations de paiement
                </h4>
                <ul className="text-sm text-teal-800 space-y-1">
                  <li className="flex items-start">
                    <i className="ri-check-line text-teal-600 mr-2 mt-0.5"></i>
                    <span>Le paiement sera traité immédiatement via Stripe</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-teal-600 mr-2 mt-0.5"></i>
                    <span>Le professionnel reçoit 90% dans les 7 jours après le service</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-teal-600 mr-2 mt-0.5"></i>
                    <span>Commission de plateforme de 10% incluse</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-teal-600 mr-2 mt-0.5"></i>
                    <span>Traitement de paiement sécurisé</span>
                  </li>
                </ul>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Politique d'annulation</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start">
                    <i className="ri-check-line text-orange-500 mr-2 mt-0.5"></i>
                    <span>Annulation 24h+ avant : Remboursement 100%</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-orange-500 mr-2 mt-0.5"></i>
                    <span>Annulation 12-24h avant : Remboursement 50%</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-orange-500 mr-2 mt-0.5"></i>
                    <span>Annulation moins de 12h : Aucun remboursement</span>
                  </li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || services.length === 0 || processingPayment || professionalServiceZones.length === 0}
                  className="flex-1 bg-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
                >
                  {processingPayment ? (
                    <span className="flex items-center justify-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Traitement du paiement...
                    </span>
                  ) : loading ? (
                    <span className="flex items-center justify-center">
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Confirmation...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="ri-secure-payment-line mr-2"></i>
                      Payer & Confirmer
                    </span>
                  )}
                </button>
              </div>
            </form>
          )}

          {!user && (
            <div className="text-center">
              <button 
                onClick={() => window.REACT_APP_NAVIGATE('/profile')}
                className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Se connecter pour réserver
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
          setCurrentBookingId(null);
        }}
        onSelectPayment={handlePaymentMethodSelected}
        amount={services.find(s => s.id === formData.service_id)?.price || 0}
        loading={processingPayment}
      />

      {/* Local Payment Instructions Modal */}
      <LocalPaymentInstructionsModal
        isOpen={showLocalPaymentModal}
        onClose={() => {
          setShowLocalPaymentModal(false);
          setLocalPaymentData(null);
          setCurrentBookingId(null);
          onClose();
        }}
        paymentData={localPaymentData}
      />
    </>
  );
}
