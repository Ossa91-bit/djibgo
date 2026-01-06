import { useEffect } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';

export default function CGUPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: '1. Objet',
      content: `Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation de la plateforme DjibGo, ainsi que les droits et obligations des utilisateurs dans ce cadre.

La plateforme DjibGo est un service de mise en relation entre des clients recherchant des services professionnels (plomberie, électricité, ménage, jardinage, chauffeur, etc.) et des professionnels proposant ces services à Djibouti.

En accédant et en utilisant la plateforme DjibGo, vous acceptez sans réserve les présentes CGU.`
    },
    {
      title: '2. Mentions Légales',
      content: `DjibGo est une plateforme exploitée par DjibGo Service
Siège social : Djibouti, Centre Ville
Email : djibgoservice@gmail.com
Téléphone : +253 77 55 09 08
Numéro d'immatriculation : [Numéro RCCM]

Directeur de publication : Daoud Houssein Mohamed
Hébergement : Supabase Inc., 970 Toa Payoh North, #07-04, Singapore 318992`
    },
    {
      title: '3. Accès à la Plateforme',
      content: `La plateforme DjibGo est accessible gratuitement à tout utilisateur disposant d'un accès à Internet. Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, logiciels, connexion Internet, etc.) sont à sa charge.

DjibGo met en œuvre tous les moyens raisonnables à sa disposition pour assurer un accès de qualité à la plateforme, mais n'est tenue à aucune obligation d'y parvenir.

DjibGo ne peut être tenue responsable de tout dysfonctionnement du réseau ou des serveurs ou de tout autre événement échappant au contrôle raisonnable, qui empêcherait ou dégraderait l'accès à la plateforme.

DjibGo se réserve le droit d'interrompre, de suspendre momentanément ou de modifier sans préavis l'accès à tout ou partie de la plateforme, afin d'en assurer la maintenance, ou pour toute autre raison, sans que l'interruption n'ouvre droit à aucune obligation ni indemnisation.`
    },
    {
      title: '4. Inscription et Compte Utilisateur',
      content: `Pour utiliser certains services de la plateforme, l'utilisateur doit créer un compte en fournissant des informations exactes et à jour. Deux types de comptes sont disponibles :

**Compte Client :** Permet de rechercher et réserver des services professionnels.

**Compte Professionnel :** Permet de proposer des services et de recevoir des réservations.

L'utilisateur s'engage à :
• Fournir des informations exactes, complètes et à jour
• Maintenir la confidentialité de ses identifiants de connexion
• Informer immédiatement DjibGo de toute utilisation non autorisée de son compte
• Ne pas créer de faux comptes ou usurper l'identité d'autrui

DjibGo se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, sans préavis ni indemnisation.`
    },
    {
      title: '5. Services Proposés',
      content: `DjibGo est une plateforme de mise en relation. Elle ne fournit pas directement les services professionnels, mais facilite la connexion entre clients et professionnels.

**Pour les Clients :**
• Recherche de professionnels qualifiés
• Consultation des profils, tarifs et avis
• Réservation de services en ligne
• Système de paiement sécurisé
• Suivi des réservations
• Système d'évaluation et d'avis

**Pour les Professionnels :**
• Création d'un profil professionnel
• Gestion des disponibilités
• Réception et gestion des réservations
• Notifications SMS et email
• Tableau de bord de gestion
• Système de paiement sécurisé

DjibGo prélève une commission de 10% sur chaque transaction effectuée via la plateforme.`
    },
    {
      title: '6. Réservations et Paiements',
      content: `**Processus de Réservation :**
1. Le client sélectionne un service et un professionnel
2. Le client remplit les détails de la réservation (date, heure, adresse)
3. Le client confirme et effectue le paiement
4. Le professionnel reçoit une notification et peut accepter ou refuser
5. Une fois acceptée, la réservation est confirmée

**Paiements :**
• Les paiements sont traités de manière sécurisée via Stripe
• Le paiement est effectué au moment de la réservation
• DjibGo prélève une commission de 10% sur le montant total
• Le professionnel reçoit 90% du montant après déduction de la commission
• Les paiements aux professionnels sont effectués immédiatement après la prestation terminée et confirmée par le client

**Annulations :**
• Les clients peuvent annuler jusqu'à 24 heures avant la prestation pour un remboursement complet
• Les annulations entre 24h et 12h avant la prestation donnent droit à un remboursement de 50%
• Les annulations moins de 12h avant la prestation ne sont pas remboursables
• Les professionnels peuvent annuler sans pénalité en cas de force majeure`
    },
    {
      title: '7. Obligations des Utilisateurs',
      content: `**Obligations Générales :**
• Respecter les lois et règlements en vigueur à Djibouti
• Ne pas utiliser la plateforme à des fins illégales ou frauduleuses
• Ne pas porter atteinte aux droits de tiers
• Ne pas diffuser de contenu offensant, diffamatoire ou inapproprié
• Maintenir un comportement respectueux envers les autres utilisateurs

**Obligations des Clients :**
• Fournir des informations exactes lors de la réservation
• Être présent à l'adresse indiquée à l'heure convenue
• Payer les services réservés
• Laisser un avis honnête après la prestation

**Obligations des Professionnels :**
• Posséder les qualifications et autorisations nécessaires
• Fournir des services de qualité professionnelle
• Respecter les horaires convenus
• Maintenir un profil à jour avec des informations exactes
• Répondre rapidement aux demandes de réservation
• Respecter les normes de sécurité et d'hygiène`
    },
    {
      title: '8. Responsabilités',
      content: `**Responsabilité de DjibGo :**
DjibGo agit uniquement en tant qu'intermédiaire de mise en relation. DjibGo ne peut être tenue responsable :
• De la qualité des services fournis par les professionnels
• Des dommages causés lors de l'exécution des prestations
• Des litiges entre clients et professionnels
• Des informations fournies par les utilisateurs
• Des pertes de données dues à des problèmes techniques

DjibGo s'engage néanmoins à :
• Vérifier l'identité des professionnels lors de l'inscription
• Modérer les avis et signalements
• Faciliter la résolution des litiges
• Suspendre les comptes en cas de comportement inapproprié

**Responsabilité des Professionnels :**
Les professionnels sont seuls responsables :
• De la qualité et de la conformité de leurs prestations
• Des dommages causés lors de l'exécution des services
• Du respect des normes professionnelles et réglementaires
• De leurs obligations fiscales et sociales
• De leur assurance professionnelle

**Responsabilité des Clients :**
Les clients sont responsables :
• De l'exactitude des informations fournies
• Des dommages causés aux professionnels ou à leurs équipements
• Du paiement des services réservés`
    },
    {
      title: '9. Propriété Intellectuelle',
      content: `Tous les éléments de la plateforme DjibGo (textes, images, logos, icônes, sons, logiciels, etc.) sont protégés par les droits de propriété intellectuelle et appartiennent à DjibGo ou à ses partenaires.

Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de la plateforme, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de DjibGo.

Les utilisateurs conservent la propriété des contenus qu'ils publient sur la plateforme (photos de profil, descriptions, avis, etc.) mais accordent à DjibGo une licence non exclusive pour utiliser, reproduire et diffuser ces contenus dans le cadre de l'exploitation de la plateforme.`
    },
    {
      title: '10. Données Personnelles',
      content: `DjibGo collecte et traite les données personnelles des utilisateurs conformément à sa Politique de Confidentialité et aux lois applicables en matière de protection des données.

**Données Collectées :**
• Informations d'identification (nom, email, téléphone)
• Informations de profil (photo, description, qualifications)
• Données de réservation et de paiement
• Historique d'utilisation de la plateforme
• Avis et évaluations

**Utilisation des Données :**
• Fourniture et amélioration des services
• Communication avec les utilisateurs
• Traitement des paiements
• Prévention de la fraude
• Respect des obligations légales

**Droits des Utilisateurs :**
Conformément à la réglementation, les utilisateurs disposent d'un droit d'accès, de rectification, de suppression et d'opposition au traitement de leurs données personnelles. Pour exercer ces droits, contactez : privacy@djibgo.com`
    },
    {
      title: '11. Avis et Évaluations',
      content: `Les clients peuvent laisser des avis et évaluations sur les professionnels après une prestation.

**Règles des Avis :**
• Les avis doivent être honnêtes et basés sur une expérience réelle
• Les avis diffamatoires, offensants ou inappropriés sont interdits
• Les faux avis ou avis frauduleux sont strictement interdits
• DjibGo se réserve le droit de modérer et supprimer les avis inappropriés

**Réponse aux Avis :**
Les professionnels peuvent répondre aux avis de manière professionnelle et respectueuse.

Les avis contribuent à la réputation des professionnels et à la confiance des utilisateurs dans la plateforme.`
    },
    {
      title: '12. Résiliation',
      content: `**Résiliation par l'Utilisateur :**
Les utilisateurs peuvent supprimer leur compte à tout moment depuis les paramètres de leur profil. La suppression du compte entraîne la suppression définitive des données personnelles, sauf obligation légale de conservation.

**Résiliation par DjibGo :**
DjibGo se réserve le droit de suspendre ou supprimer tout compte, sans préavis ni indemnisation, en cas de :
• Violation des présentes CGU
• Comportement frauduleux ou illégal
• Abus de la plateforme
• Non-paiement des services
• Plaintes répétées d'autres utilisateurs

En cas de suspension ou suppression, l'utilisateur ne pourra prétendre à aucune indemnisation.`
    },
    {
      title: '13. Modification des CGU',
      content: `DjibGo se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications par email ou notification sur la plateforme.

Les modifications entrent en vigueur dès leur publication sur la plateforme. L'utilisation continue de la plateforme après la publication des modifications vaut acceptation des nouvelles CGU.

Si un utilisateur n'accepte pas les modifications, il doit cesser d'utiliser la plateforme et supprimer son compte.`
    },
    {
      title: '14. Droit Applicable et Juridiction',
      content: `Les présentes CGU sont régies par le droit djiboutien.

En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, les parties s'efforceront de trouver une solution amiable.

À défaut d'accord amiable, tout litige sera soumis à la compétence exclusive des tribunaux de Djibouti.`
    },
    {
      title: '15. Contact',
      content: `Pour toute question concernant les présentes CGU ou l'utilisation de la plateforme DjibGo, vous pouvez nous contacter :

**Email :** djibgoservice@gmail.com
**Téléphone :** +253 77 55 09 08
**Adresse :** Djibouti, Centre Ville

Notre équipe de support est disponible du lundi au samedi de 8h à 18h pour répondre à vos questions.`
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <i className="ri-file-text-line text-4xl mr-4"></i>
            <h1 className="text-4xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          <p className="text-lg text-teal-100">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          <p className="mt-4 text-teal-50">
            Veuillez lire attentivement ces conditions avant d'utiliser la plateforme DjibGo.
          </p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i className="ri-list-check text-teal-600 mr-2"></i>
            Table des Matières
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section, index) => (
              <a
                key={index}
                href={`#section-${index}`}
                className="text-teal-600 hover:text-teal-700 hover:underline text-sm py-1 cursor-pointer"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div
              key={index}
              id={`section-${index}`}
              className="bg-white rounded-lg shadow-sm p-8 scroll-mt-20"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                  {index + 1}
                </span>
                {section.title.replace(/^\d+\.\s*/, '')}
              </h2>
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Acceptance Section */}
        <div className="bg-teal-50 border-l-4 border-teal-600 rounded-lg p-6 mt-8">
          <div className="flex items-start">
            <i className="ri-checkbox-circle-line text-teal-600 text-2xl mr-3 mt-1"></i>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Acceptation des Conditions
              </h3>
              <p className="text-gray-700 mb-4">
                En utilisant la plateforme DjibGo, vous reconnaissez avoir lu, compris et accepté 
                l'intégralité des présentes Conditions Générales d'Utilisation.
              </p>
              <p className="text-gray-700">
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la plateforme.
              </p>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-white rounded-lg shadow-sm p-8 mt-8 text-center">
          <i className="ri-customer-service-2-line text-5xl text-teal-600 mb-4"></i>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Des Questions ?
          </h3>
          <p className="text-gray-600 mb-6">
            Notre équipe est là pour vous aider à comprendre nos conditions d'utilisation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/support"
              className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap cursor-pointer inline-flex items-center justify-center"
            >
              <i className="ri-mail-line mr-2"></i>
              Contacter le Support
            </a>
            <a
              href="/faq"
              className="bg-white text-teal-600 border-2 border-teal-600 px-6 py-3 rounded-lg hover:bg-teal-50 transition-colors font-medium whitespace-nowrap cursor-pointer inline-flex items-center justify-center"
            >
              <i className="ri-question-line mr-2"></i>
              Consulter la FAQ
            </a>
          </div>
        </div>

        {/* Related Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-12">
          <a
            href="/privacy"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <i className="ri-shield-check-line text-3xl text-teal-600 mb-3 group-hover:scale-110 transition-transform"></i>
            <h4 className="font-semibold text-gray-900 mb-2">Politique de Confidentialité</h4>
            <p className="text-sm text-gray-600">
              Comment nous protégeons vos données personnelles
            </p>
          </a>
          <a
            href="/about"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <i className="ri-information-line text-3xl text-teal-600 mb-3 group-hover:scale-110 transition-transform"></i>
            <h4 className="font-semibold text-gray-900 mb-2">À Propos de DjibGo</h4>
            <p className="text-sm text-gray-600">
              Découvrez notre mission et nos valeurs
            </p>
          </a>
          <a
            href="/faq"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <i className="ri-questionnaire-line text-3xl text-teal-600 mb-3 group-hover:scale-110 transition-transform"></i>
            <h4 className="font-semibold text-gray-900 mb-2">Questions Fréquentes</h4>
            <p className="text-sm text-gray-600">
              Trouvez rapidement des réponses à vos questions
            </p>
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
