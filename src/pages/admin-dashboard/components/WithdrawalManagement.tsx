import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface WithdrawalRequest {
  id: string;
  amount: number;
  payout_method: string;
  payout_details: any;
  status: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
  professional_id: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
  professional_wallets: {
    waafi_phone: string | null;
    dmoney_phone: string | null;
    bank_account_number: string | null;
  };
}

export const WithdrawalManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('pending');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const withdrawalsPerPage = 10;

  useEffect(() => {
    loadWithdrawals();
  }, [filter]);

  const loadWithdrawals = async () => {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles!withdrawal_requests_professional_id_fkey(full_name, email, phone),
          professional_wallets!withdrawal_requests_wallet_id_fkey(waafi_phone, dmoney_phone, bank_account_number)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (withdrawal: WithdrawalRequest) => {
    setSelectedWithdrawal(withdrawal);
    setShowProcessModal(true);
  };

  const updateWithdrawalStatus = async (
    withdrawalId: string,
    status: string,
    notes: string,
    transactionRef?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates: any = {
        status,
        admin_notes: notes,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      };

      if (transactionRef) {
        updates.transaction_reference = transactionRef;
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updates)
        .eq('id', withdrawalId);

      if (error) throw error;

      // Si approuvé ou complété, mettre à jour le portefeuille
      if (status === 'completed') {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          // Déduire du pending_balance et ajouter au total_withdrawn
          const { data: wallet } = await supabase
            .from('professional_wallets')
            .select('*')
            .eq('professional_id', withdrawal.professional_id)
            .single();

          if (wallet) {
            await supabase
              .from('professional_wallets')
              .update({
                pending_balance: parseFloat(wallet.pending_balance) - withdrawal.amount,
                total_withdrawn: parseFloat(wallet.total_withdrawn) + withdrawal.amount,
                updated_at: new Date().toISOString(),
              })
              .eq('professional_id', withdrawal.professional_id);

            // Créer la transaction
            await supabase
              .from('wallet_transactions')
              .insert({
                wallet_id: wallet.id,
                type: 'withdrawal',
                amount: -withdrawal.amount,
                balance_before: parseFloat(wallet.balance),
                balance_after: parseFloat(wallet.balance),
                status: 'completed',
                payment_method: withdrawal.payout_method,
                transaction_reference: transactionRef,
                description: `Retrait via ${withdrawal.payout_method}`,
              });
          }

          // Notifier le professionnel
          await supabase
            .from('notifications')
            .insert({
              user_id: withdrawal.professional_id,
              title: 'Retrait effectué',
              message: `Votre retrait de ${withdrawal.amount} DJF a été effectué avec succès`,
              type: 'payment',
              data: { withdrawal_id: withdrawalId },
            });
        }
      }

      // Si rejeté, remettre le montant dans le solde disponible
      if (status === 'rejected') {
        const withdrawal = withdrawals.find(w => w.id === withdrawalId);
        if (withdrawal) {
          const { data: wallet } = await supabase
            .from('professional_wallets')
            .select('*')
            .eq('professional_id', withdrawal.professional_id)
            .single();

          if (wallet) {
            await supabase
              .from('professional_wallets')
              .update({
                balance: parseFloat(wallet.balance) + withdrawal.amount,
                pending_balance: parseFloat(wallet.pending_balance) - withdrawal.amount,
                updated_at: new Date().toISOString(),
              })
              .eq('professional_id', withdrawal.professional_id);
          }

          // Notifier le professionnel
          await supabase
            .from('notifications')
            .insert({
              user_id: withdrawal.professional_id,
              title: 'Retrait rejeté',
              message: `Votre demande de retrait de ${withdrawal.amount} DJF a été rejetée. ${notes}`,
              type: 'payment',
              data: { withdrawal_id: withdrawalId },
            });
        }
      }

      alert('Statut mis à jour avec succès');
      loadWithdrawals();
      setShowProcessModal(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      processing: 'En cours',
      completed: 'Complété',
      rejected: 'Rejeté',
      failed: 'Échoué',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentMethodIcon = (method: string) => {
    const icons = {
      waafi: 'ri-smartphone-line text-blue-600',
      dmoney: 'ri-smartphone-line text-orange-600',
      stripe: 'ri-bank-card-line text-purple-600',
      bank: 'ri-bank-line text-gray-600',
      evc_plus: 'ri-smartphone-line text-green-600',
      zaad: 'ri-smartphone-line text-red-600',
    };

    return icons[method as keyof typeof icons] || 'ri-money-dollar-circle-line';
  };

  // Pagination
  const indexOfLastWithdrawal = currentPage * withdrawalsPerPage;
  const indexOfFirstWithdrawal = indexOfLastWithdrawal - withdrawalsPerPage;
  const currentWithdrawals = withdrawals.slice(indexOfFirstWithdrawal, indexOfLastWithdrawal);
  const totalPages = Math.ceil(withdrawals.length / withdrawalsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestion des retraits</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadWithdrawals}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap transition-colors"
          >
            <i className="ri-refresh-line"></i>
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Tous', count: withdrawals.length },
          { value: 'pending', label: 'En attente', count: withdrawals.filter(w => w.status === 'pending').length },
          { value: 'approved', label: 'Approuvés', count: withdrawals.filter(w => w.status === 'approved').length },
          { value: 'completed', label: 'Complétés', count: withdrawals.filter(w => w.status === 'completed').length },
          { value: 'rejected', label: 'Rejetés', count: withdrawals.filter(w => w.status === 'rejected').length },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              filter === tab.value
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Liste des retraits */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {withdrawals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="ri-inbox-line text-5xl mb-3"></i>
            <p>Aucune demande de retrait</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Professionnel</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Montant</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Méthode</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold">{withdrawal.profiles.full_name}</div>
                          <div className="text-sm text-gray-600">{withdrawal.profiles.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-lg">{withdrawal.amount.toFixed(2)} DJF</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <i className={`${getPaymentMethodIcon(withdrawal.payout_method)} text-xl`}></i>
                          <span className="capitalize">{withdrawal.payout_method}</span>
                        </div>
                        {withdrawal.payout_method === 'waafi' && withdrawal.professional_wallets.waafi_phone && (
                          <div className="text-sm text-gray-600 mt-1">{withdrawal.professional_wallets.waafi_phone}</div>
                        )}
                        {withdrawal.payout_method === 'dmoney' && withdrawal.professional_wallets.dmoney_phone && (
                          <div className="text-sm text-gray-600 mt-1">{withdrawal.professional_wallets.dmoney_phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {withdrawal.status === 'pending' && (
                          <button
                            onClick={() => handleProcess(withdrawal)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 whitespace-nowrap text-sm transition-colors"
                          >
                            Traiter
                          </button>
                        )}
                        {withdrawal.status === 'approved' && (
                          <button
                            onClick={() => handleProcess(withdrawal)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap text-sm transition-colors"
                          >
                            Marquer complété
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Affichage de {indexOfFirstWithdrawal + 1} à {Math.min(indexOfLastWithdrawal, withdrawals.length)} sur {withdrawals.length} retraits
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="ri-arrow-left-s-line"></i>
                  </button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de traitement */}
      {showProcessModal && selectedWithdrawal && (
        <ProcessWithdrawalModal
          withdrawal={selectedWithdrawal}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedWithdrawal(null);
          }}
          onUpdate={updateWithdrawalStatus}
        />
      )}
    </div>
  );
};

// Modal de traitement
const ProcessWithdrawalModal: React.FC<{
  withdrawal: WithdrawalRequest;
  onClose: () => void;
  onUpdate: (id: string, status: string, notes: string, transactionRef?: string) => void;
}> = ({ withdrawal, onClose, onUpdate }) => {
  const [action, setAction] = useState<'approve' | 'complete' | 'reject'>('approve');
  const [notes, setNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const statusMap = {
      approve: 'approved',
      complete: 'completed',
      reject: 'rejected',
    };

    onUpdate(withdrawal.id, statusMap[action], notes, transactionRef || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Traiter la demande de retrait</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Détails de la demande */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Professionnel:</span>
            <span className="font-semibold">{withdrawal.profiles.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Montant:</span>
            <span className="font-bold text-lg text-teal-600">{withdrawal.amount.toFixed(2)} DJF</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Méthode:</span>
            <span className="capitalize">{withdrawal.payout_method}</span>
          </div>
          {withdrawal.payout_method === 'waafi' && withdrawal.professional_wallets.waafi_phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro Waafi:</span>
              <span className="font-mono">{withdrawal.professional_wallets.waafi_phone}</span>
            </div>
          )}
          {withdrawal.payout_method === 'dmoney' && withdrawal.professional_wallets.dmoney_phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro D-money:</span>
              <span className="font-mono">{withdrawal.professional_wallets.dmoney_phone}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Date de demande:</span>
            <span>
              {new Date(withdrawal.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Action</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAction('approve')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  action === 'approve'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-check-line text-2xl text-blue-600 mb-2"></i>
                <div className="font-semibold">Approuver</div>
              </button>
              <button
                type="button"
                onClick={() => setAction('complete')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  action === 'complete'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-checkbox-circle-line text-2xl text-green-600 mb-2"></i>
                <div className="font-semibold">Complété</div>
              </button>
              <button
                type="button"
                onClick={() => setAction('reject')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  action === 'reject'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <i className="ri-close-circle-line text-2xl text-red-600 mb-2"></i>
                <div className="font-semibold">Rejeter</div>
              </button>
            </div>
          </div>

          {action === 'complete' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Référence de transaction</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ex: TXN123456789"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Notes {action === 'reject' && '(obligatoire)'}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={action === 'reject'}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder={action === 'reject' ? 'Expliquez la raison du rejet...' : 'Notes optionnelles...'}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 whitespace-nowrap transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className={`flex-1 px-6 py-3 text-white rounded-lg whitespace-nowrap transition-colors ${
                action === 'approve'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : action === 'complete'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};