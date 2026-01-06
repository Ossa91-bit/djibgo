import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import AnimatedSection from '../../components/feature/AnimatedSection';

interface ImportStats {
  categories: number;
  professionals: number;
  services: number;
}

export default function AdminDemoDataPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState<ImportStats>({ categories: 0, professionals: 0, services: 0 });
  const [importLog, setImportLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setImportLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  // Données des catégories
  const categories = [
    // Techniciens
    { name: 'Électricien', description: 'Installation et dépannage électrique', icon: 'ri-flashlight-line', type: 'technicien' },
    { name: 'Plombier', description: 'Plomberie et sanitaire', icon: 'ri-drop-line', type: 'technicien' },
    { name: 'Climatisation', description: 'Climatisation et réfrigération', icon: 'ri-temp-cold-line', type: 'technicien' },
    { name: 'Menuisier', description: 'Menuiserie et ébénisterie', icon: 'ri-hammer-line', type: 'technicien' },
    { name: 'Peintre', description: 'Peinture et décoration', icon: 'ri-paint-brush-line', type: 'technicien' },
    { name: 'Maçon', description: 'Maçonnerie et construction', icon: 'ri-building-line', type: 'technicien' },
    { name: 'Informatique', description: 'Dépannage et maintenance IT', icon: 'ri-computer-line', type: 'technicien' },
    { name: 'Couture', description: 'Couture et retouches', icon: 'ri-scissors-cut-line', type: 'technicien' },
    { name: 'Mécanique', description: 'Mécanique automobile', icon: 'ri-tools-line', type: 'technicien' },
    { name: 'Jardinage', description: 'Jardinage et paysagisme', icon: 'ri-plant-line', type: 'technicien' },
    
    // Chauffeurs
    { name: 'Chauffeur Personnel', description: 'Service VIP avec véhicules de luxe', icon: 'ri-user-star-line', type: 'chauffeur' },
    { name: 'Taxi', description: 'Courses urbaines rapides et fiables', icon: 'ri-taxi-line', type: 'chauffeur' },
    { name: 'Livraison', description: 'Livraison express de colis', icon: 'ri-truck-line', type: 'chauffeur' },
    { name: 'Familial', description: 'Transport sécurisé pour familles', icon: 'ri-parent-line', type: 'chauffeur' },
    { name: 'Événementiel', description: 'Prestations pour mariages et événements', icon: 'ri-calendar-event-line', type: 'chauffeur' },
    { name: 'Tourisme', description: 'Visites guidées et excursions', icon: 'ri-map-2-line', type: 'chauffeur' },
    { name: 'Affaires', description: 'Transport professionnel et discret', icon: 'ri-briefcase-line', type: 'chauffeur' },
    { name: 'Médical', description: 'Transport médical et PMR', icon: 'ri-hospital-line', type: 'chauffeur' }
  ];

  // Données des techniciens
  const technicians = [
    {
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@example.dj',
      phone: '+253 77 12 34 56',
      category: 'Électricien',
      business_name: 'Électricien Professionnel',
      description: 'Expert en installation électrique, dépannage urgent, mise aux normes et tableaux électriques. 15 ans d\'expérience.',
      hourly_rate: 4500,
      location: 'Quartier 1, Djibouti',
      latitude: 11.8251,
      longitude: 42.5903,
      experience_years: 15,
      certifications: ['Certification électrique', 'Habilitation basse tension', 'Formation sécurité'],
      specialties: ['Installation électrique', 'Dépannage urgent', 'Mise aux normes', 'Tableaux électriques'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.9,
      total_reviews: 87
    },
    {
      name: 'Mohamed Ali',
      email: 'mohamed.ali@example.dj',
      phone: '+253 77 23 45 67',
      category: 'Plombier',
      business_name: 'Plombier Expert',
      description: 'Spécialiste en fuites d\'eau, installation sanitaire, débouchage et chauffe-eau. 12 ans d\'expérience.',
      hourly_rate: 4000,
      location: 'Quartier 3, Djibouti',
      latitude: 11.8201,
      longitude: 42.5953,
      experience_years: 12,
      certifications: ['Certification plomberie', 'Gaz naturel', 'Assainissement'],
      specialties: ['Fuites d\'eau', 'Installation sanitaire', 'Débouchage', 'Chauffe-eau'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.8,
      total_reviews: 124
    },
    {
      name: 'Ibrahim Youssouf',
      email: 'ibrahim.youssouf@example.dj',
      phone: '+253 77 34 56 78',
      category: 'Climatisation',
      business_name: 'Climatisation &amp; Réfrigération',
      description: 'Expert en installation climatisation, maintenance préventive, réparation urgente et chambres froides. 10 ans d\'expérience.',
      hourly_rate: 5000,
      location: 'Quartier 5, Djibouti',
      latitude: 11.8351,
      longitude: 42.6003,
      experience_years: 10,
      certifications: ['Frigoriste certifié', 'Manipulation fluides frigorigènes', 'Climatisation'],
      specialties: ['Installation climatisation', 'Maintenance préventive', 'Réparation urgente', 'Chambres froides'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.9,
      total_reviews: 96
    },
    {
      name: 'Abdoulkader Omar',
      email: 'abdoulkader.omar@example.dj',
      phone: '+253 77 45 67 89',
      category: 'Menuisier',
      business_name: 'Menuisier Ébéniste',
      description: 'Spécialiste en meubles sur mesure, portes et fenêtres, agencement intérieur et rénovation bois. 18 ans d\'expérience.',
      hourly_rate: 3500,
      location: 'Quartier 2, Djibouti',
      latitude: 11.8151,
      longitude: 42.5803,
      experience_years: 18,
      certifications: ['CAP Menuiserie', 'Ébénisterie', 'Agencement'],
      specialties: ['Meubles sur mesure', 'Portes et fenêtres', 'Agencement intérieur', 'Rénovation bois'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.8,
      total_reviews: 73
    },
    {
      name: 'Hassan Farah',
      email: 'hassan.farah@example.dj',
      phone: '+253 77 56 78 90',
      category: 'Peintre',
      business_name: 'Peintre Décorateur',
      description: 'Expert en peinture intérieure, peinture extérieure, décoration murale et enduits décoratifs. 14 ans d\'expérience.',
      hourly_rate: 3000,
      location: 'Quartier 4, Djibouti',
      latitude: 11.8301,
      longitude: 42.6053,
      experience_years: 14,
      certifications: ['Peinture professionnelle', 'Décoration intérieure', 'Revêtements'],
      specialties: ['Peinture intérieure', 'Peinture extérieure', 'Décoration murale', 'Enduits décoratifs'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.7,
      total_reviews: 89
    },
    {
      name: 'Youssouf Ahmed',
      email: 'youssouf.ahmed@example.dj',
      phone: '+253 77 67 89 01',
      category: 'Maçon',
      business_name: 'Maçon Professionnel',
      description: 'Spécialiste en construction neuve, rénovation, murs et cloisons, fondations. 20 ans d\'expérience.',
      hourly_rate: 4000,
      location: 'Quartier 7, Djibouti',
      latitude: 11.8451,
      longitude: 42.6103,
      experience_years: 20,
      certifications: ['Maçonnerie générale', 'Béton armé', 'Construction'],
      specialties: ['Construction neuve', 'Rénovation', 'Murs et cloisons', 'Fondations'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.9,
      total_reviews: 112
    },
    {
      name: 'Khadija Mohamed',
      email: 'khadija.mohamed@example.dj',
      phone: '+253 77 78 90 12',
      category: 'Informatique',
      business_name: 'Technicienne Informatique',
      description: 'Experte en dépannage PC, réseaux, installation logiciels et sécurité informatique. 8 ans d\'expérience.',
      hourly_rate: 5500,
      location: 'Quartier 6, Djibouti',
      latitude: 11.8401,
      longitude: 42.6153,
      experience_years: 8,
      certifications: ['CompTIA A+', 'Network+', 'Microsoft Certified'],
      specialties: ['Dépannage PC', 'Réseaux', 'Installation logiciels', 'Sécurité informatique'],
      languages: ['Français', 'Anglais', 'Somali'],
      rating: 4.8,
      total_reviews: 145
    },
    {
      name: 'Zahra Hassan',
      email: 'zahra.hassan@example.dj',
      phone: '+253 77 89 01 23',
      category: 'Couture',
      business_name: 'Couturière Professionnelle',
      description: 'Spécialiste en vêtements sur mesure, retouches, robes de cérémonie et ameublement. 16 ans d\'expérience.',
      hourly_rate: 2500,
      location: 'Quartier 1, Djibouti',
      latitude: 11.8271,
      longitude: 42.5923,
      experience_years: 16,
      certifications: ['CAP Couture', 'Stylisme', 'Retouches'],
      specialties: ['Vêtements sur mesure', 'Retouches', 'Robes de cérémonie', 'Ameublement'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.9,
      total_reviews: 156
    },
    {
      name: 'Saïd Abdillahi',
      email: 'said.abdillahi@example.dj',
      phone: '+253 77 90 12 34',
      category: 'Mécanique',
      business_name: 'Mécanicien Auto',
      description: 'Expert en révision complète, diagnostic panne, freinage et moteur. 13 ans d\'expérience.',
      hourly_rate: 4500,
      location: 'Quartier 3, Djibouti',
      latitude: 11.8221,
      longitude: 42.5973,
      experience_years: 13,
      certifications: ['Mécanique automobile', 'Diagnostic électronique', 'Climatisation auto'],
      specialties: ['Révision complète', 'Diagnostic panne', 'Freinage', 'Moteur'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.8,
      total_reviews: 134
    },
    {
      name: 'Amina Ali',
      email: 'amina.ali@example.dj',
      phone: '+253 77 01 23 45',
      category: 'Jardinage',
      business_name: 'Jardinière Paysagiste',
      description: 'Experte en entretien jardins, création espaces verts, taille arbres et irrigation. 9 ans d\'expérience.',
      hourly_rate: 3000,
      location: 'Quartier 5, Djibouti',
      latitude: 11.8331,
      longitude: 42.6023,
      experience_years: 9,
      certifications: ['Horticulture', 'Paysagisme', 'Arrosage automatique'],
      specialties: ['Entretien jardins', 'Création espaces verts', 'Taille arbres', 'Irrigation'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.7,
      total_reviews: 68
    }
  ];

  // Données des chauffeurs
  const drivers = [
    {
      name: 'Mohamed Farah',
      email: 'mohamed.farah@example.dj',
      phone: '+253 77 11 22 33',
      category: 'Chauffeur Personnel',
      business_name: 'Chauffeur Personnel VIP',
      description: 'Service VIP avec Mercedes-Benz Classe E. Spécialiste en transferts aéroport, événements VIP et trajets longue distance. 12 ans d\'expérience.',
      hourly_rate: 5000,
      location: 'Quartier 1, Djibouti',
      latitude: 11.8251,
      longitude: 42.5903,
      experience_years: 12,
      vehicle_type: 'Berline de luxe',
      vehicle_model: 'Mercedes-Benz Classe E',
      specialties: ['Transferts aéroport', 'Événements VIP', 'Trajets longue distance'],
      languages: ['Français', 'Arabe', 'Anglais', 'Somali'],
      rating: 4.9,
      total_reviews: 47
    },
    {
      name: 'Hassan Omar',
      email: 'hassan.omar@example.dj',
      phone: '+253 77 22 33 44',
      category: 'Taxi',
      business_name: 'Chauffeur Taxi Professionnel',
      description: 'Service de taxi avec Toyota Corolla. Courses urbaines, disponibilité 24/7, tarifs fixes. 8 ans d\'expérience.',
      hourly_rate: 2500,
      location: 'Quartier 5, Djibouti',
      latitude: 11.8351,
      longitude: 42.6003,
      experience_years: 8,
      vehicle_type: 'Taxi',
      vehicle_model: 'Toyota Corolla',
      specialties: ['Courses urbaines', 'Disponibilité 24/7', 'Tarifs fixes'],
      languages: ['Français', 'Somali', 'Arabe'],
      rating: 4.7,
      total_reviews: 89
    },
    {
      name: 'Amina Youssouf',
      email: 'amina.youssouf@example.dj',
      phone: '+253 77 33 44 55',
      category: 'Livraison',
      business_name: 'Chauffeur Livraison Express',
      description: 'Service de livraison express avec Ford Transit. Livraison express, colis fragiles, suivi en temps réel. 5 ans d\'expérience.',
      hourly_rate: 2000,
      location: 'Quartier 2, Djibouti',
      latitude: 11.8151,
      longitude: 42.5803,
      experience_years: 5,
      vehicle_type: 'Utilitaire',
      vehicle_model: 'Ford Transit',
      specialties: ['Livraison express', 'Colis fragiles', 'Suivi en temps réel'],
      languages: ['Français', 'Somali'],
      rating: 4.8,
      total_reviews: 124
    },
    {
      name: 'Ibrahim Ali',
      email: 'ibrahim.ali@example.dj',
      phone: '+253 77 44 55 66',
      category: 'Familial',
      business_name: 'Chauffeur Familial',
      description: 'Transport familial avec Toyota Land Cruiser. Transport scolaire, sorties familiales, sécurité enfants. 10 ans d\'expérience.',
      hourly_rate: 3500,
      location: 'Quartier 7, Djibouti',
      latitude: 11.8451,
      longitude: 42.6103,
      experience_years: 10,
      vehicle_type: 'SUV',
      vehicle_model: 'Toyota Land Cruiser',
      specialties: ['Transport scolaire', 'Sorties familiales', 'Sécurité enfants'],
      languages: ['Français', 'Arabe', 'Somali'],
      rating: 4.9,
      total_reviews: 56
    },
    {
      name: 'Youssouf Ahmed',
      email: 'youssouf.ahmed.driver@example.dj',
      phone: '+253 77 55 66 77',
      category: 'Événementiel',
      business_name: 'Chauffeur Événementiel',
      description: 'Service événementiel avec Lincoln Town Car. Mariages, événements corporatifs, cérémonies officielles. 7 ans d\'expérience.',
      hourly_rate: 6000,
      location: 'Quartier 3, Djibouti',
      latitude: 11.8201,
      longitude: 42.5953,
      experience_years: 7,
      vehicle_type: 'Limousine',
      vehicle_model: 'Lincoln Town Car',
      specialties: ['Mariages', 'Événements corporatifs', 'Cérémonies officielles'],
      languages: ['Français', 'Anglais', 'Arabe'],
      rating: 4.8,
      total_reviews: 34
    },
    {
      name: 'Khadija Hassan',
      email: 'khadija.hassan.driver@example.dj',
      phone: '+253 77 66 77 88',
      category: 'Tourisme',
      business_name: 'Chauffeur Tourisme',
      description: 'Service touristique avec Mercedes Sprinter. Visites guidées, excursions, circuits touristiques. 9 ans d\'expérience.',
      hourly_rate: 4500,
      location: 'Quartier 4, Djibouti',
      latitude: 11.8301,
      longitude: 42.6053,
      experience_years: 9,
      vehicle_type: 'Minibus',
      vehicle_model: 'Mercedes Sprinter',
      specialties: ['Visites guidées', 'Excursions', 'Circuits touristiques'],
      languages: ['Français', 'Anglais', 'Arabe', 'Italien'],
      rating: 4.9,
      total_reviews: 78
    },
    {
      name: 'Abdoulkader Said',
      email: 'abdoulkader.said@example.dj',
      phone: '+253 77 77 88 99',
      category: 'Affaires',
      business_name: 'Chauffeur Affaires',
      description: 'Transport professionnel avec BMW Série 5. Rendez-vous professionnels, transferts aéroport, discrétion garantie. 11 ans d\'expérience.',
      hourly_rate: 5500,
      location: 'Quartier 6, Djibouti',
      latitude: 11.8401,
      longitude: 42.6153,
      experience_years: 11,
      vehicle_type: 'Berline executive',
      vehicle_model: 'BMW Série 5',
      specialties: ['Rendez-vous professionnels', 'Transferts aéroport', 'Discrétion garantie'],
      languages: ['Français', 'Anglais', 'Arabe'],
      rating: 4.8,
      total_reviews: 62
    },
    {
      name: 'Zahra Mohamed',
      email: 'zahra.mohamed.driver@example.dj',
      phone: '+253 77 88 99 00',
      category: 'Médical',
      business_name: 'Chauffeur Médical',
      description: 'Transport médical avec Renault Kangoo. Transport médical, personnes à mobilité réduite, urgences non-vitales. 6 ans d\'expérience.',
      hourly_rate: 4000,
      location: 'Quartier 1, Djibouti',
      latitude: 11.8271,
      longitude: 42.5923,
      experience_years: 6,
      vehicle_type: 'Véhicule adapté',
      vehicle_model: 'Renault Kangoo',
      specialties: ['Transport médical', 'Personnes à mobilité réduite', 'Urgences non-vitales'],
      languages: ['Français', 'Somali', 'Arabe'],
      rating: 4.9,
      total_reviews: 41
    }
  ];

  const importCategories = async () => {
    addLog('Début de l\'importation des catégories...');
    let imported = 0;

    for (const category of categories) {
      try {
        // Vérifier si la catégorie existe déjà
        const { data: existing } = await supabase
          .from('service_categories')
          .select('id')
          .eq('name', category.name)
          .single();

        if (existing) {
          addLog(`Catégorie "${category.name}" existe déjà, ignorée.`);
          continue;
        }

        // Créer la catégorie
        const { error } = await supabase
          .from('service_categories')
          .insert({
            name: category.name,
            description: category.description,
            icon: category.icon,
            is_active: true
          });

        if (error) throw error;

        imported++;
        addLog(`✓ Catégorie "${category.name}" importée avec succès.`);
      } catch (err: any) {
        addLog(`✗ Erreur lors de l'importation de "${category.name}": ${err.message}`);
      }
    }

    addLog(`Importation des catégories terminée: ${imported}/${categories.length}`);
    return imported;
  };

  const importProfessionals = async () => {
    addLog('Début de l\'importation des professionnels...');
    let imported = 0;

    const allProfessionals = [...technicians, ...drivers];

    for (const prof of allProfessionals) {
      try {
        // Vérifier si l'email existe déjà
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', prof.email)
          .single();

        if (existingProfile) {
          addLog(`Professionnel "${prof.name}" (${prof.email}) existe déjà, ignoré.`);
          continue;
        }

        // Créer un compte utilisateur via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: prof.email,
          password: 'Demo123456!', // Mot de passe par défaut pour les comptes de démo
          options: {
            data: {
              full_name: prof.name,
              phone: prof.phone,
              user_type: 'professional'
            }
          }
        });

        if (authError) {
          addLog(`✗ Erreur Auth pour "${prof.name}": ${authError.message}`);
          continue;
        }

        if (!authData.user) {
          addLog(`✗ Aucun utilisateur créé pour "${prof.name}"`);
          continue;
        }

        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: prof.email,
            full_name: prof.name,
            phone: prof.phone,
            user_type: 'professional'
          });

        if (profileError) {
          addLog(`✗ Erreur profil pour "${prof.name}": ${profileError.message}`);
          continue;
        }

        // Créer le profil professionnel
        const { error: professionalError } = await supabase
          .from('professional_profiles')
          .insert({
            user_id: authData.user.id,
            business_name: prof.business_name,
            service_category: prof.category,
            description: prof.description,
            hourly_rate: prof.hourly_rate,
            location: prof.location,
            latitude: prof.latitude,
            longitude: prof.longitude,
            experience_years: prof.experience_years,
            certifications: prof.certifications || [],
            specialties: prof.specialties || [],
            languages: prof.languages || [],
            rating: prof.rating,
            total_reviews: prof.total_reviews,
            is_active: true,
            is_verified: true
          });

        if (professionalError) {
          addLog(`✗ Erreur profil professionnel pour "${prof.name}": ${professionalError.message}`);
          continue;
        }

        imported++;
        addLog(`✓ Professionnel "${prof.name}" importé avec succès.`);
      } catch (err: any) {
        addLog(`✗ Erreur lors de l'importation de "${prof.name}": ${err.message}`);
      }
    }

    addLog(`Importation des professionnels terminée: ${imported}/${allProfessionals.length}`);
    return imported;
  };

  const handleImport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setImportLog([]);
    setStats({ categories: 0, professionals: 0, services: 0 });

    try {
      addLog('=== DÉBUT DE L\'IMPORTATION ===');
      
      // Importer les catégories
      const categoriesImported = await importCategories();
      setStats(prev => ({ ...prev, categories: categoriesImported }));

      // Attendre un peu entre les importations
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Importer les professionnels
      const professionalsImported = await importProfessionals();
      setStats(prev => ({ ...prev, professionals: professionalsImported }));

      addLog('=== IMPORTATION TERMINÉE ===');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
      addLog(`ERREUR CRITIQUE: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <AnimatedSection animation="slideUp">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Importation des Données de Démonstration
                </h1>
                <p className="text-gray-600">
                  Importez automatiquement toutes les données d'exemple (catégories, professionnels) dans votre base de données Supabase.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-arrow-left-line mr-2"></i>
                Retour
              </button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium mb-1">Catégories</p>
                    <p className="text-3xl font-bold text-orange-900">{categories.length}</p>
                    <p className="text-xs text-orange-600 mt-1">À importer</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <i className="ri-service-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-teal-600 font-medium mb-1">Professionnels</p>
                    <p className="text-3xl font-bold text-teal-900">{technicians.length + drivers.length}</p>
                    <p className="text-xs text-teal-600 mt-1">À importer</p>
                  </div>
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <i className="ri-user-star-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">Total</p>
                    <p className="text-3xl font-bold text-blue-900">{categories.length + technicians.length + drivers.length}</p>
                    <p className="text-xs text-blue-600 mt-1">Éléments</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <i className="ri-database-2-line text-2xl text-white"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Avertissement */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <i className="ri-alert-line text-amber-600 text-xl mt-0.5"></i>
                <div>
                  <h3 className="font-semibold text-amber-900 mb-1">Important</h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Cette opération créera des comptes utilisateurs de démonstration</li>
                    <li>• Le mot de passe par défaut est: <strong>Demo123456!</strong></li>
                    <li>• Les données existantes ne seront pas écrasées</li>
                    <li>• L'importation peut prendre quelques minutes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bouton d'importation */}
            <div className="flex justify-center">
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap cursor-pointer"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" color="text-white" />
                    Importation en cours...
                  </>
                ) : (
                  <>
                    <i className="ri-download-cloud-line text-2xl"></i>
                    Lancer l'importation
                  </>
                )}
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Résultats */}
        {(success || error || importLog.length > 0) && (
          <AnimatedSection animation="slideUp">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Message de succès */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <i className="ri-checkbox-circle-line text-green-600 text-2xl"></i>
                    <div>
                      <h3 className="font-semibold text-green-900 mb-1">Importation réussie !</h3>
                      <p className="text-sm text-green-800">
                        {stats.categories} catégories et {stats.professionals} professionnels ont été importés avec succès.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <i className="ri-error-warning-line text-red-600 text-2xl"></i>
                    <div>
                      <h3 className="font-semibold text-red-900 mb-1">Erreur</h3>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Journal d'importation */}
              {importLog.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="ri-file-list-3-line text-orange-500"></i>
                    Journal d'importation
                  </h3>
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="font-mono text-xs space-y-1">
                      {importLog.map((log, index) => (
                        <div
                          key={index}
                          className={`${
                            log.includes('✓') ? 'text-green-400' :
                            log.includes('✗') ? 'text-red-400' :
                            log.includes('===') ? 'text-yellow-400 font-bold' :
                            'text-gray-300'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions après importation */}
              {success && (
                <div className="mt-6 flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/admin-dashboard')}
                    className="px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-dashboard-line mr-2"></i>
                    Aller au Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/services/artisans')}
                    className="px-6 py-3 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-tools-line mr-2"></i>
                    Voir les Artisans
                  </button>
                </div>
              )}
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
}
