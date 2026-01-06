import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur a un token de récupération valide
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Rediriger vers le dashboard après 2 secondes
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError('Erreur lors de la réinitialisation du mot de passe. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-teal-500 rounded-full mb-4">
            <i className="ri-lock-password-line text-3xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-600">
            Créez un nouveau mot de passe sécurisé pour votre compte
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <i className="ri-check-line text-3xl text-green-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Mot de passe modifié !
              </h2>
              <p className="text-gray-600 mb-4">
                Votre mot de passe a été modifié avec succès.
              </p>
              <p className="text-sm text-gray-500">
                Redirection vers votre tableau de bord...
              </p>
              <div className="mt-4">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <i className="ri-error-warning-line text-red-600 text-xl mr-3 mt-0.5"></i>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Le mot de passe doit contenir au moins 6 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="ri-lock-line text-gray-400"></i>
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Indicateur de force du mot de passe */}
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Force du mot de passe :</span>
                    <span className={`font-medium ${
                      password.length < 6 ? 'text-red-600' :
                      password.length < 8 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {password.length < 6 ? 'Faible' :
                       password.length < 8 ? 'Moyen' :
                       'Fort'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        password.length < 6 ? 'w-1/3 bg-red-500' :
                        password.length < 8 ? 'w-2/3 bg-yellow-500' :
                        'w-full bg-green-500'
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-teal-500 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Modification en cours...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="ri-check-line mr-2"></i>
                    Modifier le mot de passe
                  </span>
                )}
              </button>

              <div className="text-center">
                <a
                  href="/"
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  <i className="ri-arrow-left-line mr-1"></i>
                  Retour à l'accueil
                </a>
              </div>
            </form>
          )}
        </div>

        {/* Conseils de sécurité */}
        {!success && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
              <i className="ri-information-line mr-2"></i>
              Conseils pour un mot de passe sécurisé
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Utilisez au moins 8 caractères</li>
              <li>• Mélangez lettres majuscules et minuscules</li>
              <li>• Ajoutez des chiffres et des caractères spéciaux</li>
              <li>• Évitez les mots du dictionnaire</li>
              <li>• N'utilisez pas d'informations personnelles</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
