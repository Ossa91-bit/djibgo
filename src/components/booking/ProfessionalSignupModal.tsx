
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface ProfessionalSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const serviceCategories = [
  { value: 'plomberie', label: 'Plomberie', subCategories: ['Réparation de fuites', 'Installation sanitaire', 'Débouchage canalisations'] },
  { value: 'electricite', label: 'Électricité', subCategories: ['Installation électrique', 'Réparation panne', 'Mise aux normes'] },
  { value: 'menage', label: 'Ménage', subCategories: ['Ménage régulier', 'Grand nettoyage', 'Nettoyage bureaux'] },
  { value: 'jardinage', label: 'Jardinage', subCategories: ['Entretien jardin', 'Taille haies', 'Arrosage plantes'] },
  { value: 'peinture', label: 'Peinture', subCategories: ['Peinture intérieure', 'Peinture extérieure', 'Décoration murale'] },
  { value: 'menuiserie', label: 'Menuiserie', subCategories: ['Réparation meuble', 'Installation étagères', 'Pose parquet'] },
  { value: 'climatisation', label: 'Climatisation', subCategories: ['Installation climatiseur', 'Maintenance AC', 'Réparation ventilation'] },
  { value: 'informatique', label: 'Informatique', subCategories: ['Réparation ordinateur', 'Installation logiciel', 'Formation bureautique'] }
];

const districts = [
  'Balbala', 'Boulaos', 'Arhiba', 'Pk12', 'Douda', 'Hayableh', 'Gabode', 'Warabeh',
  'Centre-ville', 'Plateau du Serpent', 'Les Plateaux', 'Heron', 'Marabout'
];

export default function ProfessionalSignupModal({ isOpen, onClose }: ProfessionalSignupModalProps) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
    businessName: '', category: '', subCategory: '', experience: '', description: '',
    city: 'Djibouti', district: '', address: '',
    hasLicense: false, hasInsurance: false, acceptsTerms: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!formData.acceptsTerms) {
      alert('Vous devez accepter les conditions générales');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } = await signUp(
        formData.email,
        formData.password,
        {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          user_type: 'professional'
        }
      );

      if (authError) throw authError;

      if (authData.user) {
        // 2. Créer le profil professionnel
        const { error: profileError } = await supabase
          .from('professional_profiles')
          .insert({
            id: authData.user.id,
            business_name: formData.businessName,
            service_category: formData.category,
            sub_category: formData.subCategory,
            experience_years: parseInt(formData.experience),
            description: formData.description,
            city: formData.city,
            district: formData.district,
            address: formData.address,
            phone: formData.phone,
            has_license: formData.hasLicense,
            has_insurance: formData.hasInsurance,
            hourly_rate: 25, // Tarif par défaut
            commission_rate: 0.10, // Commission 10%
            trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 jours d'essai
            is_premium: false,
            rating: 5.0,
            total_reviews: 0
          });

        if (profileError) throw profileError;

        alert('Inscription réussie ! Un email de confirmation a été envoyé.');
        onClose();
        setStep(1);
        setFormData({
          firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
          businessName: '', category: '', subCategory: '', experience: '', description: '',
          city: 'Djibouti', district: '', address: '',
          hasLicense: false, hasInsurance: false, acceptsTerms: false
        });
      }
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      alert('Erreur lors de l\'inscription: ' + (error.message || 'Une erreur inconnue est survenue'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedCategory = serviceCategories.find(cat => cat.value === formData.category);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Devenir Professionnel</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <i className="ri-close-line text-xl text-gray-500"></i>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {num}
                </div>
                {num < 3 && <div className={`w-16 h-1 mx-2 ${step > num ? 'bg-orange-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Informations personnelles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="+253 XX XX XX XX"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer mot de passe *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Informations professionnelles</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nom de votre entreprise"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie de service *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      handleInputChange('category', e.target.value);
                      handleInputChange('subCategory', '');
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Choisir une catégorie</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spécialité</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => handleInputChange('subCategory', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    disabled={!selectedCategory}
                  >
                    <option value="">Choisir une spécialité</option>
                    {selectedCategory?.subCategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Années d'expérience *</label>
                <select
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionner l'expérience</option>
                  <option value="1">Moins d'1 an</option>
                  <option value="2">1-2 ans</option>
                  <option value="5">3-5 ans</option>
                  <option value="10">5-10 ans</option>
                  <option value="15">Plus de 10 ans</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description de vos services</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Décrivez vos services et votre expertise..."
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caractères</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Localisation et finalisation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Djibouti"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartier *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Choisir un quartier</option>
                    {districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse complète</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Numéro, rue, bâtiment..."
                />
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Certifications (optionnel)</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasLicense}
                      onChange={(e) => handleInputChange('hasLicense', e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">J'ai une licence professionnelle</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.hasInsurance}
                      onChange={(e) => handleInputChange('hasInsurance', e.target.checked)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">J'ai une assurance responsabilité civile</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.acceptsTerms}
                    onChange={(e) => handleInputChange('acceptsTerms', e.target.checked)}
                    className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    J'accepte les <span className="text-orange-500 font-medium">conditions générales</span> et 
                    la <span className="text-orange-500 font-medium">politique de confidentialité</span> de DjibGo. 
                    Je comprends que les 7 premiers jours sont gratuits, puis une commission de 10% s'applique sur chaque service.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between">
          {step > 1 && (
            <button
              onClick={handlePrev}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Précédent
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword)) ||
                (step === 2 && (!formData.businessName || !formData.category || !formData.experience))
              }
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.district || !formData.acceptsTerms}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading && <i className="ri-loader-4-line animate-spin mr-2"></i>}
              {loading ? 'Inscription...' : 'Finaliser l\'inscription'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
