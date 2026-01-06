import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface LocalPaymentInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    payment_id: string;
    transaction_reference: string;
    payment_method: 'waafipay' | 'dmoney';
    amount: number;
    phone_number: string;
    instructions: string;
    booking_id: string;
  } | null;
}

export default function LocalPaymentInstructionsModal({
  isOpen,
  onClose,
  paymentData
}: LocalPaymentInstructionsModalProps) {
  const [checking, setChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending');
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (!isOpen || !paymentData) return;

    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Check payment status every 10 seconds
    const statusChecker = setInterval(() => {
      checkPaymentStatus();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
    };
  }, [isOpen, paymentData]);

  const checkPaymentStatus = async () => {
    if (!paymentData) return;

    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/local-payment-processing`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'get_payment_status',
            payment_id: paymentData.payment_id
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'completed') {
          setPaymentStatus('completed');
          setTimeout(() => {
            window.location.href = `/payment-confirmation?booking_id=${paymentData.booking_id}`;
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setChecking(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen || !paymentData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {paymentStatus === 'completed' ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-check-line text-4xl text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Confirmed!</h2>
            <p className="text-gray-600 mb-4">Your booking has been confirmed</p>
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* Timer */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 mb-6 text-center border-2 border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Time remaining</p>
              <p className="text-3xl font-bold text-orange-600">{formatTime(countdown)}</p>
              <p className="text-xs text-gray-500 mt-1">Complete payment before time expires</p>
            </div>

            {/* Payment Method Badge */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`px-4 py-2 rounded-full ${
                paymentData.payment_method === 'waafipay' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-blue-100 text-blue-700'
              } font-semibold flex items-center gap-2`}>
                <i className={`${
                  paymentData.payment_method === 'waafipay' 
                    ? 'ri-smartphone-line' 
                    : 'ri-phone-line'
                } text-xl`}></i>
                {paymentData.payment_method === 'waafipay' ? 'WaafiPay' : 'D-Money'}
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Amount to Pay</p>
              <p className="text-4xl font-bold text-teal-600">{paymentData.amount} DJF</p>
            </div>

            {/* Transaction Reference */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={paymentData.transaction_reference}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(paymentData.transaction_reference)}
                  className="px-4 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-file-copy-line"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Copy this reference for your payment</p>
            </div>

            {/* Instructions */}
            <div className={`rounded-xl p-4 mb-6 ${
              paymentData.payment_method === 'waafipay'
                ? 'bg-orange-50 border-2 border-orange-200'
                : 'bg-blue-50 border-2 border-blue-200'
            }`}>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className="ri-information-line text-xl"></i>
                Payment Instructions
              </h3>
              <div className="space-y-2 text-sm text-gray-700 whitespace-pre-line">
                {paymentData.instructions}
              </div>
            </div>

            {/* Phone Number */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Phone Number
              </label>
              <div className="flex items-center gap-2">
                <span className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium">
                  +253
                </span>
                <input
                  type="text"
                  value={paymentData.phone_number}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            {/* Status Check */}
            <button
              onClick={checkPaymentStatus}
              disabled={checking}
              className="w-full bg-teal-500 text-white py-3 px-6 rounded-lg hover:bg-teal-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-4 whitespace-nowrap cursor-pointer"
            >
              {checking ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-loader-4-line animate-spin"></i>
                  Checking Status...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="ri-refresh-line"></i>
                  Check Payment Status
                </span>
              )}
            </button>

            {/* Help Text */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 flex items-start gap-2">
                <i className="ri-lightbulb-line text-lg flex-shrink-0 mt-0.5"></i>
                <span>
                  After completing the payment on your phone, click "Check Payment Status" to verify. 
                  Your booking will be confirmed automatically once payment is received.
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
