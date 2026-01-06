
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ConvertUserToAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleConvert = async () => {
    if (!email.trim()) {
      setError('Veuillez entrer un email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Appeler la fonction Edge pour convertir l'utilisateur
      const { data, error: functionError } = await supabase.functions.invoke('convert-to-superadmin', {
        body: { email: email.toLowerCase().trim() }
      });

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setMessage('✅ Utilisateur converti en Super Administrateur avec succès !');
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Erreur lors de la conversion:', err);
      setError(err.message || 'Une erreur est survenue lors de la conversion');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-star-line text-4xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Convertir en Super Administrateur
            </h1>
            <p className="text-gray-600">
              Entrez l'email de l'utilisateur à convertir
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email de l'utilisateur
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Actions effectuées */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <i className="ri-information-line text-teal-600 mr-2"></i>
                Actions qui seront effectuées
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <i className="ri-close-circle-line text-red-500 mr-2 mt-0.5"></i>
                  <span>Suppression du profil client</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-close-circle-line text-red-500 mr-2 mt-0.5"></i>
                  <span>Suppression du profil professionnel (si existe)</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-green-500 mr-2 mt-0.5"></i>
                  <span>Création du compte Super Administrateur</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-check-line text-green-500 mr-2 mt-0.5"></i>
                  <span>Attribution de tous les privilèges d'administration</span>
                </li>
              </ul>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <i className="ri-error-warning-line text-red-500 text-xl mr-3 mt-0.5"></i>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <i className="ri-checkbox-circle-line text-green-500 text-xl mr-3 mt-0.5"></i>
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleConvert}
              disabled={loading || !email.trim()}
              className="w-full bg-gradient-to-r from-teal-600 to-orange-600 text-white py-4 rounded-lg font-semibold hover:from-teal-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Conversion en cours...
                </>
              ) : (
                <>
                  <i className="ri-shield-star-line mr-2"></i>
                  Convertir en Super Admin
                </>
              )}
            </button>

            {/* Back button */}
            <button
              onClick={() => navigate('/admin-dashboard')}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <i className="ri-arrow-left-line mr-2"></i>
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
