import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  userType: 'client' | 'professional' | null;
  isAdmin: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    userType: null,
    isAdmin: false,
  });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthState({
            user: null,
            loading: false,
            userType: null,
            isAdmin: false,
          });
          return;
        }
        
        if (session?.user) {
          // Récupérer le profil avec timeout
          const profilePromise = supabase
            .from('profiles')
            .select('user_type')
            .eq('id', session.user.id)
            .single();

          const adminPromise = supabase
            .from('admins')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

          // Timeout de 5 secondes pour éviter le blocage
          const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );

          const [profileResult, adminResult] = await Promise.allSettled([
            Promise.race([profilePromise, timeout]),
            Promise.race([adminPromise, timeout])
          ]);

          const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
          const adminData = adminResult.status === 'fulfilled' ? adminResult.value.data : null;

          setAuthState({
            user: session.user,
            loading: false,
            userType: profile?.user_type || null,
            isAdmin: !!adminData,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            userType: null,
            isAdmin: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          loading: false,
          userType: null,
          isAdmin: false,
        });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Récupération non bloquante
        const [profileResult, adminResult] = await Promise.allSettled([
          supabase.from('profiles').select('user_type').eq('id', session.user.id).single(),
          supabase.from('admins').select('id').eq('user_id', session.user.id).single()
        ]);

        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
        const adminData = adminResult.status === 'fulfilled' ? adminResult.value.data : null;

        setAuthState({
          user: session.user,
          loading: false,
          userType: profile?.user_type || null,
          isAdmin: !!adminData,
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          userType: null,
          isAdmin: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
};
