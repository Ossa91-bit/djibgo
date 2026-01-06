import { useState, useEffect } from 'react';
import {
  registerServiceWorker,
  isServiceWorkerActive,
  checkForUpdates,
  getNetworkStatus,
  setupNetworkListeners,
} from '../utils/serviceWorker';

interface ServiceWorkerState {
  isRegistered: boolean;
  isActive: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isActive: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    registration: null,
  });

  useEffect(() => {
    // Register service worker
    const register = async () => {
      const registration = await registerServiceWorker();
      
      setState((prev) => ({
        ...prev,
        isRegistered: !!registration,
        isActive: isServiceWorkerActive(),
        registration,
      }));
    };

    register();

    // Setup network listeners
    const cleanup = setupNetworkListeners(
      () => setState((prev) => ({ ...prev, isOnline: true })),
      () => setState((prev) => ({ ...prev, isOnline: false }))
    );

    // Check for updates periodically
    const updateInterval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      if (hasUpdate) {
        setState((prev) => ({ ...prev, updateAvailable: true }));
      }
    }, 60000); // Check every minute

    return () => {
      cleanup();
      clearInterval(updateInterval);
    };
  }, []);

  const update = () => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    ...state,
    networkStatus: getNetworkStatus(),
    update,
  };
};

export default useServiceWorker;
