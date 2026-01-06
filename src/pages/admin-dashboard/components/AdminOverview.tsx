import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface Stats {
  totalUsers: number;
  totalProfessionals: number;
  totalBookings: number;
  totalRevenue: number;
  totalCommission: number;
  pendingBookings: number;
  activeServices: number;
}

interface AdminOverviewProps {
  onNavigateToBooking?: (bookingId: string) => void;
}

export default function AdminOverview({ onNavigateToBooking }: AdminOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProfessionals: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingBookings: 0,
    activeServices: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingActivities, setRefreshingActivities] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats', {
        body: { action: 'get_stats' }
      });

      if (error) throw error;

      if (data) {
        // Map the response from edge function to component state
        setStats({
          totalUsers: data.totalUsers || 0,
          totalProfessionals: data.totalProfessionals || 0,
          totalBookings: data.totalBookings || 0,
          totalRevenue: data.monthlyRevenue || 0,
          totalCommission: data.totalCommission || 0,
          pendingBookings: data.activeBookings || 0,
          activeServices: data.totalProfessionals || 0, // Using professionals count as active services for now
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          created_at,
          profiles!bookings_client_id_fkey(full_name),
          services(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentActivities(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités récentes:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentActivities()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleRefreshStats = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleRefreshActivities = async () => {
    setRefreshingActivities(true);
    await fetchRecentActivities();
    setRefreshingActivities(false);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    setRefreshingActivities(true);
    await Promise.all([fetchStats(), fetchRecentActivities()]);
    setRefreshing(false);
    setRefreshingActivities(false);
  };

  const handleViewBookingDetails = (bookingId: string) => {
    if (onNavigateToBooking) {
      onNavigateToBooking(bookingId);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Récupérer toutes les données pour l'export
      const [usersData, professionalsData, bookingsData, servicesData] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('professional_profiles').select('*, profiles(*)'),
        supabase.from('bookings').select('*, profiles!bookings_client_id_fkey(full_name, phone), services(title, price)'),
        supabase.from('services').select('*, profiles(full_name)')
      ]);

      // Créer le contenu CSV
      const csvContent = generateCSVContent({
        stats,
        users: usersData.data || [],
        professionals: professionalsData.data || [],
        bookings: bookingsData.data || [],
        services: servicesData.data || []
      });

      // Télécharger le fichier
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rapport_admin_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Export réussi ! Le fichier a été téléchargé.');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données.');
    } finally {
      setExporting(false);
    }
  };

  const generateCSVContent = (data: any) => {
    let csv = '\uFEFF'; // BOM pour UTF-8
    
    // Section Statistiques
    csv += 'STATISTIQUES GÉNÉRALES\n';
    csv += 'Métrique,Valeur\n';
    csv += `Utilisateurs totaux,${data.stats.totalUsers}\n`;
    csv += `Professionnels totaux,${data.stats.totalProfessionals}\n`;
    csv += `Réservations totales,${data.stats.totalBookings}\n`;
    csv += `Revenus totaux,${data.stats.totalRevenue} FDJ\n`;
    csv += `Commissions plateforme,${data.stats.totalCommission} FDJ\n`;
    csv += `Réservations en attente,${data.stats.pendingBookings}\n`;
    csv += `Services actifs,${data.stats.activeServices}\n`;
    csv += '\n\n';

    // Section Utilisateurs
    csv += 'UTILISATEURS\n';
    csv += 'ID,Nom complet,Téléphone,Ville,Date d\'inscription\n';
    data.users.forEach((user: any) => {
      csv += `${user.id},${user.full_name || ''},${user.phone || ''},${user.city || ''},${new Date(user.created_at).toLocaleDateString('fr-FR')}\n`;
    });
    csv += '\n\n';

    // Section Professionnels
    csv += 'PROFESSIONNELS\n';
    csv += 'ID,Nom complet,Téléphone,Catégorie,Expérience,Tarif horaire,Ville\n';
    data.professionals.forEach((pro: any) => {
      csv += `${pro.id},${pro.profiles?.full_name || ''},${pro.profiles?.phone || ''},${pro.category || ''},${pro.years_of_experience || 0} ans,${pro.hourly_rate || 0} FDJ,${pro.profiles?.city || ''}\n`;
    });
    csv += '\n\n';

    // Section Réservations
    csv += 'RÉSERVATIONS\n';
    csv += 'ID,Client,Téléphone,Service,Montant,Statut,Date de création\n';
    data.bookings.forEach((booking: any) => {
      csv += `${booking.id},${booking.profiles?.full_name || ''},${booking.profiles?.phone || ''},${booking.services?.title || ''},${booking.total_price || booking.services?.price || 0} FDJ,${booking.status},${new Date(booking.created_at).toLocaleDateString('fr-FR')}\n`;
    });
    csv += '\n\n';

    // Section Services
    csv += 'SERVICES\n';
    csv += 'ID,Titre,Professionnel,Prix,Catégorie,Date de création\n';
    data.services.forEach((service: any) => {
      csv += `${service.id},${service.title || ''},${service.profiles?.full_name || ''},${service.price || 0} FDJ,${service.category || ''},${new Date(service.created_at).toLocaleDateString('fr-FR')}\n`;
    });

    return csv;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton d'export */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <i className={`ri-download-line mr-2 ${exporting ? 'animate-pulse' : ''}`}></i>
          {exporting ? 'Export en cours...' : 'Exporter'}
        </button>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Utilisateurs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-blue-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Professionnels</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProfessionals}</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <i className="ri-briefcase-line text-teal-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Réservations</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-calendar-line text-purple-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenus totaux</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toFixed(0)} DJF</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-green-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Commissions plateforme</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalCommission.toFixed(0)} DJF</p>
              <p className="text-xs text-gray-500 mt-1">10% par service</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className="ri-percent-line text-amber-600 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">En attente</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-orange-600 text-2xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques et activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activités récentes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
            <button
              onClick={handleRefreshActivities}
              disabled={refreshingActivities}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <i className={`ri-refresh-line mr-1 ${refreshingActivities ? 'animate-spin' : ''}`}></i>
              {refreshingActivities ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="ri-calendar-check-line text-orange-600"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Nouvelle réservation
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.profiles?.full_name || 'Client'} → {activity.services?.title || 'Service'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      activity.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      activity.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.status === 'confirmed' ? 'Confirmé' :
                       activity.status === 'pending' ? 'En attente' :
                       activity.status === 'cancelled' ? 'Annulé' :
                       activity.status}
                    </span>
                    <button
                      onClick={() => handleViewBookingDetails(activity.id)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Détails
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bouton d'actualisation global */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Actualiser les données</h3>
              <p className="text-sm text-gray-600 mb-4">Cliquez pour recharger toutes les statistiques et activités récentes en temps réel.</p>
            </div>
            <button
              onClick={handleRefreshAll}
              disabled={refreshing || refreshingActivities}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <i className={`ri-refresh-line mr-2 ${(refreshing || refreshingActivities) ? 'animate-spin' : ''}`}></i>
              {(refreshing || refreshingActivities) ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}