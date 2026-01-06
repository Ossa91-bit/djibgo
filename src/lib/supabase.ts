import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Optimized configuration for ultra-fast performance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'djibgo-auth',
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'djibgo-web',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
});

// Enhanced Edge Function caller with retry logic and better error handling
export const callEdgeFunction = async <T = any>(
  functionName: string,
  body?: any,
  options: {
    retries?: number;
    timeout?: number;
    method?: 'POST' | 'GET';
  } = {}
): Promise<{ data: T | null; error: any }> => {
  const { retries = 2, timeout = 30000, method = 'POST' } = options;
  
  let lastError: any = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Use Supabase SDK's built-in invoke method
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: method === 'POST' ? body : undefined,
        method,
      });
      
      if (error) {
        console.error(`Edge function ${functionName} error (attempt ${attempt + 1}):`, error);
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.status && error.status >= 400 && error.status < 500) {
          return { data: null, error };
        }
        
        // Retry on server errors (5xx) or network errors
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
      } else {
        return { data, error: null };
      }
      
    } catch (err: any) {
      console.error(`Edge function ${functionName} exception (attempt ${attempt + 1}):`, err);
      lastError = {
        message: err.message || 'Network error',
        name: err.name,
        originalError: err,
      };
      
      // Retry on network errors
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  return { 
    data: null, 
    error: lastError || { message: `Edge function ${functionName} failed after ${retries} retries` }
  };
};

// Fallback to direct fetch if SDK fails
export const callEdgeFunctionDirect = async <T = any>(
  functionName: string,
  body?: any,
  options: {
    timeout?: number;
    method?: 'POST' | 'GET';
  } = {}
): Promise<{ data: T | null; error: any }> => {
  const { timeout = 30000, method = 'POST' } = options;
  
  try {
    // Get current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Build the Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/${functionName}`;
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    };
    
    // Add authorization if session exists
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Make the request
    const response = await fetch(functionUrl, {
      method,
      headers,
      body: method === 'POST' && body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Parse response
    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: {
          message: errorText || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          statusText: response.statusText,
        }
      };
    }
    
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    
    return { data, error: null };
    
  } catch (err: any) {
    console.error(`Direct fetch failed for ${functionName}:`, err);
    return {
      data: null,
      error: {
        message: err.message || 'Network error',
        name: err.name,
        originalError: err,
      }
    };
  }
};

// Smart Edge Function caller that tries SDK first, then direct fetch
export const smartCallEdgeFunction = async <T = any>(
  functionName: string,
  body?: any,
  options: {
    retries?: number;
    timeout?: number;
    method?: 'POST' | 'GET';
  } = {}
): Promise<{ data: T | null; error: any }> => {
  // Try SDK method first
  const result = await callEdgeFunction<T>(functionName, body, options);
  
  // If SDK fails, try direct fetch
  if (result.error) {
    console.warn(`SDK method failed for ${functionName}, trying direct fetch...`);
    return callEdgeFunctionDirect<T>(functionName, body, options);
  }
  
  return result;
};

// Connection pooling and query optimization
export const optimizedQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  cacheKey?: string,
  cacheDuration = 300000 // 5 minutes default
): Promise<{ data: T | null; error: any }> => {
  // Check cache first
  if (cacheKey && typeof window !== 'undefined') {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheDuration) {
          return { data, error: null };
        }
      } catch (e) {
        // Invalid cache, continue with query
      }
    }
  }

  // Execute query
  const result = await queryFn();

  // Cache successful results
  if (result.data && !result.error && cacheKey && typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ data: result.data, timestamp: Date.now() })
      );
    } catch (e) {
      // Storage full, ignore
    }
  }

  return result;
};

// Batch query helper
export const batchQueries = async <T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> => {
  return Promise.all(queries.map(q => q()));
};

// Prefetch helper for critical data
export const prefetchData = async (keys: string[]) => {
  const prefetchPromises = keys.map(async (key) => {
    switch (key) {
      case 'categories':
        return supabase.from('service_categories').select('*').limit(20);
      case 'locations':
        return supabase.from('locations').select('*').limit(50);
      case 'professionals':
        return supabase.from('professional_profiles').select('*').limit(30);
      default:
        return null;
    }
  });

  await Promise.allSettled(prefetchPromises);
};
