import { useEffect, useState } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import Button from '../../components/base/Button';
import { Link } from 'react-router-dom';
import TestimonialsSection from '../../components/feature/TestimonialsSection';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/base/LoadingSpinner';

interface TeamMember {
  id: string;
  full_name: string;
  position: string;
  description: string;
  avatar_url: string;
  display_order: number;
}

export default function AboutPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    document.title = "À propos - DjibGo | Première plateforme de services à Djibouti";
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoadingTeam(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const stats = [
    { number: "500+", label: "Professionnels vérifiés" },
    { number: "2000+", label: "Clients satisfaits" },
    { number: "15", label: "Catégories de services" },
    { number: "98%", label: "Taux de satisfaction" }
  ];

  const values = [
    {
      icon: "ri-shield-check-line",
      title: "Confiance",
      description: "Tous nos professionnels sont vérifiés et évalués par la communauté pour garantir un service de qualité."
    },
    {
      icon: "ri-lightbulb-line",
      title: "Innovation",
      description: "Nous révolutionnons l'accès aux services à Djibouti grâce à la technologie et l'expérience utilisateur."
    },
    {
      icon: "ri-team-line",
      title: "Communauté",
      description: "Nous créons des liens durables entre professionnels et clients pour faire prospérer l'économie locale."
    },
    {
      icon: "ri-rocket-line",
      title: "Croissance",
      description: "Nous accompagnons les professionnels djiboutiens dans le développement de leur activité."
    }
  ];

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20Djibouti%20city%20skyline%20with%20traditional%20architecture%2C%20bustling%20marketplace%2C%20people%20working%20together%2C%20warm%20golden%20hour%20lighting%2C%20vibrant%20community%20atmosphere%2C%20East%20African%20culture%2C%20contemporary%20urban%20development&width=1920&height=1080&seq=about-hero-bg&orientation=landscape')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/40"></div>
        
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Notre <strong className="text-orange-400">Mission</strong>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
            Connecter les professionnels djiboutiens avec leurs clients grâce à une plateforme moderne, 
            simple et sécurisée qui fait prospérer l'économie locale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" className="bg-orange-500 hover:bg-orange-600">
              <Link to="/services" className="flex items-center">
                <i className="ri-search-line mr-2"></i>
                Découvrir nos services
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link to="/contact" className="flex items-center">
                <i className="ri-mail-line mr-2"></i>
                Nous contacter
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-orange-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection 
        title="Ce que disent nos clients"
        subtitle="La satisfaction de nos clients est notre plus grande réussite"
        limit={6}
      />

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
              L'Histoire de <span className="text-orange-500">DjibGo</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Le Début</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  En 2024, nous avons identifié un problème majeur à Djibouti : la difficulté pour les 
                  particuliers de trouver rapidement des professionnels fiables, et pour les artisans 
                  d'accéder à une clientèle stable.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  C'est ainsi qu'est née DjibGo, la première plateforme digitale de services à Djibouti, 
                  conçue par des Djiboutiens pour les Djiboutiens.
                </p>
              </div>
              <div className="w-full h-80 rounded-lg overflow-hidden">
                <img 
                  src="https://readdy.ai/api/search-image?query=Djibouti%20entrepreneurs%20working%20on%20laptop%20in%20modern%20coworking%20space%2C%20African%20team%20collaboration%2C%20startup%20atmosphere%2C%20natural%20lighting%2C%20contemporary%20office%20design%2C%20technology%20innovation&width=500&height=320&seq=story-beginning&orientation=landscape"
                  alt="Équipe DjibGo au travail"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 w-full h-80 rounded-lg overflow-hidden">
                <img 
                  src="https://readdy.ai/api/search-image?query=Djibouti%20local%20craftsman%20working%20with%20modern%20tools%2C%20traditional%20meets%20technology%2C%20African%20artisan%20in%20workshop%2C%20skilled%20professional%2C%20warm%20lighting%2C%20authentic%20cultural%20setting&width=500&height=320&seq=story-vision&orientation=landscape"
                  alt="Artisan djiboutien"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Notre Vision</h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Nous croyons que chaque professionnel djiboutien mérite d'avoir accès à des opportunités 
                  de travail régulières et que chaque client mérite un service de qualité.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  DjibGo digitalise cette rencontre en créant un écosystème où la confiance, 
                  la transparence et l'efficacité sont au cœur de chaque interaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Nos <span className="text-orange-500">Valeurs</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-lg text-center hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className={`${value.icon} text-2xl text-orange-500`}></i>
                </div>
                <h3 className="text-xl font-bold mb-4 text-gray-900">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Notre <span className="text-orange-500">Équipe</span>
          </h2>
          
          {loadingTeam ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : teamMembers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="w-full h-64 overflow-hidden">
                    <img 
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{member.full_name}</h3>
                    <p className="text-orange-500 font-medium mb-4">{member.position}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Aucun membre de l'équipe à afficher pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-500">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Rejoignez l'Aventure DjibGo
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-3xl mx-auto">
            Que vous soyez un professionnel cherchant à développer votre clientèle ou un particulier 
            à la recherche de services de qualité, DjibGo est fait pour vous.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-orange-500">
              <Link to="/services" className="flex items-center">
                <i className="ri-user-line mr-2"></i>
                Je cherche un service
              </Link>
            </Button>
            <Button variant="secondary" size="lg" className="bg-white text-orange-500 hover:bg-gray-100">
              <Link to="/contact" className="flex items-center">
                <i className="ri-briefcase-line mr-2"></i>
                Je suis professionnel
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
