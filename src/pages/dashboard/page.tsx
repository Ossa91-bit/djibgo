import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import ClientDashboard from './components/ClientDashboard';
import ProfessionalDashboard from './components/ProfessionalDashboard';

export default function Dashboard() {
  const { user, userType, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      if (profile?.user_type === 'professional') {
        // Récupérer les données du professionnel
        const [bookingsRes, servicesRes, reviewsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, services(title), profiles!bookings_client_id_fkey(full_name, avatar_url)')
            .eq('professional_id', profile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('services')
            .select('*')
            .eq('professional_id', profile.id),
          supabase
            .from('reviews')
            .select(`
              *,
              client_profile:profiles!client_id(full_name, avatar_url)
            `)
            .eq('professional_id', profile.id)
            .order('created_at', { ascending: false })
        ]);

        console.log('✅ Reviews récupérés pour le professionnel:', reviewsRes.data);
        console.log('✅ Nombre d\'avis:', reviewsRes.data?.length || 0);
        
        if (reviewsRes.data && reviewsRes.data.length > 0) {
          console.log('✅ Premier avis avec profil client:', reviewsRes.data[0]);
        }
        
        if (reviewsRes.error) {
          console.error('❌ Erreur lors de la récupération des avis:', reviewsRes.error);
        }

        setDashboardData({
          bookings: bookingsRes.data || [],
          services: servicesRes.data || [],
          reviews: reviewsRes.data || []
        });
      } else {
        // Récupérer les données du client
        const [bookingsRes, reviewsRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, services(title), profiles!bookings_professional_id_fkey(full_name, avatar_url)')
            .eq('client_id', profile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select(`
              *,
              professional_profile:profiles!professional_id(full_name, avatar_url)
            `)
            .eq('client_id', profile.id)
            .order('created_at', { ascending: false })
        ]);

        setDashboardData({
          bookings: bookingsRes.data || [],
          reviews: reviewsRes.data || []
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-lock-line text-4xl text-gray-400 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">Veuillez vous connecter pour accéder à votre tableau de bord.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {profile.user_type === 'professional' ? (
        <ProfessionalDashboard profile={profile} data={dashboardData} onRefresh={fetchDashboardData} />
      ) : (
        <ClientDashboard profile={profile} data={dashboardData} onRefresh={fetchDashboardData} />
      )}
    </div>
  );
}
