import { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';
import SEOHead from "./components/feature/SEOHead";
import { supabase } from './lib/supabase';

function App() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize application with timeout protection
    const initApp = async () => {
      try {
        // Timeout de 3 secondes maximum pour l'initialisation
        const initTimeout = setTimeout(() => {
          console.warn('Initialization timeout - continuing anyway');
          setIsLoading(false);
        }, 3000);

        // Check user session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        }

        // Handle authentication errors in URL
        const handleAuthError = () => {
          const hash = window.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          
          const error = params.get('error');
          const errorDescription = params.get('error_description');
          const errorCode = params.get('error_code');

          if (error) {
            let errorMessage = '';
            
            switch (error) {
              case 'access_denied':
                if (errorCode === 'otp_expired') {
                  errorMessage = 'Le lien de confirmation a expiré. Veuillez demander un nouveau lien de confirmation.';
                } else {
                  errorMessage = 'Accès refusé. Veuillez réessayer.';
                }
                break;
              case 'invalid_request':
                errorMessage = 'Demande invalide. Veuillez réessayer.';
                break;
              default:
                errorMessage = errorDescription ? decodeURIComponent(errorDescription.replace(/\+/g, ' ')) : 'Une erreur d\'authentification s\'est produite.';
            }
            
            setAuthError(errorMessage);
            
            // Clean URL after displaying error
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        };

        handleAuthError();
        
        // Clear timeout si tout s'est bien passé
        clearTimeout(initTimeout);
        setIsLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        // Ne jamais bloquer l'application
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  const closeErrorModal = () => {
    setAuthError(null);
  };

  // Display loader during initialization (max 3 secondes)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de DjibGo...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename={__BASE_PATH__}>
      <div className="App">
        <SEOHead />
        <AppRoutes />
        
        {/* Authentication error modal */}
        {authError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <i className="ri-error-warning-line text-red-600 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Erreur d'authentification
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">{authError}</p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    closeErrorModal();
                    window.location.href = '/';
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  Réessayer l'inscription
                </button>
                <button
                  onClick={closeErrorModal}
                  className="text-gray-600 hover:text-gray-800 transition-colors font-medium whitespace-nowrap cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
