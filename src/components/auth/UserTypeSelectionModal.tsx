import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UserTypeSelectionModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  userName: string;
  onComplete: () => void;
}

export default function UserTypeSelectionModal({ 
  isOpen, 
  userId, 
  userEmail, 
  userName,
  onComplete 
}: UserTypeSelectionModalProps) {
  const [selectedType, setSelectedType] = useState<'client' | 'professional' | null>(null);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedType) {
      setError('Veuillez sélectionner un type de compte');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Créer le profil utilisateur avec tous les champs requis
      const profileData = {
        id: userId,
        full_name: userName,
        phone: phone || null,
        user_type: selectedType,
        is_verified: true, // Les comptes Google sont automatiquement vérifiés
        avatar_url: null,
        address: null,
        city: null,
        created_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Erreur profil:', profileError);
        throw profileError;
      }

      // Si c'est un professionnel, créer aussi le profil professionnel
      if (selectedType === 'professional') {
        const professionalData = {
          id: userId,
          phone: phone || null,
          city: 'Djibouti',
          address: null,
          service_category: 'Autre', // Catégorie par défaut
          experience_years: 0,
          hourly_rate: 0,
          description: '',
          rating: 0,
          total_reviews: 0,
          total_bookings: 0,
          completed_bookings: 0,
          commission_rate: 10,
          is_premium: false,
          is_active: true,
          is_suspended: false,
          verification_status: 'pending',
          verification_documents: [],
          created_at: new Date().toISOString()
        };

        const { error: professionalError } = await supabase
          .from('professional_profiles')
          .insert(professionalData);

        if (professionalError) {
          console.error('Erreur profil professionnel:', professionalError);
          // Ne pas bloquer si l'erreur est juste un doublon
          if (!professionalError.message.includes('duplicate')) {
            throw professionalError;
          }
        }
      }

      // Attendre un peu pour que les données soient bien enregistrées
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fermer la modale et rafraîchir
      onComplete();
    } catch (err: any) {
      console.error('Erreur lors de la création du profil:', err);
      setError('Erreur lors de la création de votre profil. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-user-settings-line text-orange-500 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur DjibGo !
          </h2>
          <p className="text-gray-600">
            Pour finaliser votre inscription, veuillez choisir votre type de compte
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 mr-2"></i>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du type de compte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de compte
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedType('client')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedType === 'client'
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <i className="ri-user-line text-3xl mb-2 block text-orange-500"></i>
                <span className="font-medium text-gray-900">Client</span>
                <p className="text-xs text-gray-500 mt-1">
                  Réserver des services
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedType('professional')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  selectedType === 'professional'
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <i className="ri-briefcase-line text-3xl mb-2 block text-orange-500"></i>
                <span className="font-medium text-gray-900">Professionnel</span>
                <p className="text-xs text-gray-500 mt-1">
                  Offrir des services
                </p>
              </button>
            </div>
          </div>

          {/* Numéro de téléphone (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone <span className="text-gray-400">(optionnel)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+253 XX XX XX XX"
            />
          </div>

          {/* Informations du compte Google */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-600 mb-1">
              <i className="ri-mail-line mr-2 text-orange-500"></i>
              {userEmail}
            </p>
            <p className="text-gray-600">
              <i className="ri-user-line mr-2 text-orange-500"></i>
              {userName}
            </p>
          </div>

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={isLoading || !selectedType}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Création du compte...
              </span>
            ) : (
              'Continuer'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          En continuant, vous acceptez nos{' '}
          <a href="/cgu" className="text-orange-500 hover:text-orange-600">
            Conditions d'utilisation
          </a>
        </p>
      </div>
    </div>
  );
}
