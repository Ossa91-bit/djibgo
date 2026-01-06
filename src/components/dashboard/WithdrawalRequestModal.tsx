import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface WithdrawalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  professionalId: string;
  withdrawalRequests: any[];
  loading: boolean;
}

const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  professionalId,
  withdrawalRequests,
  loading
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'waafipay' | 'dmoney' | 'bank_transfer'>('waafipay');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }

    if (amountNum < 5000) {
      setError('Le montant minimum de retrait est de 5000 DJF');
      return;
    }

    if (amountNum > availableBalance) {
      setError('Montant supérieur au solde disponible');
      return;
    }

    if ((method === 'waafipay' || method === 'dmoney') && !phoneNumber) {
      setError('Veuillez entrer un numéro de téléphone');
      return;
    }

    if (method === 'bank_transfer' && (!bankName || !accountNumber || !accountName)) {
      setError('Veuillez remplir toutes les informations bancaires');
      return;
    }

    setSubmitting(true);

    try {
      const paymentDetails: any = {
        method
      };

      if (method === 'waafipay' || method === 'dmoney') {
        paymentDetails.phone_number = phoneNumber;
      } else if (method === 'bank_transfer') {
        paymentDetails.bank_name = bankName;
        paymentDetails.account_number = accountNumber;
        paymentDetails.account_name = accountName;
      }

      const { error: insertError } = await supabase
        .from('withdrawal_requests')
        .insert({
          professional_id: professionalId,
          amount: amountNum,
          payment_method: method,
          payment_details: paymentDetails,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Reset form
      setAmount('');
      setPhoneNumber('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      setShowCreateForm(false);
      
      // Close modal and refresh
      onClose();
    } catch (err: any) {
      console.error('Error creating withdrawal request:', err);
      setError(err.message || 'Erreur lors de la création de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; text: string; icon: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'En attente', icon: 'ri-time-line' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'En cours', icon: 'ri-loader-4-line' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Complété', icon: 'ri-check-line' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejeté', icon: 'ri-close-line' }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${badge.color}`}>
        <i className={badge.icon}></i>
        {badge.text}
      </span>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      waafipay: 'WaafiPay',
      dmoney: 'D-Money',
      bank_transfer: 'Virement bancaire'
    };
    return labels[method] || method;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Demandes de retrait</h2>
            <p className="text-sm text-gray-600 mt-1">
              Solde disponible: <span className="font-bold text-teal-600">{availableBalance.toLocaleString()} DJF</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-2xl text-gray-600"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showCreateForm ? (
            <>
              {/* Create Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full mb-6 px-6 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <i className="ri-add-line text-xl"></i>
                Nouvelle demande de retrait
              </button>

              {/* Requests List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : withdrawalRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-inbox-line text-4xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600 font-medium">Aucune demande de retrait</p>
                  <p className="text-sm text-gray-500 mt-1">Créez votre première demande pour retirer vos gains</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawalRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            {request.amount.toLocaleString()} DJF
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {getMethodLabel(request.payment_method)}
                          </p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <i className="ri-calendar-line"></i>
                          <span>{new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {request.processed_at && (
                          <div className="flex items-center gap-1">
                            <i className="ri-check-double-line"></i>
                            <span>Traité le {new Date(request.processed_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>

                      {request.admin_notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-semibold text-gray-700 mb-1">Note de l'administrateur:</p>
                          <p className="text-sm text-gray-600">{request.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
              >
                <i className="ri-arrow-left-line"></i>
                Retour à la liste
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Montant à retirer (DJF)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 50000"
                  min="5000"
                  max={availableBalance}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Montant minimum: 5000 DJF • Disponible: {availableBalance.toLocaleString()} DJF
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Méthode de paiement
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('waafipay')}
                    className={`p-4 border-2 rounded-xl transition-all whitespace-nowrap ${
                      method === 'waafipay'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <i className="ri-smartphone-line text-2xl mb-2"></i>
                      <p className="font-semibold text-sm">WaafiPay</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('dmoney')}
                    className={`p-4 border-2 rounded-xl transition-all whitespace-nowrap ${
                      method === 'dmoney'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <i className="ri-wallet-3-line text-2xl mb-2"></i>
                      <p className="font-semibold text-sm">D-Money</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('bank_transfer')}
                    className={`p-4 border-2 rounded-xl transition-all whitespace-nowrap ${
                      method === 'bank_transfer'
                        ? 'border-teal-600 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <i className="ri-bank-line text-2xl mb-2"></i>
                      <p className="font-semibold text-sm">Virement</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              {(method === 'waafipay' || method === 'dmoney') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+253 77 12 34 56"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              )}

              {method === 'bank_transfer' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom de la banque
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Ex: Banque de Djibouti"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Numéro de compte
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Ex: 123456789"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nom du titulaire
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ex: Mohamed Ahmed"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-4 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Création en cours...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-line"></i>
                    Créer la demande
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequestModal;
