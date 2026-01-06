/**
 * Service de cache pour améliorer les performances
 * Utilise IndexedDB pour le stockage persistant
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private dbName = 'AppCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  /**
   * Initialise la base de données IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Créer les object stores si ils n'existent pas
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Sauvegarde des données dans le cache
   */
  async set<T>(key: string, data: T, expiresIn: number = 3600000): Promise<void> {
    if (!this.db) await this.init();

    const cacheItem: CacheItem<T> & { key: string } = {
      key,
      data,
      timestamp: Date.now(),
      expiresIn,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheItem);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Récupère des données du cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result as (CacheItem<T> & { key: string }) | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Vérifier si le cache a expiré
        const now = Date.now();
        if (now - result.timestamp > result.expiresIn) {
          // Cache expiré, le supprimer
          this.delete(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  /**
   * Supprime une entrée du cache
   */
  async delete(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Vérifie si une clé existe dans le cache et n'a pas expiré
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Récupère ou charge des données (pattern cache-aside)
   */
  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T>,
    expiresIn: number = 3600000
  ): Promise<T> {
    // Essayer de récupérer du cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Charger les données
    const data = await loader();

    // Sauvegarder dans le cache
    await this.set(key, data, expiresIn);

    return data;
  }
}

// Instance singleton
export const cacheService = new CacheService();

// Durées de cache prédéfinies
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000,      // 5 minutes
  MEDIUM: 30 * 60 * 1000,    // 30 minutes
  LONG: 60 * 60 * 1000,      // 1 heure
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 heures
};

// Clés de cache prédéfinies
export const CACHE_KEYS = {
  LOCATIONS: 'locations',
  SERVICES: 'services',
  PROFESSIONALS: 'professionals',
  CATEGORIES: 'categories',
  REVIEWS: 'reviews',
  BOOKINGS: 'bookings',
  PROFILE: 'profile',
};
