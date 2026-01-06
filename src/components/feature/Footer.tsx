import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-800 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,20 Q25,10 50,20 T100,20 L100,80 Q75,90 50,80 T0,80 Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          {/* Left section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="https://static.readdy.ai/image/1e813d69c52c7bc1336df42262450a87/42d5abd71e34e31af858a607c34fdfe7.png" 
                alt="DjibGo" 
                className="h-10 w-auto"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <input 
                type="email" 
                placeholder="Votre email..."
                className="flex-1 px-4 py-3 bg-transparent border border-gray-600 rounded-lg focus:border-orange-500 focus:outline-none text-base"
              />
              <button className="p-3 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors touch-manipulation active:scale-95 sm:flex-shrink-0">
                <i className="ri-notification-line text-xl"></i>
              </button>
            </div>

            <div className="text-lg sm:text-2xl font-serif leading-relaxed">
              <div>Services professionnels</div>
              <div>à portée de main</div>
            </div>
          </div>

          {/* Right section - Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Services</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link 
                    to="/services" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Tous les services
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/services/chauffeurs" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Chauffeurs
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/services/techniciens" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Techniciens
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/services/artisans" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Artisans
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Entreprise</h3>
              <ul className="space-y-3">
                <li>
                  <a href="/about" className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                    À Propos
                  </a>
                </li>
                <li>
                  <a href="/carrieres" className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                    Carrières
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="/support" className="text-gray-600 hover:text-orange-500 transition-colors cursor-pointer">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Ressources</h3>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link 
                    to="/blog" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/faq" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/support" 
                    className="text-gray-300 hover:text-orange-400 transition-colors text-sm sm:text-base block py-1"
                  >
                    Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/cgu" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    Conditions d'utilisation
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    Politique de confidentialité
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-gray-300 hover:text-white transition-colors cursor-pointer">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-gray-700">
          <p className="text-gray-300 text-xs sm:text-sm text-center md:text-left">
            © 2025 DjibGo - Tous droits réservés
          </p>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <a 
              href="#" 
              className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-600 rounded-lg flex items-center justify-center hover:border-orange-500 transition-colors touch-manipulation active:scale-95"
            >
              <i className="ri-facebook-line text-sm sm:text-base"></i>
            </a>
            <a 
              href="#" 
              className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-600 rounded-lg flex items-center justify-center hover:border-orange-500 transition-colors touch-manipulation active:scale-95"
            >
              <i className="ri-instagram-line text-sm sm:text-base"></i>
            </a>
            <a 
              href="#" 
              className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-600 rounded-lg flex items-center justify-center hover:border-orange-500 transition-colors touch-manipulation active:scale-95"
            >
              <i className="ri-twitter-line text-sm sm:text-base"></i>
            </a>
            <a 
              href="#" 
              className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-600 rounded-lg flex items-center justify-center hover:border-orange-500 transition-colors touch-manipulation active:scale-95"
            >
              <i className="ri-linkedin-line text-sm sm:text-base"></i>
            </a>
          </div>

          <a 
            href="https://readdy.ai/?origin=logo" 
            className="text-gray-300 text-xs sm:text-sm hover:text-orange-400 transition-colors text-center md:text-left touch-manipulation"
          >
            Powered by Readdy
          </a>
        </div>
      </div>
    </footer>
  );
}
