import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';

      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= 150) {
          current = section.getAttribute('id') || '';
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const sections = [
    { id: 'introduction', title: 'Introduction' },
    { id: 'data-controller', title: 'Responsable du Traitement' },
    { id: 'data-collected', title: 'Données Collectées' },
    { id: 'purpose', title: 'Finalités du Traitement' },
    { id: 'legal-basis', title: 'Base Légale' },
    { id: 'data-retention', title: 'Durée de Conservation' },
    { id: 'data-sharing', title: 'Partage des Données' },
    { id: 'user-rights', title: 'Vos Droits' },
    { id: 'cookies', title: 'Cookies et Technologies' },
    { id: 'security', title: 'Sécurité des Données' },
    { id: 'minors', title: 'Protection des Mineurs' },
    { id: 'international', title: 'Transferts Internationaux' },
    { id: 'updates', title: 'Modifications' },
    { id: 'contact', title: 'Contact' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shield-check-line text-4xl"></i>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-teal-100 max-w-3xl mx-auto">
              Votre vie privée est importante pour nous. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.
            </p>
            <p className="text-sm text-teal-200 mt-4">
              Dernière mise à jour : 15 janvier 2025
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <i className="ri-list-unordered text-teal-600 mr-2"></i>
                Sommaire
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      activeSection === section.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-12">
              
              {/* Introduction */}
              <section id="introduction">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-information-line text-teal-600"></i>
                  </div>
                  Introduction
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 leading-relaxed">
                    DjibGo s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme de mise en relation entre clients et professionnels de services.
                  </p>
                  <p className="text-gray-600 leading-relaxed mt-4">
                    En utilisant DjibGo, vous acceptez les pratiques décrites dans cette politique. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.
                  </p>
                </div>
              </section>

              {/* Data Controller */}
              <section id="data-controller">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-building-line text-teal-600"></i>
                  </div>
                  Responsable du Traitement des Données
                </h2>
                <div className="bg-teal-50 border-l-4 border-teal-600 p-6 rounded-r-lg">
                  <p className="text-gray-700 font-medium mb-2">DjibGo</p>
                  <p className="text-gray-600 text-sm">
                    <strong>Adresse :</strong> [Votre adresse complète à Djibouti]<br />
                    <strong>Email :</strong> privacy@djibgo.com<br />
                    <strong>Téléphone :</strong> +253 XX XX XX XX<br />
                    <strong>Responsable DPO :</strong> [Nom du délégué à la protection des données]
                  </p>
                </div>
              </section>

              {/* Data Collected */}
              <section id="data-collected">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-database-2-line text-teal-600"></i>
                  </div>
                  Données Collectées
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Données d'Identification</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Nom complet, adresse email, numéro de téléphone</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Photo de profil (optionnelle)</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Informations de compte Google (si connexion via Google OAuth)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Données Professionnelles (pour les prestataires)</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Type de service proposé, tarifs, années d'expérience</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Certifications et qualifications professionnelles</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Disponibilités et zones d'intervention</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Informations sur le véhicule (pour les chauffeurs)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Données de Réservation</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Adresse de prestation, date et heure de rendez-vous</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Notes et instructions spécifiques</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Historique des réservations et statuts</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Données de Paiement</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Informations de paiement traitées par Stripe (nous ne stockons pas vos données bancaires)</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Historique des transactions et factures</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Données Techniques</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Adresse IP, type de navigateur, système d'exploitation</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Pages visitées, durée de visite, actions effectuées</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Données de géolocalisation (avec votre consentement)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Avis et Évaluations</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Notes, commentaires et retours d'expérience</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-teal-600 mr-2 mt-1"></i>
                        <span>Réponses aux avis (pour les professionnels)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Purpose */}
              <section id="purpose">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-target-line text-teal-600"></i>
                  </div>
                  Finalités du Traitement
                </h2>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-service-line text-teal-600 mr-2"></i>
                      Fourniture des Services
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Créer et gérer votre compte, faciliter la mise en relation entre clients et professionnels, traiter les réservations et paiements.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-notification-3-line text-teal-600 mr-2"></i>
                      Communication
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Envoyer des notifications de réservation, confirmations par SMS et email, alertes importantes sur votre compte.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-line-chart-line text-teal-600 mr-2"></i>
                      Amélioration de la Plateforme
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Analyser l'utilisation de la plateforme, améliorer nos services, développer de nouvelles fonctionnalités.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-shield-check-line text-teal-600 mr-2"></i>
                      Sécurité et Conformité
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Prévenir la fraude, assurer la sécurité de la plateforme, respecter nos obligations légales.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-megaphone-line text-teal-600 mr-2"></i>
                      Marketing (avec consentement)
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Envoyer des offres promotionnelles, newsletters et recommandations personnalisées (vous pouvez vous désabonner à tout moment).
                    </p>
                  </div>
                </div>
              </section>

              {/* Legal Basis */}
              <section id="legal-basis">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-scales-3-line text-teal-600"></i>
                  </div>
                  Base Légale du Traitement
                </h2>
                <div className="space-y-3 text-gray-600">
                  <p className="flex items-start">
                    <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                    <span><strong>Exécution du contrat :</strong> Traitement nécessaire pour fournir nos services (création de compte, réservations, paiements)</span>
                  </p>
                  <p className="flex items-start">
                    <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                    <span><strong>Consentement :</strong> Pour les communications marketing, cookies non essentiels, géolocalisation</span>
                  </p>
                  <p className="flex items-start">
                    <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                    <span><strong>Intérêt légitime :</strong> Amélioration de la plateforme, prévention de la fraude, sécurité</span>
                  </p>
                  <p className="flex items-start">
                    <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                    <span><strong>Obligation légale :</strong> Conservation des données fiscales, lutte contre le blanchiment d'argent</span>
                  </p>
                </div>
              </section>

              {/* Data Retention */}
              <section id="data-retention">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-time-line text-teal-600"></i>
                  </div>
                  Durée de Conservation des Données
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-teal-50">
                        <th className="border border-teal-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Type de Données</th>
                        <th className="border border-teal-200 px-4 py-3 text-left text-sm font-semibold text-gray-900">Durée de Conservation</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Données de compte actif</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Tant que le compte est actif</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Données de compte supprimé</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">30 jours après suppression</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Historique des réservations</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">3 ans après la dernière réservation</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Données de paiement</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">10 ans (obligation fiscale)</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Avis et évaluations</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Tant que le profil professionnel est actif</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">Logs de connexion</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">12 mois</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Data Sharing */}
              <section id="data-sharing">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-share-line text-teal-600"></i>
                  </div>
                  Partage des Données
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Nous ne vendons jamais vos données personnelles. Nous partageons vos informations uniquement dans les cas suivants :
                  </p>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-user-shared-line text-amber-600 mr-2"></i>
                      Entre Utilisateurs de la Plateforme
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Lorsque vous réservez un service, vos coordonnées (nom, téléphone, adresse de prestation) sont partagées avec le professionnel concerné, et vice-versa.
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-cloud-line text-blue-600 mr-2"></i>
                      Prestataires de Services Techniques
                    </h4>
                    <ul className="text-gray-600 text-sm space-y-1 mt-2">
                      <li>• <strong>Supabase :</strong> Hébergement de la base de données et authentification</li>
                      <li>• <strong>Stripe :</strong> Paiements sécurisés avec chiffrement SSL/TLS</li>
                      <li>• <strong>Google OAuth :</strong> Connexion via compte Google</li>
                      <li>• <strong>Readdy.ai :</strong> Assistant IA pour le support client</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-government-line text-red-600 mr-2"></i>
                      Obligations Légales
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Nous pouvons divulguer vos données si requis par la loi, une décision de justice, ou pour protéger nos droits légaux.
                    </p>
                  </div>
                </div>
              </section>

              {/* User Rights */}
              <section id="user-rights">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-user-settings-line text-teal-600"></i>
                  </div>
                  Vos Droits sur vos Données
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-teal-50 to-white p-5 rounded-lg border border-teal-100">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-eye-line text-teal-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit d'Accès</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-lg border border-blue-100">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-edit-line text-blue-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit de Rectification</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez corriger ou mettre à jour vos informations personnelles à tout moment depuis votre profil.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-white p-5 rounded-lg border border-red-100">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-delete-bin-line text-red-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit à l'Effacement</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez demander la suppression de vos données personnelles (sous réserve de nos obligations légales).
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-lg border border-purple-100">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-download-line text-purple-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit à la Portabilité</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez recevoir vos données dans un format structuré et lisible par machine.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-white p-5 rounded-lg border border-orange-100">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-stop-circle-line text-orange-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit d'Opposition</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez vous opposer au traitement de vos données à des fins de marketing direct.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-lg border border-indigo-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                      <i className="ri-pause-circle-line text-indigo-600 text-xl"></i>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Droit à la Limitation</h4>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez demander la limitation du traitement de vos données dans certaines circonstances.
                    </p>
                  </div>
                </div>

                <div className="mt-6 bg-teal-50 border border-teal-200 p-5 rounded-lg">
                  <p className="text-gray-700 font-medium mb-2">
                    <i className="ri-mail-line text-teal-600 mr-2"></i>
                    Pour exercer vos droits :
                  </p>
                  <p className="text-gray-600 text-sm">
                    Envoyez un email à <a href="mailto:privacy@djibgo.com" className="text-teal-600 hover:text-teal-700 font-medium">privacy@djibgo.com</a> avec une copie de votre pièce d'identité. Nous répondrons dans un délai de 30 jours.
                  </p>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-cookie-line text-teal-600"></i>
                  </div>
                  Cookies et Technologies Similaires
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Nous utilisons des cookies et technologies similaires pour améliorer votre expérience sur DjibGo.
                  </p>

                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <i className="ri-checkbox-circle-fill text-green-600 mr-2"></i>
                        Cookies Essentiels (Obligatoires)
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Nécessaires au fonctionnement de la plateforme : authentification, sécurité, préférences de session.
                      </p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <i className="ri-line-chart-fill text-blue-600 mr-2"></i>
                        Cookies Analytiques (Optionnels)
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Nous aident à comprendre comment vous utilisez la plateforme pour l'améliorer (Google Analytics, statistiques d'utilisation).
                      </p>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <i className="ri-heart-fill text-purple-600 mr-2"></i>
                        Cookies de Personnalisation (Optionnels)
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Mémorisent vos préférences : langue, localisation, services favoris.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-100 p-5 rounded-lg">
                    <p className="text-gray-700 font-medium mb-2">
                      <i className="ri-settings-3-line text-gray-600 mr-2"></i>
                      Gestion des Cookies
                    </p>
                    <p className="text-gray-600 text-sm">
                      Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur. Notez que désactiver certains cookies peut affecter le fonctionnement de la plateforme.
                    </p>
                  </div>
                </div>
              </section>

              {/* Security */}
              <section id="security">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-lock-line text-teal-600"></i>
                  </div>
                  Sécurité des Données
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données personnelles :
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-shield-check-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Chiffrement SSL/TLS</h4>
                        <p className="text-gray-600 text-sm">Toutes les communications sont chiffrées</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-key-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Authentification Sécurisée</h4>
                        <p className="text-gray-600 text-sm">Mots de passe hashés, OAuth 2.0</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-database-2-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Sauvegardes Régulières</h4>
                        <p className="text-gray-600 text-sm">Backups automatiques quotidiens</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-user-lock-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Accès Restreint</h4>
                        <p className="text-gray-600 text-sm">Seul le personnel autorisé accède aux données</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-bug-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Tests de Sécurité</h4>
                        <p className="text-gray-600 text-sm">Audits réguliers et tests de pénétration</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-alarm-warning-line text-teal-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Surveillance 24/7</h4>
                        <p className="text-gray-600 text-sm">Détection des activités suspectes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <i className="ri-error-warning-line text-red-600 mr-2"></i>
                      En cas de Violation de Données
                    </h4>
                    <p className="text-gray-600 text-sm">
                      En cas de violation de données susceptible de présenter un risque pour vos droits, nous vous en informerons dans les 72 heures et notifierons les autorités compétentes conformément au RGPD.
                    </p>
                  </div>
                </div>
              </section>

              {/* Minors */}
              <section id="minors">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-parent-line text-teal-600"></i>
                  </div>
                  Protection des Mineurs
                </h2>
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
                  <p className="text-gray-700 font-medium mb-2">
                    <i className="ri-information-line text-orange-600 mr-2"></i>
                    Âge Minimum Requis
                  </p>
                  <p className="text-gray-600">
                    DjibGo est réservé aux personnes âgées de 18 ans et plus. Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si vous pensez qu'un mineur a fourni des informations personnelles, veuillez nous contacter immédiatement à <a href="mailto:privacy@djibgo.com" className="text-teal-600 hover:text-teal-700 font-medium">privacy@djibgo.com</a>.
                  </p>
                </div>
              </section>

              {/* International Transfers */}
              <section id="international">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-global-line text-teal-600"></i>
                  </div>
                  Transferts Internationaux de Données
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Vos données sont principalement stockées et traitées à Djibouti. Cependant, certains de nos prestataires de services peuvent être situés en dehors de Djibouti :
                  </p>

                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-blue-600 mr-2 mt-1"></i>
                        <span><strong>Supabase :</strong> Données hébergées dans des centres de données conformes RGPD (Union Européenne)</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-blue-600 mr-2 mt-1"></i>
                        <span><strong>Stripe :</strong> Traitement des paiements avec garanties de sécurité PCI-DSS</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-checkbox-circle-fill text-blue-600 mr-2 mt-1"></i>
                        <span><strong>Google OAuth :</strong> Envoi de SMS avec chiffrement de bout en bout</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-gray-600 text-sm">
                    Tous nos prestataires respectent des normes de protection des données équivalentes au RGPD et ont signé des clauses contractuelles types approuvées par la Commission Européenne.
                  </p>
                </div>
              </section>

              {/* Updates */}
              <section id="updates">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-refresh-line text-teal-600"></i>
                  </div>
                  Modifications de la Politique de Confidentialité
                </h2>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Nous pouvons mettre à jour cette politique de confidentialité de temps en temps pour refléter les changements dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires.
                  </p>

                  <div className="bg-teal-50 border border-teal-200 p-5 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <i className="ri-notification-3-line text-teal-600 mr-2"></i>
                      Comment Vous Serez Informé
                    </h4>
                    <ul className="space-y-2 text-gray-600 text-sm">
                      <li className="flex items-start">
                        <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                        <span>Notification par email pour les modifications importantes</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                        <span>Bannière d'information sur la plateforme</span>
                      </li>
                      <li className="flex items-start">
                        <i className="ri-arrow-right-s-line text-teal-600 mr-2 mt-1"></i>
                        <span>Mise à jour de la date "Dernière mise à jour" en haut de cette page</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-gray-600 text-sm">
                    Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques en matière de protection des données.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <i className="ri-customer-service-2-line text-teal-600"></i>
                  </div>
                  Nous Contacter
                </h2>
                <div className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 p-6 rounded-xl">
                  <p className="text-gray-600 mb-4">
                    Pour toute question concernant cette politique de confidentialité ou vos données personnelles, vous pouvez nous contacter :
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-mail-line text-teal-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <a href="mailto:privacy@djibgo.com" className="text-teal-600 hover:text-teal-700 font-medium">
                          privacy@djibgo.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-phone-line text-teal-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <a href="tel:+253XXXXXXXX" className="text-teal-600 hover:text-teal-700 font-medium">
                          +253 XX XX XX XX
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-map-pin-line text-teal-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="text-gray-700 font-medium">
                          [Votre adresse complète]<br />
                          Djibouti
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className="ri-time-line text-teal-600"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Horaires</p>
                        <p className="text-gray-700 font-medium">
                          Lun - Ven : 8h - 18h<br />
                          Sam : 9h - 13h
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-teal-200">
                    <p className="text-gray-600 text-sm">
                      <i className="ri-shield-check-line text-teal-600 mr-2"></i>
                      <strong>Délégué à la Protection des Données (DPO) :</strong> [Nom du DPO] - <a href="mailto:dpo@djibgo.com" className="text-teal-600 hover:text-teal-700">dpo@djibgo.com</a>
                    </p>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                  <p className="text-gray-700 font-medium mb-2">
                    <i className="ri-government-line text-blue-600 mr-2"></i>
                    Autorité de Contrôle
                  </p>
                  <p className="text-gray-600 text-sm">
                    Si vous estimez que vos droits ne sont pas respectés, vous avez le droit de déposer une plainte auprès de l'autorité de protection des données compétente à Djibouti.
                  </p>
                </div>
              </section>

            </div>

            {/* Related Links */}
            <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <i className="ri-links-line text-teal-600 mr-2"></i>
                Documents Connexes
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  to="/cgu"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center">
                    <i className="ri-file-text-line text-gray-400 group-hover:text-teal-600 mr-3"></i>
                    <span className="text-gray-700 group-hover:text-teal-700 font-medium">
                      Conditions Générales
                    </span>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-600"></i>
                </Link>

                <Link
                  to="/about"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center">
                    <i className="ri-information-line text-gray-400 group-hover:text-teal-600 mr-3"></i>
                    <span className="text-gray-700 group-hover:text-teal-700 font-medium">
                      À Propos
                    </span>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-600"></i>
                </Link>

                <Link
                  to="/support"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-teal-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center">
                    <i className="ri-customer-service-2-line text-gray-400 group-hover:text-teal-600 mr-3"></i>
                    <span className="text-gray-700 group-hover:text-teal-700 font-medium">
                      Support
                    </span>
                  </div>
                  <i className="ri-arrow-right-line text-gray-400 group-hover:text-teal-600"></i>
                </Link>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl shadow-lg p-8 text-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-3xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-2">Des Questions ?</h3>
              <p className="text-teal-100 mb-6 max-w-2xl mx-auto">
                Notre équipe est là pour répondre à toutes vos questions concernant la protection de vos données personnelles.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center bg-white text-teal-600 px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                <i className="ri-customer-service-2-line mr-2"></i>
                Contacter le Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}