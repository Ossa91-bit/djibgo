import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from '../auth/AuthModal';
import UserTypeSelectionModal from '../auth/UserTypeSelectionModal';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const { user, profile, needsProfileSetup, signOut, completeOAuthSetup } = useAuth();
  const navigate = useNavigate();

  // Gestion du scroll pour le header fixe
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermer les menus lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
    setIsMenuOpen(false);
  };

  const closeMenus = () => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleProfileSetupComplete = () => {
    completeOAuthSetup();
    navigate('/');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-white'
      }`}>
        <nav className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="https://static.readdy.ai/image/1e813d69c52c7bc1336df42262450a87/42d5abd71e34e31af858a607c34fdfe7.png" 
                alt="DjibGo" 
                className="h-10 w-auto"
              />
            </Link>

            {/* Menu desktop */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Accueil
              </Link>
              <Link 
                to="/services" 
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Services
              </Link>
              <Link 
                to="/how-it-works" 
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Comment ça marche
              </Link>
              <Link 
                to="/a-propos" 
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                À propos
              </Link>
              <Link 
                to="/support" 
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Support
              </Link>
            </div>

            {/* Actions utilisateur desktop */}
            <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
              {user && profile ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-orange-500 transition-colors p-2 rounded-lg hover:bg-gray-50 touch-manipulation"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <i className="ri-user-line text-orange-500"></i>
                      )}
                    </div>
                    <span className="font-medium hidden lg:block">{profile.full_name}</span>
                    <i className={`ri-arrow-down-s-line transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {/* Menu déroulant utilisateur */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="font-medium text-gray-900">{profile.full_name}</p>
                        <p className="text-sm text-gray-500 capitalize">
                          {profile.user_type === 'professional' ? 'Professionnel' : 'Client'}
                        </p>
                        {profile.is_verified && (
                          <span className="inline-flex items-center text-xs text-blue-600 mt-1">
                            <i className="ri-verified-badge-fill mr-1"></i>
                            Profil vérifié
                          </span>
                        )}
                      </div>
                      
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="ri-dashboard-line mr-2"></i>
                        Tableau de bord
                      </Link>
                      
                      {profile.user_type === 'professional' && (
                        <>
                          <Link
                            to="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <i className="ri-tools-line mr-2"></i>
                            Mes services
                          </Link>
                          <Link
                            to="/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <i className="ri-calendar-line mr-2"></i>
                            Réservations
                          </Link>
                        </>
                      )}

                      {profile.user_type === 'client' && (
                        <Link
                          to="/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <i className="ri-bookmark-line mr-2"></i>
                          Mes réservations
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <i className="ri-settings-line mr-2"></i>
                        Paramètres
                      </Link>

                      <div className="border-t border-gray-200 mt-2">
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <i className="ri-logout-box-line mr-2"></i>
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => openAuthModal('login')}
                    className="text-gray-600 hover:text-orange-500 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-gray-50 touch-manipulation"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium touch-manipulation active:scale-95 whitespace-nowrap"
                  >
                    Inscription
                  </button>
                </>
              )}
            </div>

            {/* Bouton menu mobile */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-orange-500 transition-colors rounded-lg hover:bg-gray-50 touch-manipulation active:scale-95"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <i className={`text-xl transition-transform duration-200 ${isMenuOpen ? 'ri-close-line rotate-90' : 'ri-menu-line'}`}></i>
            </button>
          </div>
        </nav>

        {/* Menu mobile avec overlay */}
        <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu content */}
          <div className={`absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white shadow-xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-4 pt-20 h-full overflow-y-auto">
              <div className="space-y-1">
                <Link
                  to="/"
                  className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="ri-home-line mr-3"></i>
                  Accueil
                </Link>
                <Link
                  to="/services"
                  className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="ri-service-line mr-3"></i>
                  Services
                </Link>
                <Link
                  to="/how-it-works"
                  className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="ri-question-line mr-3"></i>
                  Comment ça marche
                </Link>
                <Link
                  to="/a-propos"
                  className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="ri-information-line mr-3"></i>
                  À propos
                </Link>
                <Link
                  to="/support"
                  className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="ri-question-line mr-3"></i>
                  Support
                </Link>
              </div>

              {user && profile ? (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 mb-6 px-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <i className="ri-user-line text-orange-500 text-lg"></i>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{profile.full_name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {profile.user_type === 'professional' ? 'Professionnel' : 'Client'}
                      </p>
                      {profile.is_verified && (
                        <span className="inline-flex items-center text-xs text-blue-600 mt-1">
                          <i className="ri-verified-badge-fill mr-1"></i>
                          Vérifié
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ri-dashboard-line mr-3"></i>
                      Tableau de bord
                    </Link>
                    
                    {profile.user_type === 'professional' && (
                      <>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <i className="ri-tools-line mr-3"></i>
                          Mes services
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <i className="ri-calendar-line mr-3"></i>
                          Réservations
                        </Link>
                      </>
                    )}

                    {profile.user_type === 'client' && (
                      <Link
                        to="/dashboard"
                        className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="ri-bookmark-line mr-3"></i>
                        Mes réservations
                      </Link>
                    )}

                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ri-settings-line mr-3"></i>
                      Paramètres
                    </Link>

                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <i className="ri-logout-box-line mr-3"></i>
                      Déconnexion
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-3">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="block w-full text-center px-4 py-3 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                  >
                    <i className="ri-login-box-line mr-2"></i>
                    Connexion
                  </button>
                  <button
                    onClick={() => openAuthModal('register')}
                    className="block w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                  >
                    <i className="ri-user-add-line mr-2"></i>
                    Inscription
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spacer pour compenser le header fixe */}
      <div className="h-16 sm:h-20"></div>

      {/* Modal d'authentification */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Modal de sélection du type de compte pour OAuth */}
      {user && needsProfileSetup && (
        <UserTypeSelectionModal
          isOpen={needsProfileSetup}
          userId={user.id}
          userEmail={user.email || ''}
          userName={user.user_metadata?.full_name || user.user_metadata?.name || ''}
          onComplete={handleProfileSetupComplete}
        />
      )}
    </>
  );
}
