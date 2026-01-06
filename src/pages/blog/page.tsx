import { useState, useEffect } from 'react';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import AnimatedSection from '../../components/feature/AnimatedSection';
import LazyImage from '../../components/base/LazyImage';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  image: string;
  date: string;
  readTime: string;
  tags: string[];
}

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const categories = [
    'Tous',
    'Conseils Pratiques',
    'Actualités',
    'Guides',
    'Témoignages',
    'Technologie'
  ];

  const blogPosts: BlogPost[] = [
    {
      id: '1',
      title: 'Comment choisir le bon professionnel pour vos travaux à domicile',
      excerpt: 'Découvrez nos conseils pour sélectionner le meilleur artisan selon vos besoins et votre budget.',
      content: 'Choisir le bon professionnel pour vos travaux est crucial...',
      category: 'Conseils Pratiques',
      author: {
        name: 'Sarah Ahmed',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20woman%20smiling%20portrait%20business%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography&width=100&height=100&seq=blog-author-1&orientation=squarish',
        role: 'Experte en Services'
      },
      image: 'https://readdy.ai/api/search-image?query=professional%20handyman%20working%20on%20home%20renovation%20project%20with%20tools%20modern%20bright%20interior%20clean%20workspace%20quality%20craftsmanship%20detailed%20work%20scene&width=800&height=500&seq=blog-post-1&orientation=landscape',
      date: '15 Janvier 2025',
      readTime: '5 min',
      tags: ['Artisans', 'Conseils', 'Travaux']
    },
    {
      id: '2',
      title: 'Les avantages de la réservation en ligne pour vos services',
      excerpt: 'Gagnez du temps et simplifiez vos démarches avec la réservation digitale de professionnels.',
      content: 'La digitalisation des services transforme notre quotidien...',
      category: 'Technologie',
      author: {
        name: 'Mohamed Hassan',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20man%20smiling%20portrait%20business%20casual%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography&width=100&height=100&seq=blog-author-2&orientation=squarish',
        role: 'Responsable Innovation'
      },
      image: 'https://readdy.ai/api/search-image?query=person%20using%20smartphone%20app%20for%20booking%20services%20modern%20interface%20digital%20technology%20clean%20minimal%20design%20bright%20lighting%20professional%20photography&width=800&height=500&seq=blog-post-2&orientation=landscape',
      date: '12 Janvier 2025',
      readTime: '4 min',
      tags: ['Digital', 'Innovation', 'Réservation']
    },
    {
      id: '3',
      title: 'Entretien de climatisation: quand et pourquoi le faire',
      excerpt: 'Un guide complet sur l\'importance de l\'entretien régulier de votre système de climatisation.',
      content: 'L\'entretien régulier de votre climatisation est essentiel...',
      category: 'Guides',
      author: {
        name: 'Fatima Ali',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20woman%20expert%20portrait%20business%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography%20confident%20smile&width=100&height=100&seq=blog-author-3&orientation=squarish',
        role: 'Technicienne Certifiée'
      },
      image: 'https://readdy.ai/api/search-image?query=air%20conditioning%20technician%20servicing%20ac%20unit%20professional%20maintenance%20work%20clean%20modern%20interior%20quality%20service%20detailed%20technical%20work&width=800&height=500&seq=blog-post-3&orientation=landscape',
      date: '10 Janvier 2025',
      readTime: '6 min',
      tags: ['Climatisation', 'Entretien', 'Guide']
    },
    {
      id: '4',
      title: 'DjibGo lance de nouveaux services de plomberie express',
      excerpt: 'Intervention rapide en moins de 2 heures pour vos urgences de plomberie à Djibouti.',
      content: 'Nous sommes ravis d\'annoncer le lancement de notre service express...',
      category: 'Actualités',
      author: {
        name: 'Ahmed Omar',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20man%20business%20portrait%20formal%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography&width=100&height=100&seq=blog-author-4&orientation=squarish',
        role: 'Directeur des Opérations'
      },
      image: 'https://readdy.ai/api/search-image?query=professional%20plumber%20fixing%20pipes%20modern%20bathroom%20quality%20tools%20emergency%20service%20clean%20workspace%20detailed%20plumbing%20work&width=800&height=500&seq=blog-post-4&orientation=landscape',
      date: '8 Janvier 2025',
      readTime: '3 min',
      tags: ['Nouveauté', 'Plomberie', 'Service Express']
    },
    {
      id: '5',
      title: 'Témoignage: Comment DjibGo a transformé mon quotidien',
      excerpt: 'L\'histoire de Amina, cliente fidèle qui partage son expérience avec nos services.',
      content: 'Je m\'appelle Amina et je vis à Djibouti depuis 5 ans...',
      category: 'Témoignages',
      author: {
        name: 'Amina Ibrahim',
        avatar: 'https://readdy.ai/api/search-image?query=happy%20african%20woman%20smiling%20portrait%20casual%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography%20warm%20expression&width=100&height=100&seq=blog-author-5&orientation=squarish',
        role: 'Cliente DjibGo'
      },
      image: 'https://readdy.ai/api/search-image?query=happy%20family%20at%20home%20with%20professional%20service%20provider%20modern%20bright%20interior%20satisfied%20customers%20quality%20service%20positive%20experience&width=800&height=500&seq=blog-post-5&orientation=landscape',
      date: '5 Janvier 2025',
      readTime: '4 min',
      tags: ['Témoignage', 'Expérience Client', 'Satisfaction']
    },
    {
      id: '6',
      title: 'Les 10 erreurs à éviter lors de travaux de rénovation',
      excerpt: 'Nos experts partagent les pièges courants et comment les éviter pour réussir vos projets.',
      content: 'La rénovation d\'un logement peut être excitante mais aussi stressante...',
      category: 'Conseils Pratiques',
      author: {
        name: 'Youssef Abdallah',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20man%20expert%20portrait%20business%20casual%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography&width=100&height=100&seq=blog-author-6&orientation=squarish',
        role: 'Chef de Projet Rénovation'
      },
      image: 'https://readdy.ai/api/search-image?query=home%20renovation%20project%20in%20progress%20modern%20interior%20construction%20work%20quality%20materials%20professional%20workspace%20detailed%20renovation%20scene&width=800&height=500&seq=blog-post-6&orientation=landscape',
      date: '2 Janvier 2025',
      readTime: '7 min',
      tags: ['Rénovation', 'Conseils', 'Erreurs']
    },
    {
      id: '7',
      title: 'Sécurité électrique: les vérifications essentielles',
      excerpt: 'Protégez votre famille avec ces contrôles de sécurité électrique à effectuer régulièrement.',
      content: 'La sécurité électrique de votre domicile ne doit jamais être négligée...',
      category: 'Guides',
      author: {
        name: 'Hassan Mohamed',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20electrician%20portrait%20safety%20gear%20clean%20white%20background%20modern%20professional%20headshot%20photography%20confident%20expression&width=100&height=100&seq=blog-author-7&orientation=squarish',
        role: 'Électricien Certifié'
      },
      image: 'https://readdy.ai/api/search-image?query=electrician%20checking%20electrical%20panel%20safety%20inspection%20professional%20tools%20modern%20interior%20quality%20electrical%20work%20detailed%20technical%20scene&width=800&height=500&seq=blog-post-7&orientation=landscape',
      date: '28 Décembre 2024',
      readTime: '5 min',
      tags: ['Électricité', 'Sécurité', 'Prévention']
    },
    {
      id: '8',
      title: 'DjibGo atteint 5000 clients satisfaits en 2024',
      excerpt: 'Retour sur une année exceptionnelle marquée par votre confiance et notre croissance.',
      content: 'Quelle année incroyable! Nous sommes fiers d\'annoncer...',
      category: 'Actualités',
      author: {
        name: 'Khadija Said',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20woman%20ceo%20portrait%20business%20formal%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography%20leadership&width=100&height=100&seq=blog-author-8&orientation=squarish',
        role: 'Directrice Générale'
      },
      image: 'https://readdy.ai/api/search-image?query=celebrating%20team%20success%20modern%20office%20environment%20happy%20professionals%20diverse%20group%20achievement%20milestone%20celebration&width=800&height=500&seq=blog-post-8&orientation=landscape',
      date: '25 Décembre 2024',
      readTime: '4 min',
      tags: ['Actualité', 'Croissance', 'Merci']
    },
    {
      id: '9',
      title: 'Optimiser la consommation énergétique de votre maison',
      excerpt: 'Des astuces simples pour réduire vos factures tout en préservant l\'environnement.',
      content: 'Dans un contexte de hausse des prix de l\'énergie...',
      category: 'Conseils Pratiques',
      author: {
        name: 'Nour Aden',
        avatar: 'https://readdy.ai/api/search-image?query=professional%20african%20woman%20environmental%20expert%20portrait%20business%20casual%20attire%20clean%20white%20background%20modern%20professional%20headshot%20photography&width=100&height=100&seq=blog-author-9&orientation=squarish',
        role: 'Conseillère Énergie'
      },
      image: 'https://readdy.ai/api/search-image?query=energy%20efficient%20home%20solar%20panels%20modern%20sustainable%20house%20eco%20friendly%20technology%20green%20energy%20clean%20architecture&width=800&height=500&seq=blog-post-9&orientation=landscape',
      date: '20 Décembre 2024',
      readTime: '6 min',
      tags: ['Énergie', 'Économies', 'Écologie']
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'Tous' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPost]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-up">
            <div className="text-center max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <i className="ri-article-line text-3xl text-white"></i>
              </div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Blog DjibGo
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Conseils, actualités et guides pratiques pour tous vos services à domicile
              </p>
            </div>
          </AnimatedSection>

          {/* Search Bar */}
          <AnimatedSection animation="fade-up" delay={100}>
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="relative">
                <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
                <input
                  type="text"
                  placeholder="Rechercher un article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base"
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Categories */}
          <AnimatedSection animation="fade-up" delay={200}>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === category
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{filteredPosts.length}</span> article{filteredPosts.length > 1 ? 's' : ''} trouvé{filteredPosts.length > 1 ? 's' : ''}
            </p>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-article-line text-4xl text-gray-400"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aucun article trouvé
              </h3>
              <p className="text-gray-600">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post, index) => (
                <AnimatedSection key={post.id} animation="fade-up" delay={index * 50}>
                  <article className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
                    <div className="relative h-56 w-full overflow-hidden">
                      <LazyImage
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/95 backdrop-blur-sm text-orange-600 px-4 py-1.5 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <i className="ri-calendar-line"></i>
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="ri-time-line"></i>
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden">
                            <LazyImage
                              src={post.author.avatar}
                              alt={post.author.name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {post.author.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {post.author.role}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedPost(post)}
                          className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          Lire plus
                          <i className="ri-arrow-right-line"></i>
                        </button>
                      </div>
                    </div>
                  </article>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-up">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
              <i className="ri-mail-line text-3xl text-white"></i>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Restez informé
            </h2>
            <p className="text-xl text-orange-50 mb-8">
              Recevez nos derniers articles et conseils directement dans votre boîte mail
            </p>
            <form className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-6 py-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-white text-base"
              />
              <button
                type="submit"
                className="bg-gray-900 text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors font-medium whitespace-nowrap cursor-pointer"
              >
                S'abonner
              </button>
            </form>
          </AnimatedSection>
        </div>
      </section>

      {/* Article Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <span className="text-orange-600 font-medium">{selectedPost.category}</span>
              <button
                onClick={() => setSelectedPost(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-2xl text-gray-600"></i>
              </button>
            </div>

            <div className="relative h-96 w-full">
              <LazyImage
                src={selectedPost.image}
                alt={selectedPost.title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-line"></i>
                  {selectedPost.date}
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-time-line"></i>
                  {selectedPost.readTime}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-6">
                {selectedPost.title}
              </h1>

              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <LazyImage
                    src={selectedPost.author.avatar}
                    alt={selectedPost.author.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {selectedPost.author.name}
                  </p>
                  <p className="text-gray-600">
                    {selectedPost.author.role}
                  </p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  {selectedPost.excerpt}
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {selectedPost.content}
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-gray-100">
                {selectedPost.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-orange-50 text-orange-600 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}