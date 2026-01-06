import { useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import AnimatedSection from '../../components/feature/AnimatedSection';

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
}

export default function CarrieresPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const jobPositions: JobPosition[] = [
    {
      id: '1',
      title: 'Développeur Full Stack',
      department: 'Technologie',
      location: 'Djibouti',
      type: 'CDI',
      description: 'Rejoignez notre équipe technique pour développer et améliorer la plateforme DjibGo.',
      requirements: [
        'Expérience de 3+ ans en développement web',
        'Maîtrise de React, Node.js et TypeScript',
        'Connaissance de Supabase ou PostgreSQL',
        'Excellentes compétences en communication'
      ],
      responsibilities: [
        'Développer de nouvelles fonctionnalités',
        'Maintenir et optimiser le code existant',
        'Collaborer avec l\'équipe produit',
        'Participer aux revues de code'
      ]
    },
    {
      id: '2',
      title: 'Responsable Marketing Digital',
      department: 'Marketing',
      location: 'Djibouti',
      type: 'CDI',
      description: 'Pilotez notre stratégie marketing digital et développez notre présence en ligne.',
      requirements: [
        'Expérience de 5+ ans en marketing digital',
        'Maîtrise des réseaux sociaux et SEO',
        'Compétences en analyse de données',
        'Créativité et esprit d\'initiative'
      ],
      responsibilities: [
        'Élaborer la stratégie marketing',
        'Gérer les campagnes publicitaires',
        'Analyser les performances',
        'Développer la notoriété de la marque'
      ]
    },
    {
      id: '3',
      title: 'Chargé de Relation Client',
      department: 'Support',
      location: 'Djibouti',
      type: 'CDI',
      description: 'Assurez un service client exceptionnel et aidez nos utilisateurs au quotidien.',
      requirements: [
        'Excellentes compétences en communication',
        'Expérience en service client',
        'Maîtrise du français et de l\'arabe',
        'Patience et empathie'
      ],
      responsibilities: [
        'Répondre aux demandes clients',
        'Résoudre les problèmes techniques',
        'Collecter les retours utilisateurs',
        'Améliorer l\'expérience client'
      ]
    },
    {
      id: '4',
      title: 'Designer UI/UX',
      department: 'Design',
      location: 'Djibouti',
      type: 'CDD',
      description: 'Créez des expériences utilisateur exceptionnelles pour notre plateforme.',
      requirements: [
        'Portfolio démontrant votre expertise',
        'Maîtrise de Figma et Adobe Creative Suite',
        'Connaissance des principes UX',
        'Sens du détail et créativité'
      ],
      responsibilities: [
        'Concevoir les interfaces utilisateur',
        'Réaliser des tests utilisateurs',
        'Créer des prototypes interactifs',
        'Maintenir le design system'
      ]
    },
    {
      id: '5',
      title: 'Responsable Partenariats',
      department: 'Business Development',
      location: 'Djibouti',
      type: 'CDI',
      description: 'Développez notre réseau de professionnels et établissez des partenariats stratégiques.',
      requirements: [
        'Expérience en développement commercial',
        'Excellent relationnel',
        'Connaissance du marché djiboutien',
        'Compétences en négociation'
      ],
      responsibilities: [
        'Recruter de nouveaux professionnels',
        'Négocier des partenariats',
        'Développer le réseau',
        'Atteindre les objectifs de croissance'
      ]
    },
    {
      id: '6',
      title: 'Analyste de Données',
      department: 'Technologie',
      location: 'Djibouti',
      type: 'Stage',
      description: 'Analysez nos données pour optimiser nos services et améliorer l\'expérience utilisateur.',
      requirements: [
        'Formation en statistiques ou data science',
        'Maîtrise de SQL et Python',
        'Compétences en visualisation de données',
        'Esprit analytique'
      ],
      responsibilities: [
        'Analyser les données utilisateurs',
        'Créer des tableaux de bord',
        'Identifier des opportunités d\'amélioration',
        'Présenter les insights à l\'équipe'
      ]
    }
  ];

  const departments = ['all', 'Technologie', 'Marketing', 'Support', 'Design', 'Business Development'];
  const types = ['all', 'CDI', 'CDD', 'Stage'];

  const filteredJobs = jobPositions.filter(job => {
    const matchDepartment = selectedDepartment === 'all' || job.department === selectedDepartment;
    const matchType = selectedType === 'all' || job.type === selectedType;
    return matchDepartment && matchType;
  });

  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://readdy.ai/api/search-image?query=modern%20collaborative%20office%20workspace%20in%20Djibouti%20with%20diverse%20team%20members%20working%20together%20on%20innovative%20technology%20projects%2C%20bright%20natural%20lighting%2C%20professional%20atmosphere%2C%20contemporary%20interior%20design%2C%20teamwork%20and%20innovation%2C%20clean%20minimalist%20aesthetic&width=1920&height=600&seq=careers-hero-bg&orientation=landscape"
            alt="Carrières DjibGo"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Rejoignez l'Aventure DjibGo
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              Construisons ensemble l'avenir des services professionnels à Djibouti
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#postes"
                className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                Voir les Postes
              </a>
              <a
                href="#culture"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-colors whitespace-nowrap cursor-pointer border border-white/30"
              >
                Notre Culture
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Pourquoi DjibGo */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Pourquoi Rejoindre DjibGo ?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Découvrez ce qui fait de DjibGo un employeur unique
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: 'ri-rocket-line',
                title: 'Innovation Continue',
                description: 'Travaillez sur des projets innovants qui transforment le marché des services à Djibouti'
              },
              {
                icon: 'ri-team-line',
                title: 'Équipe Passionnée',
                description: 'Rejoignez une équipe dynamique et multiculturelle qui partage votre passion'
              },
              {
                icon: 'ri-line-chart-line',
                title: 'Croissance Rapide',
                description: 'Évoluez rapidement dans une startup en pleine expansion avec des opportunités uniques'
              },
              {
                icon: 'ri-heart-line',
                title: 'Impact Social',
                description: 'Contribuez à améliorer la vie des Djiboutiens en facilitant l\'accès aux services'
              },
              {
                icon: 'ri-book-open-line',
                title: 'Formation Continue',
                description: 'Développez vos compétences avec des formations régulières et du mentorat'
              },
              {
                icon: 'ri-scales-line',
                title: 'Équilibre Vie Pro/Perso',
                description: 'Profitez d\'horaires flexibles et d\'un environnement de travail bienveillant'
              }
            ].map((benefit, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                    <i className={`${benefit.icon} text-2xl text-orange-500`}></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Notre Culture */}
      <section id="culture" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Notre Culture d'Entreprise
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Des valeurs fortes qui guident notre quotidien
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                image: 'https://readdy.ai/api/search-image?query=diverse%20team%20collaborating%20in%20modern%20office%20space%2C%20brainstorming%20session%20with%20sticky%20notes%20and%20whiteboard%2C%20creative%20problem%20solving%2C%20energetic%20atmosphere%2C%20natural%20lighting%2C%20professional%20workspace%20in%20Djibouti&width=600&height=400&seq=culture-collab&orientation=landscape',
                title: 'Collaboration & Transparence',
                description: 'Nous croyons en la communication ouverte et au travail d\'équipe. Chaque voix compte et chaque idée est valorisée.'
              },
              {
                image: 'https://readdy.ai/api/search-image?query=professional%20development%20training%20session%2C%20mentor%20coaching%20team%20member%2C%20learning%20and%20growth%20environment%2C%20modern%20office%20setting%2C%20supportive%20atmosphere%2C%20knowledge%20sharing%20in%20Djibouti%20workplace&width=600&height=400&seq=culture-growth&orientation=landscape',
                title: 'Apprentissage & Développement',
                description: 'Nous investissons dans votre croissance professionnelle avec des formations, du mentorat et des opportunités d\'évolution.'
              },
              {
                image: 'https://readdy.ai/api/search-image?query=team%20celebrating%20success%20together%2C%20diverse%20colleagues%20high-fiving%2C%20positive%20work%20environment%2C%20achievement%20recognition%2C%20joyful%20atmosphere%2C%20modern%20office%20in%20Djibouti%2C%20team%20spirit%20and%20camaraderie&width=600&height=400&seq=culture-success&orientation=landscape',
                title: 'Excellence & Reconnaissance',
                description: 'Nous visons l\'excellence dans tout ce que nous faisons et célébrons les réussites individuelles et collectives.'
              },
              {
                image: 'https://readdy.ai/api/search-image?query=flexible%20modern%20workspace%20with%20comfortable%20lounge%20areas%2C%20work-life%20balance%20environment%2C%20relaxation%20zones%2C%20contemporary%20office%20design%2C%20wellness-focused%20workplace%2C%20natural%20elements%20and%20plants%20in%20Djibouti%20office&width=600&height=400&seq=culture-balance&orientation=landscape',
                title: 'Bien-être & Flexibilité',
                description: 'Votre bien-être est notre priorité. Profitez d\'horaires flexibles et d\'un environnement de travail agréable.'
              }
            ].map((value, index) => (
              <AnimatedSection key={index} animation="fade-up" delay={index * 100}>
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="w-full h-64">
                    <img
                      src={value.image}
                      alt={value.title}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Postes Disponibles */}
      <section id="postes" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Postes Disponibles
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Trouvez le poste qui correspond à vos compétences et ambitions
              </p>
            </div>
          </AnimatedSection>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-12 justify-center">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Département:</span>
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedDepartment === dept
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {dept === 'all' ? 'Tous' : dept}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center mr-2">Type:</span>
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedType === type
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type === 'all' ? 'Tous' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des postes */}
          <div className="space-y-6">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job, index) => (
                <AnimatedSection key={job.id} animation="fade-up" delay={index * 50}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <i className="ri-building-line"></i>
                              {job.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-map-pin-line"></i>
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-briefcase-line"></i>
                              {job.type}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="bg-orange-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {expandedJob === job.id ? 'Masquer' : 'Voir Détails'}
                        </button>
                      </div>

                      <p className="text-gray-600 mb-4">
                        {job.description}
                      </p>

                      {expandedJob === job.id && (
                        <div className="border-t pt-6 mt-6 space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <i className="ri-checkbox-circle-line text-orange-500"></i>
                              Responsabilités
                            </h4>
                            <ul className="space-y-2">
                              {job.responsibilities.map((resp, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-600">
                                  <i className="ri-arrow-right-s-line text-orange-500 mt-1"></i>
                                  <span>{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <i className="ri-star-line text-orange-500"></i>
                              Profil Recherché
                            </h4>
                            <ul className="space-y-2">
                              {job.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-600">
                                  <i className="ri-arrow-right-s-line text-orange-500 mt-1"></i>
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap gap-4 pt-4">
                            <a
                              href="#postuler"
                              className="bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Postuler Maintenant
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href + '#' + job.id);
                                alert('Lien copié !');
                              }}
                              className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Partager
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              ))
            ) : (
              <div className="text-center py-12">
                <i className="ri-inbox-line text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600 text-lg">
                  Aucun poste ne correspond à vos critères
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Candidature Spontanée */}
      <section id="postuler" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 md:p-12 text-center text-white">
              <i className="ri-mail-send-line text-5xl mb-6"></i>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Vous ne trouvez pas le poste idéal ?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Envoyez-nous votre candidature spontanée ! Nous sommes toujours à la recherche de talents exceptionnels.
              </p>
              <a
                href="mailto:carrieres@djibgo.com?subject=Candidature Spontanée"
                className="inline-block bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Envoyer ma Candidature
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
