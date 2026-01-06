export interface SEOData {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogImage?: string;
  schema?: any;
}

export const seoData: { [key: string]: SEOData } = {
  home: {
    title: 'DjibGo Djibouti - Services Professionnels Plomberie Électricité Ménage',
    description: 'DjibGo connecte clients et professionnels qualifiés à Djibouti. Plomberie, électricité, ménage, jardinage - Plus de 150 professionnels vérifiés. Réservation en ligne sécurisée avec paiement facile. Service rapide et fiable à Djibouti.',
    keywords: 'services Djibouti, professionnels Djibouti, plombier Djibouti, électricien Djibouti, ménage Djibouti, jardinage Djibouti, réparation Djibouti, maintenance Djibouti, réservation services Djibouti',
    canonical: '/',
    ogImage: 'https://readdy.ai/api/search-image?query=modern%20Djibouti%20cityscape%20with%20professional%20services&width=1200&height=630&seq=og_home&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'DjibGo',
      description: 'Plateforme de services professionnels à Djibouti connectant clients et professionnels qualifiés pour plomberie, électricité, ménage, jardinage et plus',
      telephone: '+253-77-12-34-56',
      email: 'contact@djibgo.dj',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DJ',
        addressLocality: 'Djibouti',
        addressRegion: 'Djibouti'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '11.8251',
        longitude: '42.5903'
      },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00'
      },
      priceRange: '25-50 DJF',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '1200',
        bestRating: '5',
        worstRating: '1'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      }
    }
  },
  services: {
    title: 'Services Professionnels Djibouti - Plombier Électricien Ménage | DjibGo',
    description: 'Découvrez plus de 150 professionnels vérifiés à Djibouti. Plombiers, électriciens, agents d\'entretien, jardiniers et plus. Réservation instantanée, tarifs transparents, avis clients vérifiés. Trouvez le meilleur professionnel à Djibouti.',
    keywords: 'services Djibouti, trouver professionnel Djibouti, réserver service Djibouti, plombier électricien ménage jardinage Djibouti, professionnels vérifiés Djibouti',
    canonical: '/services',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20services%20workers%20in%20Djibouti&width=1200&height=630&seq=og_services&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Services professionnels DjibGo à Djibouti',
      description: 'Plateforme de réservation de services professionnels à Djibouti : plomberie, électricité, ménage, jardinage, menuiserie et plus',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti',
        '@id': 'https://www.wikidata.org/wiki/Q3604'
      },
      serviceType: 'Professional Services Marketplace',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'DJF',
        lowPrice: '25',
        highPrice: '50',
        offerCount: '150'
      }
    }
  },
  about: {
    title: 'À propos de DjibGo - Première plateforme de services professionnels à Djibouti',
    description: 'DjibGo est la première plateforme digitale de services professionnels à Djibouti. Notre mission : connecter clients et professionnels qualifiés pour faire prospérer l\'économie locale. Plus de 150 professionnels vérifiés, 1200+ clients satisfaits.',
    keywords: 'DjibGo, à propos DjibGo, plateforme services Djibouti, startup Djibouti, innovation Djibouti, économie locale Djibouti',
    canonical: '/about',
    ogImage: 'https://readdy.ai/api/search-image?query=DjibGo%20team%20professional%20services%20platform%20Djibouti&width=1200&height=630&seq=og_about&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DjibGo',
      description: 'Première plateforme de services professionnels à Djibouti connectant clients et professionnels qualifiés',
      foundingDate: '2024',
      founders: [
        {
          '@type': 'Person',
          name: 'Ahmed Hassan',
          jobTitle: 'Fondateur & CEO'
        }
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DJ',
        addressLocality: 'Djibouti',
        addressRegion: 'Djibouti'
      },
      numberOfEmployees: {
        '@type': 'QuantitativeValue',
        value: '150'
      }
    }
  },
  apropos: {
    title: 'À propos de DjibGo - Première plateforme de services professionnels à Djibouti',
    description: 'DjibGo est la première plateforme digitale de services professionnels à Djibouti. Notre mission : connecter clients et professionnels qualifiés pour faire prospérer l\'économie locale. Plus de 150 professionnels vérifiés, 1200+ clients satisfaits.',
    keywords: 'DjibGo, à propos DjibGo, plateforme services Djibouti, startup Djibouti, innovation Djibouti, économie locale Djibouti',
    canonical: '/a-propos',
    ogImage: 'https://readdy.ai/api/search-image?query=DjibGo%20team%20professional%20services%20platform%20Djibouti&width=1200&height=630&seq=og_about&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DjibGo',
      description: 'Première plateforme de services professionnels à Djibouti connectant clients et professionnels qualifiés',
      foundingDate: '2024',
      founders: [
        {
          '@type': 'Person',
          name: 'Ahmed Hassan',
          jobTitle: 'Fondateur & CEO'
        }
      ],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DJ',
        addressLocality: 'Djibouti',
        addressRegion: 'Djibouti'
      },
      numberOfEmployees: {
        '@type': 'QuantitativeValue',
        value: '150'
      }
    }
  },
  howItWorks: {
    title: 'Comment ça marche - Guide d\'utilisation DjibGo | Services Professionnels Djibouti',
    description: 'Découvrez comment utiliser DjibGo en 4 étapes simples : recherchez un service à Djibouti, choisissez votre professionnel, réservez en ligne, service réalisé. Guide complet pour clients et professionnels à Djibouti.',
    keywords: 'comment utiliser DjibGo, guide DjibGo, réserver service Djibouti, devenir professionnel DjibGo, tutoriel DjibGo Djibouti',
    canonical: '/how-it-works',
    ogImage: 'https://readdy.ai/api/search-image?query=step%20by%20step%20guide%20professional%20services%20booking%20Djibouti&width=1200&height=630&seq=og_howitworks&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Comment réserver un service professionnel sur DjibGo à Djibouti',
      description: 'Guide étape par étape pour réserver un service professionnel sur DjibGo à Djibouti',
      totalTime: 'PT10M',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Recherchez un service à Djibouti',
          text: 'Parcourez plus de 50 services disponibles à Djibouti ou utilisez notre barre de recherche pour trouver le professionnel dont vous avez besoin'
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Choisissez votre professionnel à Djibouti',
          text: 'Comparez les profils des professionnels à Djibouti, consultez les avis clients vérifiés et sélectionnez le professionnel qui correspond à vos besoins'
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Réservez en ligne',
          text: 'Fixez un rendez-vous directement via la plateforme DjibGo avec paiement sécurisé'
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'Service réalisé à Djibouti',
          text: 'Le professionnel vient chez vous à Djibouti et réalise le service avec professionnalisme'
        }
      ]
    }
  },
  support: {
    title: 'Support & Aide DjibGo - Centre d\'assistance Djibouti | FAQ et Contact',
    description: 'Centre d\'aide DjibGo Djibouti : FAQ, guides d\'utilisation, support client 24/7. Trouvez des réponses à vos questions sur les réservations, paiements, compte et plus. Contact WhatsApp, email, téléphone disponible à Djibouti.',
    keywords: 'support DjibGo, aide DjibGo, FAQ DjibGo, contact DjibGo Djibouti, assistance client, problème réservation, annuler réservation Djibouti',
    canonical: '/support',
    ogImage: 'https://readdy.ai/api/search-image?query=customer%20support%20help%20center%20professional%20services%20Djibouti&width=1200&height=630&seq=og_support&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Comment réserver un service professionnel à Djibouti sur DjibGo ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pour réserver un service à Djibouti, parcourez nos services, sélectionnez un professionnel, choisissez votre créneau horaire préféré et confirmez votre réservation. Vous recevrez un message de confirmation avec tous les détails.'
          }
        },
        {
          '@type': 'Question',
          name: 'Quels modes de paiement acceptez-vous à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nous acceptons toutes les principales cartes de crédit, cartes de débit et paiements mobiles via notre système de paiement sécurisé Stripe. Les paiements locaux sont également disponibles à Djibouti.'
          }
        },
        {
          '@type': 'Question',
          name: 'Puis-je annuler ou reprogrammer ma réservation à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, vous pouvez annuler ou reprogrammer votre réservation jusqu\'à 24 heures avant l\'heure prévue sans frais. Pour les annulations dans les 24 heures, des frais minimes peuvent s\'appliquer.'
          }
        },
        {
          '@type': 'Question',
          name: 'Les professionnels sur DjibGo sont-ils vérifiés à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Oui, tous nos professionnels à Djibouti sont vérifiés. Nous vérifions leurs qualifications, leur expérience et leurs documents avant de les accepter sur la plateforme DjibGo.'
          }
        },
        {
          '@type': 'Question',
          name: 'Comment contacter le support client DjibGo à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vous pouvez nous contacter via WhatsApp au +253-77-12-34-56, par email à contact@djibgo.dj, ou via notre formulaire de contact. Notre support est disponible 24/7 à Djibouti.'
          }
        }
      ]
    }
  },
  contact: {
    title: 'Contact DjibGo - Contactez-nous à Djibouti | Support Client 24/7',
    description: 'Contactez DjibGo à Djibouti : support client disponible 24/7 par WhatsApp, email, téléphone. Posez vos questions sur nos services professionnels, réservations, paiements. Réponse rapide garantie à Djibouti.',
    keywords: 'contact DjibGo, contacter DjibGo Djibouti, support client, WhatsApp DjibGo, email DjibGo, téléphone DjibGo Djibouti',
    canonical: '/contact',
    ogImage: 'https://readdy.ai/api/search-image?query=contact%20customer%20service%20support%20Djibouti&width=1200&height=630&seq=og_contact&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact DjibGo',
      description: 'Contactez notre équipe de support client à Djibouti'
    }
  },
  faq: {
    title: 'FAQ DjibGo - Questions Fréquentes Services Professionnels Djibouti',
    description: 'Trouvez des réponses aux questions fréquentes sur DjibGo à Djibouti : comment réserver, modes de paiement, annulation, professionnels vérifiés, tarifs, disponibilité. Tout ce que vous devez savoir sur nos services à Djibouti.',
    keywords: 'FAQ DjibGo, questions fréquentes DjibGo, aide DjibGo Djibouti, réponses DjibGo, guide utilisation Djibouti',
    canonical: '/faq',
    ogImage: 'https://readdy.ai/api/search-image?query=frequently%20asked%20questions%20FAQ%20help%20Djibouti&width=1200&height=630&seq=og_faq&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Combien coûtent les services professionnels sur DjibGo à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les tarifs varient selon le type de service et le professionnel à Djibouti. En moyenne, les services coûtent entre 25 et 50 DJF par heure. Vous pouvez voir les tarifs exacts sur chaque profil de professionnel.'
          }
        },
        {
          '@type': 'Question',
          name: 'Quelle est la zone de service de DjibGo ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DjibGo couvre actuellement toute la ville de Djibouti et ses environs. Nous travaillons à étendre nos services à d\'autres régions du pays.'
          }
        },
        {
          '@type': 'Question',
          name: 'Comment devenir professionnel sur DjibGo à Djibouti ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pour devenir professionnel sur DjibGo à Djibouti, créez un compte, complétez votre profil avec vos qualifications et expérience, soumettez vos documents de vérification. Notre équipe examinera votre candidature sous 48 heures.'
          }
        }
      ]
    }
  },
  chauffeurs: {
    title: 'Chauffeurs Professionnels Djibouti - Service de Transport | DjibGo',
    description: 'Réservez un chauffeur professionnel à Djibouti avec DjibGo. Chauffeurs vérifiés, expérimentés et fiables pour tous vos déplacements. Transport sécurisé, tarifs transparents, réservation en ligne facile à Djibouti.',
    keywords: 'chauffeur Djibouti, transport Djibouti, chauffeur privé Djibouti, service chauffeur, réserver chauffeur Djibouti, transport professionnel',
    canonical: '/services/chauffeurs',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20driver%20chauffeur%20service%20Djibouti&width=1200&height=630&seq=og_chauffeurs&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Service de Chauffeurs Professionnels à Djibouti',
      description: 'Service de chauffeurs professionnels vérifiés à Djibouti pour tous vos besoins de transport',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Driver Service'
    }
  },
  serviceschauffeurs: {
    title: 'Chauffeurs Professionnels Djibouti - Service de Transport | DjibGo',
    description: 'Réservez un chauffeur professionnel à Djibouti avec DjibGo. Chauffeurs vérifiés, expérimentés et fiables pour tous vos déplacements. Transport sécurisé, tarifs transparents, réservation en ligne facile à Djibouti.',
    keywords: 'chauffeur Djibouti, transport Djibouti, chauffeur privé Djibouti, service chauffeur, réserver chauffeur Djibouti, transport professionnel',
    canonical: '/services/chauffeurs',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20driver%20chauffeur%20service%20Djibouti&width=1200&height=630&seq=og_chauffeurs&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Service de Chauffeurs Professionnels à Djibouti',
      description: 'Service de chauffeurs professionnels vérifiés à Djibouti pour tous vos besoins de transport',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Driver Service'
    }
  },
  artisans: {
    title: 'Artisans Professionnels Djibouti - Plombier Électricien Menuisier | DjibGo',
    description: 'Trouvez les meilleurs artisans à Djibouti : plombiers, électriciens, menuisiers, peintres, maçons. Artisans qualifiés et vérifiés, tarifs transparents, réservation en ligne. Service rapide et professionnel à Djibouti.',
    keywords: 'artisans Djibouti, plombier Djibouti, électricien Djibouti, menuisier Djibouti, peintre Djibouti, maçon Djibouti, réparation Djibouti',
    canonical: '/services/artisans',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20artisans%20craftsmen%20workers%20Djibouti&width=1200&height=630&seq=og_artisans&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Services d\'Artisans Professionnels à Djibouti',
      description: 'Artisans qualifiés à Djibouti : plomberie, électricité, menuiserie, peinture, maçonnerie et plus',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Artisan Services'
    }
  },
  servicesartisans: {
    title: 'Artisans Professionnels Djibouti - Plombier Électricien Menuisier | DjibGo',
    description: 'Trouvez les meilleurs artisans à Djibouti : plombiers, électriciens, menuisiers, peintres, maçons. Artisans qualifiés et vérifiés, tarifs transparents, réservation en ligne. Service rapide et professionnel à Djibouti.',
    keywords: 'artisans Djibouti, plombier Djibouti, électricien Djibouti, menuisier Djibouti, peintre Djibouti, maçon Djibouti, réparation Djibouti',
    canonical: '/services/artisans',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20artisans%20craftsmen%20workers%20Djibouti&width=1200&height=630&seq=og_artisans&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Services d\'Artisans Professionnels à Djibouti',
      description: 'Artisans qualifiés à Djibouti : plomberie, électricité, menuiserie, peinture, maçonnerie et plus',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Artisan Services'
    }
  },
  techniciens: {
    title: 'Techniciens Professionnels Djibouti - Climatisation Informatique | DjibGo',
    description: 'Réservez un technicien professionnel à Djibouti : climatisation, informatique, électroménager, télécommunications. Techniciens qualifiés et vérifiés, intervention rapide, tarifs compétitifs à Djibouti.',
    keywords: 'technicien Djibouti, climatisation Djibouti, réparation informatique Djibouti, technicien électroménager, dépannage Djibouti',
    canonical: '/services/techniciens',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20technicians%20repair%20service%20Djibouti&width=1200&height=630&seq=og_techniciens&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Services de Techniciens Professionnels à Djibouti',
      description: 'Techniciens qualifiés à Djibouti pour climatisation, informatique, électroménager et plus',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Technician Services'
    }
  },
  servicestechniciens: {
    title: 'Techniciens Professionnels Djibouti - Climatisation Informatique | DjibGo',
    description: 'Réservez un technicien professionnel à Djibouti : climatisation, informatique, électroménager, télécommunications. Techniciens qualifiés et vérifiés, intervention rapide, tarifs compétitifs à Djibouti.',
    keywords: 'technicien Djibouti, climatisation Djibouti, réparation informatique Djibouti, technicien électroménager, dépannage Djibouti',
    canonical: '/services/techniciens',
    ogImage: 'https://readdy.ai/api/search-image?query=professional%20technicians%20repair%20service%20Djibouti&width=1200&height=630&seq=og_techniciens&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Services de Techniciens Professionnels à Djibouti',
      description: 'Techniciens qualifiés à Djibouti pour climatisation, informatique, électroménager et plus',
      provider: {
        '@type': 'Organization',
        name: 'DjibGo'
      },
      areaServed: {
        '@type': 'City',
        name: 'Djibouti'
      },
      serviceType: 'Professional Technician Services'
    }
  },
  privacy: {
    title: 'Politique de Confidentialité DjibGo - Protection des Données Djibouti',
    description: 'Politique de confidentialité DjibGo : découvrez comment nous collectons, utilisons et protégeons vos données personnelles à Djibouti. Conformité RGPD, sécurité des données, droits des utilisateurs.',
    keywords: 'politique confidentialité DjibGo, protection données Djibouti, RGPD, vie privée, sécurité données',
    canonical: '/privacy',
    ogImage: 'https://readdy.ai/api/search-image?query=privacy%20policy%20data%20protection%20security&width=1200&height=630&seq=og_privacy&orientation=landscape'
  },
  cgu: {
    title: 'Conditions Générales d\'Utilisation DjibGo - CGU Services Djibouti',
    description: 'Conditions générales d\'utilisation de la plateforme DjibGo à Djibouti. Droits et obligations des utilisateurs, professionnels et clients. Règles d\'utilisation, paiements, annulations, litiges.',
    keywords: 'CGU DjibGo, conditions utilisation, termes service Djibouti, règles plateforme, contrat utilisateur',
    canonical: '/cgu',
    ogImage: 'https://readdy.ai/api/search-image?query=terms%20of%20service%20legal%20document%20contract&width=1200&height=630&seq=og_cgu&orientation=landscape'
  },
  carrieres: {
    title: 'Carrières DjibGo - Rejoignez Notre Équipe à Djibouti | Offres d\'Emploi',
    description: 'Rejoignez l\'équipe DjibGo à Djibouti ! Découvrez nos offres d\'emploi et opportunités de carrière. Développeurs, marketing, support client, commercial. Travaillez dans une startup innovante qui transforme l\'économie locale.',
    keywords: 'carrières DjibGo, emploi DjibGo Djibouti, recrutement, offres emploi, travailler DjibGo, startup Djibouti',
    canonical: '/carrieres',
    ogImage: 'https://readdy.ai/api/search-image?query=careers%20job%20opportunities%20team%20work%20Djibouti&width=1200&height=630&seq=og_carrieres&orientation=landscape',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Opportunités de Carrière chez DjibGo',
      description: 'Rejoignez notre équipe dynamique et contribuez à transformer l\'économie des services à Djibouti',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'DjibGo',
        sameAs: 'https://djibgo.com'
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Djibouti',
          addressCountry: 'DJ'
        }
      },
      employmentType: 'FULL_TIME'
    }
  }
};

export function getSEOData(path: string): SEOData {
  // Normalize path
  const normalizedPath = path === '/' ? 'home' : path.replace(/^\//, '').replace(/\//g, '').replace(/-/g, '');
  return seoData[normalizedPath] || seoData.home;
}