
import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Update document metadata using React 19 features
  useEffect(() => {
    document.title = 'FAQ - Questions Fréquentes | DjibGo - Plateforme de Services Professionnels à Djibouti';
    
    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('description', 'Trouvez des réponses à toutes vos questions sur DjibGo : réservations, paiements, compte, professionnels et sécurité. Support client disponible 24/7 à Djibouti.');
    updateMetaTag('keywords', 'FAQ DjibGo, questions fréquentes, aide réservation, support client Djibouti, assistance professionnels, paiement sécurisé');
    
    // Open Graph tags
    updateMetaTag('og:title', 'FAQ - Questions Fréquentes | DjibGo', true);
    updateMetaTag('og:description', 'Trouvez des réponses à toutes vos questions sur DjibGo : réservations, paiements, compte, professionnels et sécurité.', true);
    updateMetaTag('og:type', 'website', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', 'FAQ - Questions Fréquentes | DjibGo');
    updateMetaTag('twitter:description', 'Trouvez des réponses à toutes vos questions sur DjibGo : réservations, paiements, compte, professionnels et sécurité.');

    // Add canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${window.location.origin}/faq`);

    // Add FAQ Schema
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    });

    return () => {
      document.title = 'DjibGo';
    };
  }, []);

  const categories = [
    { id: 'all', name: 'Toutes les questions', icon: 'ri-question-line' },
    { id: 'booking', name: 'Réservations', icon: 'ri-calendar-line' },
    { id: 'payment', name: 'Paiements', icon: 'ri-credit-card-line' },
    { id: 'account', name: 'Compte', icon: 'ri-user-line' },
    { id: 'professional', name: 'Professionnels', icon: 'ri-briefcase-line' },
    { id: 'safety', name: 'Sécurité', icon: 'ri-shield-check-line' }
  ];

  const faqData = [
    {
      category: 'booking',
      question: 'Comment réserver un service professionnel sur DjibGo ?',
      answer: 'Pour réserver un service, parcourez notre catalogue de services, sélectionnez le professionnel qui vous convient, choisissez votre créneau horaire préféré et confirmez votre réservation. Vous recevrez un message de confirmation avec tous les détails de votre rendez-vous.'
    },
    {
      category: 'booking',
      question: 'Puis-je annuler ou reprogrammer ma réservation ?',
      answer: 'Oui, vous pouvez annuler ou reprogrammer votre réservation jusqu\'à 24 heures avant l\'heure prévue sans frais. Pour les annulations dans les 24 heures, des frais minimes peuvent s\'appliquer. Accédez à votre tableau de bord pour gérer vos réservations.'
    },
    {
      category: 'booking',
      question: 'Que se passe-t-il si le professionnel ne se présente pas ?',
      answer: 'Si votre professionnel n\'arrive pas dans les 15 minutes suivant l\'heure prévue, contactez-le directement ou notre équipe de support immédiatement. Nous vous aiderons à résoudre le problème et organiserons un remplacement si nécessaire. Vous serez également remboursé intégralement.'
    },
    {
      category: 'booking',
      question: 'Comment puis-je modifier les détails de ma réservation ?',
      answer: 'La plupart des détails de réservation peuvent être modifiés depuis votre tableau de bord. Pour les changements de lieu ou les demandes spéciales, veuillez contacter directement le professionnel ou notre équipe de support.'
    },
    {
      category: 'booking',
      question: 'Puis-je réserver plusieurs services en même temps ?',
      answer: 'Oui, vous pouvez réserver plusieurs services simultanément. Ajoutez simplement chaque service à votre panier et procédez au paiement groupé. Vous recevrez des confirmations séparées pour chaque réservation.'
    },
    {
      category: 'payment',
      question: 'Quels modes de paiement acceptez-vous ?',
      answer: 'Nous acceptons toutes les principales cartes de crédit, cartes de débit et paiements mobiles via notre système de paiement sécurisé Stripe. Tous les paiements sont cryptés et sécurisés.'
    },
    {
      category: 'payment',
      question: 'Quand suis-je facturé pour ma réservation ?',
      answer: 'Vous êtes facturé immédiatement lors de la confirmation de votre réservation. Cependant, si vous annulez dans les délais autorisés (24 heures avant), vous serez remboursé intégralement.'
    },
    {
      category: 'payment',
      question: 'Comment fonctionnent les remboursements ?',
      answer: 'Les remboursements sont traités dans un délai de 5 à 7 jours ouvrables et sont crédités sur votre mode de paiement original. Pour les annulations tardives, des frais peuvent être déduits selon notre politique d\'annulation.'
    },
    {
      category: 'payment',
      question: 'Mes informations de paiement sont-elles sécurisées ?',
      answer: 'Absolument ! Nous utilisons Stripe, une plateforme de paiement de niveau entreprise avec cryptage SSL. Nous ne stockons jamais vos informations de carte de crédit complètes sur nos serveurs.'
    },
    {
      category: 'payment',
      question: 'Puis-je obtenir une facture pour mes réservations ?',
      answer: 'Oui, une facture détaillée est automatiquement envoyée à votre adresse e-mail après chaque paiement. Vous pouvez également télécharger vos factures depuis votre tableau de bord dans la section "Historique des paiements".'
    },
    {
      category: 'account',
      question: 'Comment créer un compte sur DjibGo ?',
      answer: 'Cliquez sur "S\'inscrire" en haut de la page, remplissez vos informations (nom, e-mail, mot de passe) et confirmez votre adresse e-mail. Vous pouvez également vous inscrire rapidement avec Google ou Facebook.'
    },
    {
      category: 'account',
      question: 'Mes informations personnelles sont-elles sécurisées ?',
      answer: 'Absolument ! Nous utilisons des mesures de sécurité de niveau entreprise et un cryptage pour protéger vos informations personnelles. Vos données ne sont jamais partagées avec des tiers sans votre consentement explicite.'
    },
    {
      category: 'account',
      question: 'Comment modifier mon profil ou mes paramètres ?',
      answer: 'Connectez-vous à votre compte, accédez à votre tableau de bord et cliquez sur "Profil" ou "Paramètres". Vous pouvez y modifier vos informations personnelles, votre photo de profil, vos préférences de notification et plus encore.'
    },
    {
      category: 'account',
      question: 'J\'ai oublié mon mot de passe, que faire ?',
      answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion, entrez votre adresse e-mail et vous recevrez un lien pour réinitialiser votre mot de passe. Le lien est valable pendant 1 heure.'
    },
    {
      category: 'account',
      question: 'Puis-je supprimer mon compte ?',
      answer: 'Oui, vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil. Notez que cette action est irréversible et toutes vos données seront définitivement supprimées.'
    },
    {
      category: 'professional',
      question: 'Comment devenir professionnel sur DjibGo ?',
      answer: 'Cliquez sur "Devenir Professionnel" sur notre page d\'accueil, remplissez le formulaire de candidature avec vos qualifications et votre expérience, et notre équipe examinera votre candidature dans les 48 heures.'
    },
    {
      category: 'professional',
      question: 'Quels sont les critères pour devenir professionnel ?',
      answer: 'Vous devez avoir une expérience vérifiable dans votre domaine, fournir des documents d\'identification valides, avoir de bonnes références et accepter nos conditions de service. Certains services peuvent nécessiter des certifications spécifiques.'
    },
    {
      category: 'professional',
      question: 'Comment les professionnels sont-ils vérifiés ?',
      answer: 'Tous les professionnels passent par un processus de vérification rigoureux incluant la vérification d\'identité, la vérification des antécédents, la validation des qualifications et des entretiens. Nous vérifions également régulièrement les avis clients.'
    },
    {
      category: 'professional',
      question: 'Comment contacter directement un professionnel ?',
      answer: 'Vous pouvez envoyer des messages aux professionnels via notre plateforme ou utiliser l\'option de contact WhatsApp disponible sur la page de profil de chaque professionnel.'
    },
    {
      category: 'professional',
      question: 'Puis-je laisser un avis sur un professionnel ?',
      answer: 'Oui, après avoir reçu un service, vous pouvez laisser un avis et une note. Vos commentaires aident les autres utilisateurs à faire des choix éclairés et aident les professionnels à améliorer leurs services.'
    },
    {
      category: 'safety',
      question: 'Comment DjibGo assure-t-il la sécurité des utilisateurs ?',
      answer: 'Nous vérifions tous les professionnels, utilisons un cryptage de niveau entreprise, offrons des paiements sécurisés, permettons les avis vérifiés et disposons d\'une équipe de support disponible 24/7 pour résoudre tout problème de sécurité.'
    },
    {
      category: 'safety',
      question: 'Que faire si je rencontre un problème avec un professionnel ?',
      answer: 'Contactez immédiatement notre équipe de support via WhatsApp, e-mail ou téléphone. Nous prendrons des mesures immédiates pour résoudre le problème et assurer votre sécurité. Tous les incidents sont pris très au sérieux.'
    },
    {
      category: 'safety',
      question: 'Les professionnels sont-ils assurés ?',
      answer: 'Oui, tous les professionnels actifs sur DjibGo doivent avoir une assurance responsabilité civile professionnelle valide. Cela protège à la fois vous et le professionnel en cas d\'incident.'
    },
    {
      category: 'safety',
      question: 'Comment signaler un comportement inapproprié ?',
      answer: 'Utilisez le bouton "Signaler" sur le profil du professionnel ou contactez notre équipe de support immédiatement. Tous les signalements sont traités de manière confidentielle et font l\'objet d\'une enquête approfondie.'
    },
    {
      category: 'safety',
      question: 'Mes données de paiement sont-elles stockées en toute sécurité ?',
      answer: 'Nous ne stockons jamais vos informations de carte de crédit complètes. Tous les paiements sont traités via Stripe avec cryptage SSL de niveau bancaire. Seul un token sécurisé est conservé pour les paiements futurs.'
    }
  ];

  const filteredFaqs = faqData.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center text-white max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <strong>Questions Fréquemment Posées</strong>
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Trouvez rapidement des réponses à vos questions sur DjibGo
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                <i className="ri-search-line text-gray-500 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <i className={`${category.icon} mr-2`}></i>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full px-6 py-5 text-left flex justify-between items-start hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex-1 pr-4">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
                        <i className={`ri-${openFaq === index ? 'subtract' : 'add'}-line text-orange-500 text-xl`}></i>
                      </div>
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-5 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-search-line text-gray-400 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 mb-6">
                  Essayez de modifier votre recherche ou de choisir une autre catégorie
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Notre équipe de support est là pour vous aider 24/7
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-whatsapp-line text-green-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">WhatsApp</h4>
                <p className="text-gray-600 text-sm mb-3">Réponse rapide</p>
                <a href="https://wa.me/+25377123456" className="text-green-500 hover:text-green-600 font-medium">
                  +253 77 12 34 56
                </a>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-line text-orange-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Email</h4>
                <p className="text-gray-600 text-sm mb-3">Réponse sous 24h</p>
                <a href="mailto:support@djibgo.dj" className="text-orange-500 hover:text-orange-600 font-medium">
                  support@djibgo.dj
                </a>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-customer-service-line text-teal-500 text-2xl"></i>
                </div>
                <h4 className="font-semibold mb-2 text-gray-900">Support</h4>
                <p className="text-gray-600 text-sm mb-3">Centre d'aide complet</p>
                <a href="/support" className="text-teal-500 hover:text-teal-600 font-medium">
                  Visiter le support
                </a>
              </div>
            </div>
            
            <a
              href="/support"
              className="inline-block bg-orange-500 text-white px-8 py-4 rounded-lg hover:bg-orange-600 transition-colors font-medium text-lg whitespace-nowrap"
            >
              <i className="ri-customer-service-line mr-2"></i>
              Contacter le Support
            </a>
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Sujets Populaires
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a href="/how-it-works" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <i className="ri-lightbulb-line text-orange-500 text-2xl"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">
                  Comment ça marche
                </h4>
                <p className="text-gray-600">
                  Découvrez comment utiliser DjibGo étape par étape
                </p>
              </a>
              
              <a href="/services" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
                  <i className="ri-service-line text-teal-500 text-2xl"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">
                  Nos Services
                </h4>
                <p className="text-gray-600">
                  Explorez tous les services professionnels disponibles
                </p>
              </a>
              
              <a href="/about" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <i className="ri-information-line text-green-500 text-2xl"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">
                  À propos de DjibGo
                </h4>
                <p className="text-gray-600">
                  En savoir plus sur notre mission et notre équipe
                </p>
              </a>
              
              <a href="/support" className="bg-white p-6 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                  <i className="ri-headphone-line text-red-500 text-2xl"></i>
                </div>
                <h4 className="text-lg font-semibold mb-2 text-gray-900">
                  Centre de Support
                </h4>
                <p className="text-gray-600">
                  Obtenez de l'aide pour vos problèmes spécifiques
                </p>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
