import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingService?: any;
}

const CreateServiceModal: React.FC<CreateServiceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editingService
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly'>('hourly');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    hourly_rate: '',
    duration_minutes: '60',
    service_area: '',
    availability: 'available',
    certifications: '',
    vehicle_number: '',
    vehicle_type: '',
    languages_spoken: [] as string[]
  });

  // Modèles de description par catégorie
  const descriptionTemplates: Record<string, string[]> = {
    'Informatique': [
      'Expert en infrastructure informatique avec 5+ ans d\'expérience. Installation et maintenance de serveurs, réseaux d\'entreprise, et systèmes de sauvegarde. Disponible pour interventions urgentes 24/7.',
      'Spécialiste en sécurité informatique certifié. Audit de sécurité, mise en place de pare-feu, protection contre les cyberattaques, et formation du personnel. Solutions sur mesure pour PME et grandes entreprises.',
      'Développeur full-stack expérimenté. Création d\'applications web et mobile, sites e-commerce, systèmes de gestion personnalisés. Technologies modernes : React, Node.js, Python, bases de données SQL/NoSQL.',
      'Technicien support IT qualifié. Dépannage ordinateurs et réseaux, installation logiciels, récupération de données, maintenance préventive. Intervention rapide à domicile ou en entreprise.'
    ],
    'Plomberie': [
      'Plombier professionnel certifié avec 10+ ans d\'expérience. Installation et réparation de tous systèmes de plomberie : sanitaires, chauffage, climatisation. Intervention rapide pour fuites et urgences.',
      'Expert en installation sanitaire moderne. Salles de bain clé en main, cuisine équipée, systèmes d\'économie d\'eau. Devis gratuit et garantie sur tous travaux.',
      'Spécialiste dépannage plomberie 24/7. Débouchage canalisations, réparation fuites, remplacement robinetterie. Tarifs transparents et intervention sous 2h.'
    ],
    'Électricité': [
      'Électricien agréé avec licence professionnelle. Installation électrique complète, mise aux normes, dépannage urgences. Respect strict des normes de sécurité. Devis gratuit.',
      'Expert en domotique et électricité intelligente. Installation systèmes connectés, éclairage LED, panneaux solaires, économies d\'énergie. Solutions modernes et écologiques.',
      'Technicien électricien qualifié. Réparation pannes électriques, installation prises et interrupteurs, tableaux électriques, détection de courts-circuits. Disponible 24/7.'
    ],
    'Ménage': [
      'Service de ménage professionnel avec équipe formée. Nettoyage complet maisons et bureaux, repassage, vitres. Produits écologiques fournis. Forfaits réguliers disponibles.',
      'Femme de ménage expérimentée et de confiance. Ménage soigné, repassage impeccable, organisation intérieure. Références vérifiables. Flexibilité horaires.',
      'Entreprise de nettoyage certifiée. Ménage après travaux, nettoyage en profondeur, désinfection. Équipement professionnel et assurance responsabilité civile.'
    ],
    'Chauffeurs': [
      'Chauffeur privé professionnel avec 8+ ans d\'expérience. Véhicule climatisé et confortable. Trajets aéroport, courses quotidiennes, déplacements professionnels. Ponctualité garantie.',
      'Service de taxi fiable et sécurisé. Connaissance parfaite de Djibouti-Ville et environs. Tarifs fixes transparents, véhicule propre et entretenu. Disponible 24/7.',
      'Chauffeur VIP discret et courtois. Transport de cadres et personnalités, véhicule haut de gamme, multilangue. Service premium avec confidentialité assurée.'
    ]
  };

  // Sous-catégories dynamiques par catégorie
  const categorySubcategories: Record<string, string[]> = {
    'Informatique': [
      'Infrastructure & Systèmes',
      'Réseau & Télécommunications',
      'Sécurité Informatique',
      'Développement Web & Mobile',
      'Support IT & Maintenance'
    ],
    'Plomberie': [
      'Installation Sanitaire',
      'Réparation & Dépannage',
      'Chauffage & Climatisation',
      'Débouchage Canalisations'
    ],
    'Électricité': [
      'Installation Électrique',
      'Dépannage Urgence',
      'Domotique & Automatisation',
      'Énergie Solaire'
    ],
    'Ménage': [
      'Ménage Régulier',
      'Nettoyage en Profondeur',
      'Repassage',
      'Nettoyage Bureaux'
    ],
    'Chauffeurs': [
      'Taxi Urbain',
      'Chauffeur Privé',
      'Transport Aéroport',
      'Location avec Chauffeur'
    ]
  };

  // Liste des types de véhicules
  const vehicleTypes = [
    'Berline',
    'SUV',
    'Taxi',
    'Minibus',
    'Van',
    'Utilitaire',
    'Moto',
    'Autre'
  ];

  // Liste des langues
  const availableLanguages = [
    'Français',
    'Afar',
    'Arabe',
    'Anglais',
    'Somali'
  ];

  // Charger les catégories depuis la base de données
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError('');
        
        console.log('🔍 Chargement des catégories...');
        
        const { data, error } = await supabase
          .from('service_categories')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('❌ Erreur lors du chargement des catégories:', error);
          throw error;
        }
        
        console.log('✅ Catégories chargées:', data);
        setCategories(data || []);
        
        if (!data || data.length === 0) {
          console.warn('⚠️ Aucune catégorie active trouvée');
          setError('Aucune catégorie disponible. Veuillez contacter l\'administrateur.');
        }
      } catch (err: any) {
        console.error('❌ Erreur complète:', err);
        setError(`Erreur de chargement des catégories: ${err.message}`);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Mettre à jour les sous-catégories quand la catégorie change
  useEffect(() => {
    if (formData.category) {
      const subs = categorySubcategories[formData.category] || [];
      setSubcategories(subs);
      // Ne pas réinitialiser la sous-catégorie si on est en mode édition et qu'elle existe
      if (!editingService && !subs.includes(formData.subcategory)) {
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category, editingService]);

  useEffect(() => {
    if (editingService) {
      // Charger d'abord la catégorie pour déclencher le chargement des sous-catégories
      const category = editingService.category || '';
      const subcategory = editingService.subcategory || '';
      
      setFormData({
        category: category,
        subcategory: subcategory,
        title: editingService.title || '',
        description: editingService.description || '',
        hourly_rate: editingService.hourly_rate?.toString() || '',
        duration_minutes: editingService.duration_minutes?.toString() || '60',
        service_area: editingService.service_area || '',
        availability: editingService.availability || 'available',
        certifications: editingService.certifications || '',
        vehicle_number: editingService.vehicle_number || '',
        vehicle_type: editingService.vehicle_type || '',
        languages_spoken: editingService.languages_spoken || []
      });
      
      // Charger les sous-catégories pour la catégorie du service
      if (category) {
        const subs = categorySubcategories[category] || [];
        setSubcategories(subs);
      }
      
      // Déterminer le type de tarification
      if (editingService.duration_minutes && editingService.duration_minutes > 0) {
        setPricingType('hourly');
      } else {
        setPricingType('fixed');
      }
    } else {
      setFormData({
        category: '',
        subcategory: '',
        title: '',
        description: '',
        hourly_rate: '',
        duration_minutes: '60',
        service_area: '',
        availability: 'available',
        certifications: '',
        vehicle_number: '',
        vehicle_type: '',
        languages_spoken: []
      });
      setPricingType('hourly');
      setSubcategories([]);
    }
  }, [editingService, isOpen]);

  // Vérifier si la catégorie nécessite les champs véhicule
  const isTransportCategory = () => {
    const transportCategories = ['Chauffeurs', 'Chauffeur', 'Transport', 'Taxi', 'Livraison'];
    return transportCategories.some(cat => 
      formData.category.toLowerCase().includes(cat.toLowerCase())
    );
  };

  // Valider le format du numéro de véhicule (exemple: 925D103)
  const validateVehicleNumber = (number: string): boolean => {
    const regex = /^\d{1,4}[A-Z]\d{2,3}$/;
    return regex.test(number);
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages_spoken: prev.languages_spoken.includes(language)
        ? prev.languages_spoken.filter(l => l !== language)
        : [...prev.languages_spoken, language]
    }));
  };

  // Utiliser un modèle de description
  const useTemplate = (template: string) => {
    setFormData(prev => ({ ...prev, description: template }));
    setShowTemplateModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation des champs de base
    if (!formData.category || !formData.title || !formData.description || !formData.hourly_rate || !formData.service_area) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation du numéro de véhicule UNIQUEMENT pour les services de transport
    if (isTransportCategory()) {
      if (!formData.vehicle_number) {
        setError('Le numéro du véhicule est obligatoire pour les services de transport');
        return;
      }
      
      if (!validateVehicleNumber(formData.vehicle_number)) {
        setError('Format du numéro de véhicule invalide. Exemple correct : 925D103 (1-4 chiffres + 1 lettre + 2-3 chiffres)');
        return;
      }

      if (!formData.vehicle_type) {
        setError('Le type de véhicule est obligatoire pour les services de transport');
        return;
      }

      if (formData.languages_spoken.length === 0) {
        setError('Veuillez sélectionner au moins une langue parlée');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour créer un service');
      }

      console.log('👤 Utilisateur connecté:', user.id);

      // Préparer les données du service
      const vehicleNumber = formData.vehicle_number ? formData.vehicle_number.toUpperCase() : null;
      const hourlyRate = parseFloat(formData.hourly_rate);
      
      if (isNaN(hourlyRate) || hourlyRate <= 0) {
        throw new Error('Le tarif doit être un nombre positif');
      }

      const serviceData = {
        professional_id: user.id,
        category: formData.category,
        subcategory: formData.subcategory || null,
        title: formData.title,
        description: formData.description,
        hourly_rate: hourlyRate,
        price: hourlyRate,
        duration_minutes: pricingType === 'hourly' ? parseInt(formData.duration_minutes) : 0,
        service_area: formData.service_area,
        availability: formData.availability,
        certifications: formData.certifications || null,
        vehicle_number: vehicleNumber,
        vehicle_type: formData.vehicle_type || null,
        languages_spoken: formData.languages_spoken.length > 0 ? formData.languages_spoken : null,
        is_active: true,
      };

      console.log('📝 Données à enregistrer:', serviceData);

      let result;

      if (editingService) {
        // Mise à jour d'un service existant
        console.log('🔄 Mise à jour du service:', editingService.id);
        
        const { data, error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)
          .eq('professional_id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Erreur de mise à jour:', updateError);
          throw updateError;
        }

        console.log('✅ Service mis à jour avec succès:', data);
        result = data;
      } else {
        // Création d'un nouveau service
        console.log('➕ Création d\'un nouveau service');
        
        const { data, error: insertError } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Erreur d\'insertion:', insertError);
          throw insertError;
        }

        console.log('✅ Service créé avec succès:', data);
        result = data;
      }

      // Vérifier que le service a bien été enregistré
      if (!result) {
        throw new Error('Le service n\'a pas été enregistré correctement');
      }

      // Réinitialiser le formulaire
      setFormData({
        category: '',
        subcategory: '',
        title: '',
        description: '',
        hourly_rate: '',
        duration_minutes: '60',
        service_area: '',
        availability: 'available',
        certifications: '',
        vehicle_number: '',
        vehicle_type: '',
        languages_spoken: []
      });
      setPricingType('hourly');
      setError('');

      console.log('🎉 Opération terminée avec succès');

      // Fermer le modal et notifier le succès
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ Erreur complète:', err);
      
      // Messages d'erreur plus clairs
      let errorMessage = 'Une erreur est survenue lors de l\'enregistrement';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Erreurs spécifiques de Supabase
      if (err.code === '23505') {
        errorMessage = 'Ce service existe déjà';
      } else if (err.code === '23503') {
        errorMessage = 'Erreur de référence dans la base de données. Vérifiez que votre profil professionnel existe.';
      } else if (err.code === '42501') {
        errorMessage = 'Vous n\'avez pas les permissions nécessaires. Vérifiez que vous êtes bien connecté en tant que professionnel.';
      } else if (err.code === 'PGRST116') {
        errorMessage = 'Aucune donnée retournée. Vérifiez les permissions de la base de données.';
      } else if (err.code === '42P01') {
        errorMessage = 'Table non trouvée. Contactez l\'administrateur.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const availableTemplates = descriptionTemplates[formData.category] || [];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingService ? 'Modifier le service' : 'Créer un nouveau service'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <i className="ri-error-warning-line text-xl mr-2 flex-shrink-0 mt-0.5"></i>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie de service *
            </label>
            {loadingCategories ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Chargement des catégories...
              </div>
            ) : (
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
            {!loadingCategories && categories.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Aucune catégorie active disponible. Contactez l'administrateur.
              </p>
            )}
          </div>

          {/* Sous-catégories dynamiques */}
          {subcategories.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <i className="ri-folder-3-line text-orange-500 mr-2"></i>
                Sous-catégorie (spécialisation)
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                className="w-full px-4 py-3 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionner une spécialisation</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-2 flex items-center">
                <i className="ri-lightbulb-line text-amber-500 mr-1"></i>
                Choisissez votre domaine d'expertise pour être mieux trouvé par les clients
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre du service *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Infrastructure & Systèmes"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Description *
              </label>
              {availableTemplates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center whitespace-nowrap"
                >
                  <i className="ri-file-list-3-line mr-1"></i>
                  Utiliser un modèle
                </button>
              )}
            </div>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre service en détail..."
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500 caractères</p>
          </div>

          {/* Options de tarification */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200">
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
              <i className="ri-money-dollar-circle-line text-teal-500 mr-2"></i>
              Options de tarification *
            </label>
            <div className="space-y-3">
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg hover:bg-white cursor-pointer transition-all">
                <input
                  type="radio"
                  name="pricingType"
                  checked={pricingType === 'fixed'}
                  onChange={() => setPricingType('fixed')}
                  className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">Tarif fixe</span>
                  <p className="text-xs text-gray-500">Prix unique pour le service complet</p>
                </div>
              </label>
              <label className="flex items-center p-3 border-2 border-gray-300 rounded-lg hover:bg-white cursor-pointer transition-all">
                <input
                  type="radio"
                  name="pricingType"
                  checked={pricingType === 'hourly'}
                  onChange={() => setPricingType('hourly')}
                  className="w-4 h-4 text-teal-500 border-gray-300 focus:ring-teal-500"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900">Tarif horaire</span>
                  <p className="text-xs text-gray-500">Prix par heure de prestation</p>
                </div>
              </label>
            </div>
          </div>

          {/* Champs spécifiques aux chauffeurs/transport */}
          {isTransportCategory() && (
            <div className="space-y-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 flex items-center">
                <i className="ri-car-line mr-2"></i>
                Informations sur le véhicule
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Numéro du véhicule (Taxi/Voiture) *
                </label>
                <input
                  type="text"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 925D103, 75D99, 1D75"
                  required
                />
                {formData.vehicle_number && !validateVehicleNumber(formData.vehicle_number) && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <i className="ri-error-warning-line"></i>
                    Format invalide. Exemples valides : 925D103, 75D99, 1D75, 955D103, 975D98
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Format : 1-4 chiffres + 1 lettre + 2-3 chiffres (ex: 925D103, 75D99, 1D75)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de véhicule *
                </label>
                <select
                  required
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un type de véhicule</option>
                  {vehicleTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Langues parlées *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.map((language) => (
                    <label
                      key={language}
                      className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.languages_spoken.includes(language)}
                        onChange={() => handleLanguageToggle(language)}
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{language}</span>
                    </label>
                  ))}
                </div>
                {formData.languages_spoken.length === 0 && (
                  <p className="text-xs text-red-500 mt-2 flex items-center">
                    <i className="ri-error-warning-line mr-1"></i>
                    Veuillez sélectionner au moins une langue
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {pricingType === 'fixed' ? 'Tarif fixe (FDJ) *' : 'Tarif horaire (FDJ) *'}
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="7500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {pricingType === 'hourly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="60"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone de service *
            </label>
            <input
              type="text"
              required
              value={formData.service_area}
              onChange={(e) => setFormData({ ...formData, service_area: e.target.value })}
              placeholder="Ex: Djibouti-Ville et environs"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilité *
            </label>
            <select
              required
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="available">Disponible</option>
              <option value="busy">Occupé</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certifications (optionnel)
            </label>
            <textarea
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="Listez vos certifications, diplômes ou qualifications..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{formData.certifications.length}/500 caractères</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingCategories || categories.length === 0}
              className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center"
            >
              {loading ? (
                <>
                  <i className="ri-loader-4-line animate-spin mr-2"></i>
                  Enregistrement...
                </>
              ) : (
                editingService ? 'Mettre à jour' : 'Créer le service'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal des modèles de description */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowTemplateModal(false)}></div>
          
          <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-white flex items-center">
                <i className="ri-file-list-3-line mr-2"></i>
                Modèles de description - {formData.category}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start">
                <i className="ri-information-line text-blue-500 mr-2 mt-0.5 flex-shrink-0"></i>
                Cliquez sur un modèle pour l'utiliser. Vous pourrez le modifier ensuite selon vos besoins.
              </p>

              {availableTemplates.map((template, index) => (
                <div
                  key={index}
                  onClick={() => useTemplate(template)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-500 bg-orange-100 px-2 py-1 rounded">
                      Modèle {index + 1}
                    </span>
                    <i className="ri-arrow-right-circle-line text-xl text-gray-400 group-hover:text-orange-500 transition-colors"></i>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{template}</p>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <i className="ri-character-recognition-line mr-1"></i>
                    {template.length} caractères
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateServiceModal;