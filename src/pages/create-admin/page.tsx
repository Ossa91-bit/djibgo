import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createSuperAdmin = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Étape 1: Créer le compte superadmin
      const { data, error } = await supabase.functions.invoke('create-superadmin', {
        body: {
          email: 'djibgoservice@gmail.com',
          password: 'DjibGo_@dmin25',
          full_name: 'Service DjibGo'
        }
      });

      if (error) {
        setError(error.message || 'Erreur lors de la création du compte');
        return;
      }

      if (data.error) {
        setError(data.error);
        return;
      }

      setMessage('✅ Compte créé ! Connexion en cours...');

      // Étape 2: Se connecter automatiquement avec le compte créé
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'djibgoservice@gmail.com',
        password: 'DjibGo_@dmin25'
      });

      if (signInError) {
        setError('Compte créé mais erreur de connexion. Veuillez vous connecter manuellement.');
        return;
      }

      setMessage('✅ Connexion réussie ! Redirection vers le tableau de bord...');
      
      // Rediriger vers le tableau de bord admin après connexion
      setTimeout(() => {
        window.location.href = '/admin-dashboard';
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-admin-line text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte Superadmin</h1>
          <p className="text-gray-600 text-sm">Pour l'adresse email : djibgoservice@gmail.com</p>
        </div>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Informations du compte :</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <i className="ri-mail-line mr-2 text-teal-500"></i>
                <span><strong>Email :</strong> djibgoservice@gmail.com</span>
              </li>
              <li className="flex items-center">
                <i className="ri-user-line mr-2 text-teal-500"></i>
                <span><strong>Nom :</strong> Service DjibGo</span>
              </li>
              <li className="flex items-center">
                <i className="ri-shield-star-line mr-2 text-teal-500"></i>
                <span><strong>Rôle :</strong> Superadmin</span>
              </li>
            </ul>
          </div>

          <button
            onClick={createSuperAdmin}
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Création en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <i className="ri-add-circle-line mr-2"></i>
                Créer le compte Superadmin
              </span>
            )}
          </button>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">Privilèges accordés :</h4>
            <ul className="space-y-1 text-xs text-blue-800">
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Gestion des utilisateurs
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Gestion des professionnels
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Gestion des réservations
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Gestion des paiements
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Gestion des paramètres
              </li>
              <li className="flex items-center">
                <i className="ri-check-line mr-2"></i>
                Accès aux analyses et statistiques
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}