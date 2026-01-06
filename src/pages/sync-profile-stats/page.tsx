import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

interface SyncResult {
  success: boolean;
  message: string;
  updated?: number;
  errors?: number;
  details?: any;
}

export default function SyncProfileStatsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-profile-stats', {
        method: 'POST',
      });

      if (error) {
        setResult({
          success: false,
          message: `Erreur: ${error.message}`,
        });
      } else {
        setResult({
          success: true,
          message: 'Synchronisation réussie !',
          updated: data?.updated || 0,
          errors: data?.errors || 0,
          details: data,
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: `Erreur: ${err.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <Header />
      
      <main className="flex-1 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
              <i className="ri-refresh-line text-4xl text-white"></i>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Synchronisation des Statistiques
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cette fonction va recalculer toutes les statistiques des profils utilisateurs 
              (réservations, avis, montants) et synchroniser les numéros de téléphone.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <i className="ri-information-line text-2xl text-blue-500"></i>
              Ce qui sera synchronisé
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-calendar-check-line text-teal-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Réservations</h3>
                    <p className="text-sm text-slate-600">
                      Nombre total et réservations terminées
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-star-line text-purple-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Avis</h3>
                    <p className="text-sm text-slate-600">
                      Nombre total d'avis donnés
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-money-dollar-circle-line text-green-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Montants</h3>
                    <p className="text-sm text-slate-600">
                      Total dépensé par les clients
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="ri-phone-line text-blue-600"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Téléphones</h3>
                    <p className="text-sm text-slate-600">
                      Synchronisation avec Auth
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <i className="ri-alert-line text-2xl text-amber-600 flex-shrink-0"></i>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Important</h3>
                <p className="text-sm text-amber-800">
                  Cette opération peut prendre quelques secondes selon le nombre d'utilisateurs. 
                  Ne fermez pas cette page pendant la synchronisation.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mb-8">
            <button
              onClick={handleSync}
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Synchronisation en cours...
                </>
              ) : (
                <>
                  <i className="ri-refresh-line text-xl"></i>
                  Lancer la synchronisation
                </>
              )}
            </button>
          </div>

          {/* Result Card */}
          {result && (
            <div
              className={`rounded-2xl shadow-lg border p-8 animate-fadeIn ${
                result.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    result.success ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <i
                    className={`text-2xl ${
                      result.success
                        ? 'ri-checkbox-circle-line text-green-600'
                        : 'ri-error-warning-line text-red-600'
                    }`}
                  ></i>
                </div>
                
                <div className="flex-1">
                  <h3
                    className={`text-xl font-bold mb-2 ${
                      result.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.success ? 'Synchronisation réussie !' : 'Erreur'}
                  </h3>
                  
                  <p
                    className={`mb-4 ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {result.message}
                  </p>

                  {result.success && result.updated !== undefined && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {result.updated}
                        </div>
                        <div className="text-sm text-slate-600">
                          Profils mis à jour
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="text-3xl font-bold text-slate-400 mb-1">
                          {result.errors || 0}
                        </div>
                        <div className="text-sm text-slate-600">
                          Erreurs
                        </div>
                      </div>
                    </div>
                  )}

                  {result.details && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-700 hover:text-slate-900">
                        Voir les détails
                      </summary>
                      <pre className="mt-2 p-4 bg-white rounded-lg text-xs overflow-auto border border-slate-200">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result?.success && (
            <div className="mt-8 bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                <i className="ri-lightbulb-line text-2xl text-yellow-500"></i>
                Prochaines étapes
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <i className="ri-check-line text-teal-600 text-xl flex-shrink-0 mt-1"></i>
                  <p className="text-slate-700">
                    Vérifiez les statistiques dans le tableau de bord des utilisateurs
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <i className="ri-check-line text-teal-600 text-xl flex-shrink-0 mt-1"></i>
                  <p className="text-slate-700">
                    Consultez la table <code className="px-2 py-1 bg-slate-100 rounded text-sm">profiles</code> dans Supabase
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <i className="ri-check-line text-teal-600 text-xl flex-shrink-0 mt-1"></i>
                  <p className="text-slate-700">
                    Les futures réservations et avis mettront à jour automatiquement les statistiques
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
