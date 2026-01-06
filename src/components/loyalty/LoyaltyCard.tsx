import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface LoyaltyCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoyaltyCard({ isOpen, onClose }: LoyaltyCardProps) {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchLoyaltyData();
      fetchTransactions();
    }
  }, [isOpen, user]);

  const fetchLoyaltyData = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setLoyaltyData(data);
      } else {
        // Créer un compte de fidélité si n'existe pas
        const { data: newData, error: insertError } = await supabase
          .from('loyalty_points')
          .insert({
            user_id: user?.id,
            points: 0,
            total_earned: 0,
            total_redeemed: 0,
            tier: 'bronze'
          })
          .select()
          .single();

        if (!insertError) {
          setLoyaltyData(newData);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: {
        name: 'Bronze',
        color: 'from-orange-400 to-orange-600',
        icon: 'ri-medal-line',
        nextTier: 'Argent',
        pointsNeeded: 500,
        benefits: ['1 point par 100 FDJ dépensés', '5% de réduction sur les courses']
      },
      silver: {
        name: 'Argent',
        color: 'from-gray-300 to-gray-500',
        icon: 'ri-medal-2-line',
        nextTier: 'Or',
        pointsNeeded: 1000,
        benefits: ['2 points par 100 FDJ dépensés', '10% de réduction', 'Support prioritaire']
      },
      gold: {
        name: 'Or',
        color: 'from-yellow-400 to-yellow-600',
        icon: 'ri-vip-crown-line',
        nextTier: 'Platine',
        pointsNeeded: 2000,
        benefits: ['3 points par 100 FDJ dépensés', '15% de réduction', 'Courses prioritaires']
      },
      platinum: {
        name: 'Platine',
        color: 'from-purple-400 to-purple-600',
        icon: 'ri-vip-diamond-line',
        nextTier: null,
        pointsNeeded: null,
        benefits: ['5 points par 100 FDJ dépensés', '20% de réduction', 'Accès VIP exclusif']
      }
    };

    return tiers[tier as keyof typeof tiers] || tiers.bronze;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  const tierInfo = loyaltyData ? getTierInfo(loyaltyData.tier) : getTierInfo('bronze');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Programme de Fidélité</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-teal-500"></i>
            </div>
          ) : (
            <>
              {/* Carte de fidélité */}
              <div className={`bg-gradient-to-br ${tierInfo.color} rounded-2xl p-6 text-white mb-6 shadow-xl`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-sm opacity-90">Niveau</p>
                    <h3 className="text-2xl font-bold">{tierInfo.name}</h3>
                  </div>
                  <i className={`${tierInfo.icon} text-4xl opacity-80`}></i>
                </div>

                <div className="mb-4">
                  <p className="text-sm opacity-90 mb-1">Points disponibles</p>
                  <p className="text-5xl font-bold">{loyaltyData?.points || 0}</p>
                </div>

                {tierInfo.nextTier && (
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Prochain niveau: {tierInfo.nextTier}</span>
                      <span className="text-sm font-semibold">
                        {loyaltyData?.total_earned || 0}/{tierInfo.pointsNeeded}
                      </span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2">
                      <div
                        className="bg-white rounded-full h-2 transition-all duration-500"
                        style={{
                          width: `${Math.min(((loyaltyData?.total_earned || 0) / (tierInfo.pointsNeeded || 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="ri-arrow-up-circle-line text-green-500"></i>
                    <span className="text-sm text-gray-600">Points gagnés</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyData?.total_earned || 0}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <i className="ri-arrow-down-circle-line text-orange-500"></i>
                    <span className="text-sm text-gray-600">Points utilisés</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{loyaltyData?.total_redeemed || 0}</p>
                </div>
              </div>

              {/* Avantages */}
              <div className="bg-teal-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-teal-900 mb-3 flex items-center">
                  <i className="ri-gift-line mr-2"></i>
                  Vos avantages {tierInfo.name}
                </h4>
                <ul className="space-y-2">
                  {tierInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start text-sm text-teal-800">
                      <i className="ri-check-line text-teal-600 mr-2 mt-0.5"></i>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comment gagner des points */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Comment gagner des points ?</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <i className="ri-taxi-line text-teal-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Réservez des courses</p>
                      <p className="text-xs text-gray-600">1 point par 100 FDJ dépensés</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <i className="ri-star-line text-teal-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Laissez des avis</p>
                      <p className="text-xs text-gray-600">10 points par avis</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                      <i className="ri-user-add-line text-teal-600 text-sm"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Parrainez des amis</p>
                      <p className="text-xs text-gray-600">50 points par parrainage</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique des transactions */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Historique récent</h4>
                {transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.transaction_type === 'earned' 
                              ? 'bg-green-100' 
                              : 'bg-orange-100'
                          }`}>
                            <i className={`${
                              transaction.transaction_type === 'earned'
                                ? 'ri-add-line text-green-600'
                                : 'ri-subtract-line text-orange-600'
                            } text-sm`}></i>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                        </div>
                        <span className={`font-semibold ${
                          transaction.transaction_type === 'earned'
                            ? 'text-green-600'
                            : 'text-orange-600'
                        }`}>
                          {transaction.transaction_type === 'earned' ? '+' : '-'}
                          {transaction.points}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <i className="ri-history-line text-3xl text-gray-300 mb-2"></i>
                    <p className="text-sm text-gray-500">Aucune transaction</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
