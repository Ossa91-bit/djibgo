import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import Button from '../../components/base/Button';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../../components/auth/AuthModal';

export default function HowItWorksPage() {
  const steps = [
    {
      number: "01",
      title: "Recherchez un service",
      description: "Parcourez plus de 50 services disponibles ou utilisez notre barre de recherche pour trouver exactement ce dont vous avez besoin.",
      icon: "ri-search-line",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02", 
      title: "Choisissez votre professionnel",
      description: "Comparez les profils, consultez les avis clients et sélectionnez le professionnel qui correspond à vos critères.",
      icon: "ri-user-star-line",
      color: "from-green-500 to-green-600"
    },
    {
      number: "03",
      title: "Réservez en ligne",
      description: "Fixez un rendez-vous directement via la plateforme. Communiquez tous les détails de votre demande.",
      icon: "ri-calendar-check-line", 
      color: "from-purple-500 to-purple-600"
    },
    {
      number: "04",
      title: "Service réalisé",
      description: "Le professionnel vient chez vous ou vous rencontrez selon le service. Paiement sécurisé après prestation.",
      icon: "ri-shield-check-line",
      color: "from-orange-500 to-red-500"
    }
  ];

  const forClients = [
    {
      icon: "ri-time-line",
      title: "Gain de temps",
      description: "Trouvez un professionnel en moins de 2 minutes"
    },
    {
      icon: "ri-shield-star-line", 
      title: "Professionnels vérifiés",
      description: "Tous nos prestataires sont contrôlés et certifiés"
    },
    {
      icon: "ri-money-dollar-circle-line",
      title: "Prix transparents",
      description: "Connaissez le tarif avant de réserver"
    },
    {
      icon: "ri-customer-service-line",
      title: "Support 24/7",
      description: "Une équipe dédiée pour vous accompagner"
    }
  ];

  const forProfessionals = [
    {
      icon: "ri-user-add-line",
      title: "Inscription gratuite",
      description: "Essai gratuit 7 jours, puis seulement 10% de commission"
    },
    {
      icon: "ri-smartphone-line",
      title: "Gestion simplifiée",
      description: "Tableau de bord intuitif pour gérer vos missions"
    },
    {
      icon: "ri-line-chart-line",
      title: "Revenus stables",
      description: "Développez votre clientèle et augmentez vos revenus"
    },
    {
      icon: "ri-secure-payment-line",
      title: "Paiement sécurisé",
      description: "Recevez vos paiements rapidement et en toute sécurité"
    }
  ];

  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleBecomeProfessional = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Comment ça <strong className="text-orange-500">marche</strong> ?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              DjibGo simplifie la recherche de services à Djibouti. 
              Découvrez comment notre plateforme révolutionne la mise en relation entre clients et professionnels.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Réserver un service en 4 étapes
            </h2>
            <p className="text-lg text-gray-600">
              Un processus simple et rapide pour tous vos besoins
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                {/* Step Number */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <i className={`${step.icon} text-4xl text-orange-500`}></i>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Pour les <span className="text-orange-500">clients</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                DjibGo vous permet de trouver rapidement le bon professionnel pour tous vos besoins. 
                Fini les recherches interminables et les devis multiples.
              </p>

              <div className="space-y-6">
                {forClients.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${benefit.icon} text-xl text-orange-500`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button variant="primary" size="lg" onClick={() => navigate('/services')}>
                  <i className="ri-search-line mr-2"></i>
                  Trouver un service
                </Button>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://readdy.ai/api/search-image?query=happy%20African%20family%20using%20smartphone%20app%20to%20book%20home%20services%20modern%20living%20room%20clean%20background%20digital%20technology%20convenience&width=600&height=400&seq=35&orientation=landscape"
                alt="Client utilisant DjibGo"
                className="w-full rounded-2xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* For Professionals */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src="https://readdy.ai/api/search-image?query=successful%20African%20professional%20worker%20with%20tools%20looking%20at%20smartphone%20showing%20business%20growth%20income%20increase%20clean%20background%20entrepreneur%20success&width=600&height=400&seq=36&orientation=landscape"
                alt="Professionnel sur DjibGo"
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Pour les <span className="text-orange-500">professionnels</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Développez votre activité avec DjibGo. Plus de clients, plus de visibilité, 
                des revenus stables et prévisibles.
              </p>

              <div className="space-y-6">
                {forProfessionals.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${benefit.icon} text-xl text-green-500`}></i>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{benefit.title}</h3>
                      <p className="text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Button variant="primary" size="lg" onClick={handleBecomeProfessional}>
                  <i className="ri-user-add-line mr-2"></i>
                  Devenir professionnel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-lg text-gray-600">
              Tout ce que vous devez savoir sur DjibGo
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  <i className="ri-question-line text-orange-500 mr-2"></i>
                  DjibGo est-il gratuit pour les clients ?
                </h3>
                <p className="text-gray-600">
                  Oui, l'utilisation de DjibGo est entièrement gratuite pour les clients. 
                  Vous ne payez que le service réservé au tarif affiché.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  <i className="ri-shield-check-line text-orange-500 mr-2"></i>
                  Comment vérifiez-vous les professionnels ?
                </h3>
                <p className="text-gray-600">
                  Tous nos professionnels passent par un processus de vérification incluant 
                  contrôle d'identité, références et évaluation des compétences.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  <i className="ri-money-dollar-circle-line text-orange-500 mr-2"></i>
                  Quels sont les modes de paiement ?
                </h3>
                <p className="text-gray-600">
                  Paiement en espèces au professionnel ou via mobile money. 
                  Nous développons actuellement le paiement par carte bancaire.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  <i className="ri-customer-service-line text-orange-500 mr-2"></i>
                  Comment contacter le support ?
                </h3>
                <p className="text-gray-600">
                  Notre équipe support est disponible 7j/7 via WhatsApp, téléphone 
                  ou directement depuis l'application DjibGo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui font confiance à DjibGo 
              pour leurs besoins de services quotidiens.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/services')}
                className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                <i className="ri-search-line mr-2"></i>
                Trouver un professionnel
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleBecomeProfessional}
                className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg"
              >
                <i className="ri-user-add-line mr-2"></i>
                Devenir professionnel
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          defaultTab="signup"
        />
      )}

      <Footer />
    </div>
  );
}
