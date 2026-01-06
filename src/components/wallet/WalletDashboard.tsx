import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface WalletData {
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  stripe_account_id: string | null;
  stripe_account_status: string | null;
  waafi_phone: string | null;
  dmoney_phone: string | null;
  preferred_payout_method: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  status: string;
  description: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  payout_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export const WalletDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPayoutSettings, setShowPayoutSettings] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showTestInfo, setShowTestInfo] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger le portefeuille
      const { data: walletData } = await supabase
        .from('professional_wallets')
        .select('*')
        .eq('professional_id', user.id)
        .single();

      if (walletData) {
        setWallet(walletData);
      }

      // Charger les transactions
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/wallet-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_transactions' }),
        }
      );

      const transactionsResult = await response.json();
      if (transactionsResult.success) {
        setTransactions(transactionsResult.transactions || []);
      }

      // Charger les demandes de retrait
      const withdrawalsResponse = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/wallet-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'get_withdrawals' }),
        }
      );

      const withdrawalsResult = await withdrawalsResponse.json();
      if (withdrawalsResult.success) {
        setWithdrawals(withdrawalsResult.withdrawals || []);
      }

    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupStripeConnect = async () => {
    setShowStripeModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mode Test Toggle */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <i className="ri-flask-line text-xl text-amber-600"></i>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mode Test WaafiPay</h3>
              <p className="text-sm text-gray-600">Testez les retraits sans argent réel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTestInfo(!showTestInfo)}
              className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
              title="Informations de test"
            >
              <i className="ri-information-line text-xl"></i>
            </button>
            <button
              onClick={() => setTestMode(!testMode)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                testMode ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  testMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Test Information Panel */}
        {showTestInfo && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <div className="bg-white rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <i className="ri-shield-check-line text-green-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Données de test WaafiPay</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Wallet Brand:</span>
                      <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">WAAFI Djibouti</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Provider:</span>
                      <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">WAAFI</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">Mobile Number:</span>
                      <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">253771111111</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700 w-32">PIN:</span>
                      <span className="text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">1212</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                <i className="ri-lightbulb-line text-blue-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-1">Comment utiliser le mode test :</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Activez le mode test avec le bouton ci-dessus</li>
                    <li>Utilisez le numéro de test dans vos paramètres de paiement</li>
                    <li>Créez une demande de retrait test</li>
                    <li>Les transactions test seront marquées comme "TEST"</li>
                    <li>Aucun argent réel ne sera transféré</li>
                  </ol>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-200">
                <i className="ri-alert-line text-amber-600 text-xl flex-shrink-0 mt-0.5"></i>
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">Important :</p>
                  <p>Le mode test est uniquement pour vérifier le fonctionnement du système. Désactivez-le pour effectuer de vrais retraits.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Mode Active Banner */}
        {testMode && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-800 bg-amber-100 px-3 py-2 rounded-lg">
            <i className="ri-error-warning-line"></i>
            <span className="font-medium">Mode test actif - Aucune transaction réelle ne sera effectuée</span>
          </div>
        )}
      </div>

      {/* En-tête avec soldes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`bg-gradient-to-br rounded-xl p-6 text-white ${
          testMode ? 'from-amber-500 to-amber-600' : 'from-teal-500 to-teal-600'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">
              Solde disponible {testMode && '(TEST)'}
            </span>
            <i className="ri-wallet-3-line text-2xl"></i>
          </div>
          <div className="text-3xl font-bold">{wallet?.balance?.toFixed(2) || '0.00'} DJF</div>
          {testMode && (
            <div className="mt-2 text-xs opacity-90 flex items-center gap-1">
              <i className="ri-flask-line"></i>
              <span>Solde de test</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">En attente</span>
            <i className="ri-time-line text-xl text-orange-500"></i>
          </div>
          <div className="text-2xl font-bold text-gray-900">{wallet?.pending_balance?.toFixed(2) || '0.00'} DJF</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total gagné</span>
            <i className="ri-arrow-up-circle-line text-xl text-green-500"></i>
          </div>
          <div className="text-2xl font-bold text-gray-900">{wallet?.total_earned?.toFixed(2) || '0.00'} DJF</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total retiré</span>
            <i className="ri-arrow-down-circle-line text-xl text-blue-500"></i>
          </div>
          <div className="text-2xl font-bold text-gray-900">{wallet?.total_withdrawn?.toFixed(2) || '0.00'} DJF</div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowWithdrawModal(true)}
            disabled={!wallet?.balance || wallet.balance < 1000}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
          >
            <i className="ri-bank-card-line"></i>
            Demander un retrait
          </button>

          <button
            onClick={() => setShowPayoutSettings(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap transition-colors"
          >
            <i className="ri-settings-3-line"></i>
            Paramètres de paiement
          </button>

          {!wallet?.stripe_account_id && (
            <button
              onClick={setupStripeConnect}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 whitespace-nowrap transition-colors"
            >
              <i className="ri-bank-line"></i>
              Configurer Stripe Connect
            </button>
          )}

          {wallet?.stripe_account_id && wallet.stripe_account_status !== 'active' && (
            <button
              onClick={setupStripeConnect}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 whitespace-nowrap transition-colors"
            >
              <i className="ri-alert-line"></i>
              Compléter la configuration Stripe
            </button>
          )}

          {wallet?.stripe_account_id && wallet.stripe_account_status === 'active' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
              <i className="ri-checkbox-circle-line"></i>
              Stripe Connect actif
            </div>
          )}
        </div>
      </div>

      {/* Méthodes de paiement configurées */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Méthodes de paiement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border-2 ${wallet?.stripe_account_status === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-bank-card-line text-2xl text-purple-600"></i>
              <div>
                <div className="font-semibold">Stripe Connect</div>
                <div className="text-sm text-gray-600">
                  {wallet?.stripe_account_status === 'active' ? 'Actif' : 'Non configuré'}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${wallet?.waafi_phone ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-smartphone-line text-2xl text-blue-600"></i>
              <div>
                <div className="font-semibold">Waafi Pay</div>
                <div className="text-sm text-gray-600">
                  {wallet?.waafi_phone || 'Non configuré'}
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-lg border-2 ${wallet?.dmoney_phone ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <i className="ri-smartphone-line text-2xl text-orange-600"></i>
              <div>
                <div className="font-semibold">D-money</div>
                <div className="text-sm text-gray-600">
                  {wallet?.dmoney_phone || 'Non configuré'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button className="px-6 py-4 font-semibold text-teal-600 border-b-2 border-teal-600">
              Transactions récentes
            </button>
            <button 
              onClick={() => {/* Switch tab */}}
              className="px-6 py-4 font-semibold text-gray-600 hover:text-gray-900"
            >
              Demandes de retrait
            </button>
          </div>
        </div>

        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <i className="ri-inbox-line text-5xl mb-3"></i>
              <p>Aucune transaction pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'earning' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      <i className={`${
                        transaction.type === 'earning' ? 'ri-arrow-down-line text-green-600' : 'ri-arrow-up-line text-orange-600'
                      } text-xl`}></i>
                    </div>
                    <div>
                      <div className="font-semibold">{transaction.description}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      transaction.type === 'earning' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {transaction.type === 'earning' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} DJF
                    </div>
                    <div className="text-sm text-gray-600">
                      Solde: {transaction.balance_after.toFixed(2)} DJF
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Stripe Connect */}
      {showStripeModal && (
        <StripeConnectModal
          wallet={wallet}
          onClose={() => setShowStripeModal(false)}
          onSuccess={() => {
            setShowStripeModal(false);
            loadWalletData();
          }}
        />
      )}

      {/* Modal de retrait */}
      {showWithdrawModal && (
        <WithdrawalModal
          wallet={wallet}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={() => {
            setShowWithdrawModal(false);
            loadWalletData();
          }}
        />
      )}

      {/* Modal paramètres de paiement */}
      {showPayoutSettings && (
        <PayoutSettingsModal
          wallet={wallet}
          onClose={() => setShowPayoutSettings(false)}
          onSuccess={() => {
            setShowPayoutSettings(false);
            loadWalletData();
          }}
        />
      )}
    </div>
  );
};

// Modal Stripe Connect
const StripeConnectModal: React.FC<{
  wallet: WalletData | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ wallet, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupStripe = async () => {
    setLoading(true);
    setError('');

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (!token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const action = wallet?.stripe_account_id ? 'create_onboarding_link' : 'create_account';
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/stripe-connect-onboarding`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action,
            accountId: wallet?.stripe_account_id 
          }),
        }
      );

      const result = await response.json();
      
      if (result.success && result.onboardingUrl) {
        // Ouvrir Stripe dans une nouvelle fenêtre
        const stripeWindow = window.open(
          result.onboardingUrl,
          'stripe-connect',
          'width=800,height=800,scrollbars=yes'
        );

        if (!stripeWindow) {
          setError('Veuillez autoriser les popups pour continuer avec Stripe.');
          return;
        }

        // Surveiller la fermeture de la fenêtre
        const checkWindow = setInterval(() => {
          if (stripeWindow.closed) {
            clearInterval(checkWindow);
            setLoading(false);
            
            // Vérifier le statut après fermeture
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }
        }, 500);

      } else {
        throw new Error(result.error || 'Erreur lors de la configuration de Stripe');
      }
    } catch (error) {
      console.error('Erreur Stripe:', error);
      setError(error instanceof Error ? error.message : 'Erreur lors de la configuration de Stripe');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Configuration Stripe Connect</h3>
          <button 
            onClick={onClose} 
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="space-y-4">
          {/* Icône et titre */}
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-bank-line text-4xl text-purple-600"></i>
            </div>
            <h4 className="text-lg font-semibold mb-2">
              {wallet?.stripe_account_id ? 'Compléter votre configuration' : 'Recevez vos paiements automatiquement'}
            </h4>
            <p className="text-gray-600">
              Configurez Stripe Connect pour recevoir 90% de chaque réservation directement sur votre compte
            </p>
          </div>

          {/* Avantages */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-white text-sm"></i>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Paiements automatiques</div>
                <div className="text-sm text-gray-600">Recevez 90% de chaque réservation instantanément</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-white text-sm"></i>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Sécurisé et fiable</div>
                <div className="text-sm text-gray-600">Stripe est utilisé par des millions d'entreprises</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="ri-check-line text-white text-sm"></i>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Pas de frais cachés</div>
                <div className="text-sm text-gray-600">Transparence totale sur vos gains</div>
              </div>
            </div>
          </div>

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="ri-information-line text-blue-600 text-xl flex-shrink-0"></i>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Ce dont vous aurez besoin :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Une pièce d'identité valide</li>
                  <li>Vos coordonnées bancaires</li>
                  <li>Quelques informations sur votre activité</li>
                </ul>
                <p className="mt-2">La configuration prend environ 5 minutes.</p>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <i className="ri-error-warning-line text-red-600 text-xl flex-shrink-0"></i>
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSetupStripe}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 whitespace-nowrap transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Ouverture...</span>
                </>
              ) : (
                <>
                  <i className="ri-external-link-line"></i>
                  <span>Continuer avec Stripe</span>
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="text-center text-sm text-gray-600">
              <p>Une nouvelle fenêtre va s'ouvrir pour compléter votre inscription sur Stripe.</p>
              <p className="mt-1">Veuillez ne pas fermer cette fenêtre.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de demande de retrait
const WithdrawalModal: React.FC<{
  wallet: WalletData | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ wallet, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState(wallet?.preferred_payout_method || 'waafi');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount < 1000) {
        alert('Le montant minimum de retrait est 1000 DJF');
        return;
      }

      if (withdrawAmount > (wallet?.balance || 0)) {
        alert('Solde insuffisant');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/wallet-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'request_withdrawal',
            amount: withdrawAmount,
            payoutMethod,
            payoutDetails: {},
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('Demande de retrait créée avec succès ! Elle sera traitée sous 24-48h.');
        onSuccess();
      } else {
        alert(result.error || 'Erreur lors de la demande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la demande de retrait');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Demander un retrait</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Montant (DJF)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max={wallet?.balance || 0}
              step="100"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Minimum 1000 DJF"
            />
            <div className="text-sm text-gray-600 mt-1">
              Disponible: {wallet?.balance?.toFixed(2) || '0.00'} DJF
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Méthode de paiement</label>
            <select
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="waafi">Waafi Pay</option>
              <option value="dmoney">D-money</option>
              <option value="evc_plus">EVC Plus</option>
              <option value="zaad">Zaad</option>
              <option value="bank">Virement bancaire</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <i className="ri-information-line text-blue-600 text-xl"></i>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Délai de traitement</p>
                <p>Votre demande sera traitée sous 24-48h ouvrées. Vous recevrez une notification une fois le paiement effectué.</p>
              </div>
            </div>
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap transition-colors"
            >
              {loading ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal paramètres de paiement
const PayoutSettingsModal: React.FC<{
  wallet: WalletData | null;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ wallet, onClose, onSuccess }) => {
  const [waafiPhone, setWaafiPhone] = useState(wallet?.waafi_phone || '');
  const [dmoneyPhone, setDmoneyPhone] = useState(wallet?.dmoney_phone || '');
  const [preferredMethod, setPreferredMethod] = useState(wallet?.preferred_payout_method || 'waafi');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/wallet-management`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_payout_info',
            payoutMethod: preferredMethod,
            payoutDetails: {
              waafi_phone: waafiPhone,
              dmoney_phone: dmoneyPhone,
            },
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        alert('Paramètres mis à jour avec succès !');
        onSuccess();
      } else {
        alert(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Paramètres de paiement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Numéro Waafi Pay</label>
            <input
              type="tel"
              value={waafiPhone}
              onChange={(e) => setWaafiPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="+253 77 XX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Numéro D-money</label>
            <input
              type="tel"
              value={dmoneyPhone}
              onChange={(e) => setDmoneyPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="+253 77 XX XX XX"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Méthode préférée</label>
            <select
              value={preferredMethod}
              onChange={(e) => setPreferredMethod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="waafi">Waafi Pay</option>
              <option value="dmoney">D-money</option>
              <option value="stripe">Stripe Connect</option>
              <option value="bank">Virement bancaire</option>
            </select>
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
              disabled={loading}
              className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 whitespace-nowrap transition-colors"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};