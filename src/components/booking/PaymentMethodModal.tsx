import { useState } from 'react';

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPayment: (method: 'stripe' | 'waafipay' | 'dmoney', phoneNumber?: string) => void;
  amount: number;
  loading?: boolean;
}

export default function PaymentMethodModal({ 
  isOpen, 
  onClose, 
  onSelectPayment, 
  amount,
  loading = false 
}: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'waafipay' | 'dmoney' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile' | 'cash'>('card');
  const [mobileProvider, setMobileProvider] = useState<'waafi' | 'dmoney' | 'evc_plus' | 'zaad'>('waafi');
  const [mobilePhone, setMobilePhone] = useState('');

  if (!isOpen) return null;

  const handleContinue = () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    if ((selectedMethod === 'waafipay' || selectedMethod === 'dmoney') && !phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if ((selectedMethod === 'waafipay' || selectedMethod === 'dmoney') && !phoneNumber.match(/^[0-9]{8}$/)) {
      setError('Please enter a valid 8-digit phone number');
      return;
    }

    setError('');
    onSelectPayment(selectedMethod, phoneNumber || undefined);
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'card') {
        // ... existing code for Stripe payment ...
      } else if (paymentMethod === 'mobile') {
        // Paiement mobile
        if (!mobilePhone) {
          setError('Veuillez entrer votre numéro de téléphone');
          setLoading(false);
          return;
        }

        // Créer un paiement local
        const { data: localPayment, error: paymentError } = await supabase
          .from('local_payments')
          .insert({
            booking_id: booking.id,
            amount: booking.services.price,
            payment_method: mobileProvider,
            phone_number: mobilePhone,
            status: 'pending',
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Traiter le split de commission
        await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/process-commission-split`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: booking.id,
              paymentIntentId: localPayment.id,
              paymentMethod: mobileProvider,
            }),
          }
        );

        // Mettre à jour le statut de la réservation
        await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'pending',
          })
          .eq('id', booking.id);

        alert(`Paiement mobile initié via ${mobileProvider}. Vous recevrez une notification de confirmation.`);
        onSuccess();
      } else if (paymentMethod === 'cash') {
        // ... existing code for cash payment ...
      }
    } catch (err: any) {
      console.error('Erreur de paiement:', err);
      setError(err.message || 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Payment Method</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Amount Display */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-gray-600 mb-2">Total Amount</p>
          <p className="text-4xl font-bold text-teal-600">{amount} DJF</p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-4 mb-6">
          {/* Stripe Card Payment */}
          <button
            onClick={() => setSelectedMethod('stripe')}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === 'stripe'
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 hover:border-teal-300'
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'stripe' ? 'bg-teal-500' : 'bg-gray-100'
                }`}>
                  <i className={`ri-bank-card-line text-2xl ${
                    selectedMethod === 'stripe' ? 'text-white' : 'text-gray-600'
                  }`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Credit/Debit Card</h3>
                  <p className="text-sm text-gray-600">Pay with Visa, Mastercard, or other cards</p>
                </div>
              </div>
              {selectedMethod === 'stripe' && (
                <i className="ri-check-circle-fill text-2xl text-teal-500"></i>
              )}
            </div>
          </button>

          {/* WaafiPay */}
          <button
            onClick={() => setSelectedMethod('waafipay')}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === 'waafipay'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-orange-300'
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'waafipay' ? 'bg-orange-500' : 'bg-gray-100'
                }`}>
                  <i className={`ri-smartphone-line text-2xl ${
                    selectedMethod === 'waafipay' ? 'text-white' : 'text-gray-600'
                  }`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    WaafiPay
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Local
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">Pay with your WaafiPay mobile wallet</p>
                </div>
              </div>
              {selectedMethod === 'waafipay' && (
                <i className="ri-check-circle-fill text-2xl text-orange-500"></i>
              )}
            </div>
          </button>

          {/* D-Money */}
          <button
            onClick={() => setSelectedMethod('dmoney')}
            disabled={loading}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
              selectedMethod === 'dmoney'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'dmoney' ? 'bg-blue-500' : 'bg-gray-100'
                }`}>
                  <i className={`ri-phone-line text-2xl ${
                    selectedMethod === 'dmoney' ? 'text-white' : 'text-gray-600'
                  }`}></i>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    D-Money
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Local
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">Pay with your D-Money mobile account</p>
                </div>
              </div>
              {selectedMethod === 'dmoney' && (
                <i className="ri-check-circle-fill text-2xl text-blue-500"></i>
              )}
            </div>
          </button>
        </div>

        {/* Phone Number Input for Local Payments */}
        {(selectedMethod === 'waafipay' || selectedMethod === 'dmoney') && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="flex items-center gap-2">
              <span className="px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium">
                +253
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setPhoneNumber(value);
                  setError('');
                }}
                placeholder="77123456"
                maxLength={8}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your {selectedMethod === 'waafipay' ? 'WaafiPay' : 'D-Money'} registered phone number
            </p>
          </div>
        )}

        {/* Payment Info */}
        {selectedMethod && (
          <div className={`rounded-xl p-4 mb-6 ${
            selectedMethod === 'stripe' ? 'bg-teal-50 border-2 border-teal-200' :
            selectedMethod === 'waafipay' ? 'bg-orange-50 border-2 border-orange-200' :
            'bg-blue-50 border-2 border-blue-200'
          }`}>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <i className="ri-information-line"></i>
              Payment Instructions
            </h4>
            {selectedMethod === 'stripe' && (
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-teal-600 mt-0.5"></i>
                  <span>Secure payment processing via Stripe</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-teal-600 mt-0.5"></i>
                  <span>Accepts all major credit and debit cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-teal-600 mt-0.5"></i>
                  <span>Instant confirmation</span>
                </li>
              </ul>
            )}
            {selectedMethod === 'waafipay' && (
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-orange-600 mt-0.5"></i>
                  <span>You'll receive payment instructions on your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-orange-600 mt-0.5"></i>
                  <span>Open WaafiPay app to complete payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-orange-600 mt-0.5"></i>
                  <span>Confirmation within minutes</span>
                </li>
              </ul>
            )}
            {selectedMethod === 'dmoney' && (
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-blue-600 mt-0.5"></i>
                  <span>Dial *770# on your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-blue-600 mt-0.5"></i>
                  <span>Follow the payment instructions</span>
                </li>
                <li className="flex items-start gap-2">
                  <i className="ri-check-line text-blue-600 mt-0.5"></i>
                  <span>Confirmation within minutes</span>
                </li>
              </ul>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 flex items-center gap-2">
              <i className="ri-error-warning-line"></i>
              {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedMethod || loading}
            className="flex-1 bg-teal-500 text-white px-6 py-3 rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin"></i>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue
                <i className="ri-arrow-right-line"></i>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
