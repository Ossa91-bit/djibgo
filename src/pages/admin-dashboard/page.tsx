import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AdminHeader from './components/AdminHeader';
import AdminOverview from './components/AdminOverview';
import UserManagement from './components/UserManagement';
import ProfessionalManagement from './components/ProfessionalManagement';
import BookingManagement from './components/BookingManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import PaymentManagement from './components/PaymentManagement';
import ReviewManagement from './components/ReviewManagement';
import ServiceManagement from './components/ServiceManagement';
import SMSLogsManagement from './components/SMSLogsManagement';
import CategoryManagement from './components/CategoryManagement';
import UserTableManagement from './components/UserTableManagement';
import LocationManagement from './components/LocationManagement';
import SecurityMonitoring from './components/SecurityMonitoring';
import TeamManagement from './components/TeamManagement';
import { supabase } from '../../lib/supabase';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { WithdrawalManagement } from './components/WithdrawalManagement';

type AdminSection = 'overview' | 'users' | 'professionals' | 'bookings' | 'analytics' | 'payments' | 'reviews' | 'services' | 'sms' | 'categories' | 'users-table' | 'locations' | 'withdrawals' | 'security' | 'team';

const AdminDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // Utiliser la fonction Edge pour vérifier le statut admin sans problèmes RLS
        const { data, error } = await supabase.functions.invoke('admin-stats', {
          body: { action: 'check_admin', user_id: user.id }
        });

        if (error) {
          console.error('Erreur lors de la vérification admin:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.is_admin || false);
        }
      } catch (error) {
        // Fallback: vérifier directement l'email pour les superadmins connus
        const knownSuperAdmins = ['ossadaoud@gmail.com'];
        if (user.email && knownSuperAdmins.includes(user.email)) {
          setIsAdmin(true);
        } else {
          console.error('Erreur lors de la vérification admin:', error);
          setIsAdmin(false);
        }
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNavigateToBooking = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setActiveSection('bookings');
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Administrateur</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder au tableau de bord administrateur.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès Refusé</h2>
          <p className="text-gray-600 mb-6">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: 'ri-dashboard-line' },
    { key: 'users', label: 'Utilisateurs', icon: 'ri-user-line' },
    { key: 'users-table', label: 'Table Users', icon: 'ri-database-2-line' },
    { key: 'professionals', label: 'Professionnels', icon: 'ri-briefcase-line' },
    { key: 'bookings', label: 'Réservations', icon: 'ri-calendar-line' },
    { key: 'payments', label: 'Paiements', icon: 'ri-money-dollar-circle-line' },
    { key: 'withdrawals', label: 'Retraits', icon: 'ri-bank-card-line' },
    { key: 'services', label: 'Services', icon: 'ri-service-line' },
    { key: 'categories', label: 'Catégories', icon: 'ri-folder-line' },
    { key: 'locations', label: 'Localisations', icon: 'ri-map-pin-line' },
    { key: 'team', label: 'Équipe', icon: 'ri-team-line' },
    { key: 'reviews', label: 'Avis', icon: 'ri-star-line' },
    { key: 'sms', label: 'SMS Logs', icon: 'ri-message-line' },
    { key: 'analytics', label: 'Analyses', icon: 'ri-bar-chart-line' },
    { key: 'security', label: 'Sécurité', icon: 'ri-shield-check-line' },
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: 'ri-dashboard-line' },
    { id: 'analytics', label: 'Analytiques', icon: 'ri-line-chart-line' },
    { id: 'bookings', label: 'Réservations', icon: 'ri-calendar-check-line' },
    { id: 'payments', label: 'Paiements', icon: 'ri-money-dollar-circle-line' },
    { id: 'withdrawals', label: 'Retraits', icon: 'ri-bank-card-line' },
    { id: 'users', label: 'Utilisateurs', icon: 'ri-user-line' },
    { id: 'professionals', label: 'Professionnels', icon: 'ri-user-star-line' },
    { id: 'services', label: 'Services', icon: 'ri-tools-line' },
    { id: 'categories', label: 'Catégories', icon: 'ri-folder-line' },
    { id: 'team', label: 'Équipe', icon: 'ri-team-line' },
    { id: 'reviews', label: 'Avis', icon: 'ri-star-line' },
    { id: 'locations', label: 'Localisations', icon: 'ri-map-pin-line' },
    { id: 'sms', label: 'SMS Logs', icon: 'ri-message-3-line' },
    { id: 'security', label: 'Sécurité', icon: 'ri-shield-check-line' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminOverview onNavigateToBooking={handleNavigateToBooking} />;
      case 'users':
        return <UserManagement />;
      case 'users-table':
        return <UserTableManagement onClose={() => setActiveSection('overview')} />;
      case 'professionals':
        return <ProfessionalManagement />;
      case 'bookings':
        return <BookingManagement selectedBookingId={selectedBookingId} onClearSelection={() => setSelectedBookingId(null)} />;
      case 'payments':
        return <PaymentManagement />;
      case 'withdrawals':
        return <WithdrawalManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'locations':
        return <LocationManagement />;
      case 'team':
        return <TeamManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'sms':
        return <SMSLogsManagement />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'security':
        return <SecurityMonitoring />;
      default:
        return <AdminOverview onNavigateToBooking={handleNavigateToBooking} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex-shrink-0">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center mr-3">
              <i className="ri-shield-user-line text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin DjibGo</h1>
              <p className="text-sm text-gray-600">Tableau de bord</p>
            </div>
          </div>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key as AdminSection)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors ${
                activeSection === item.key
                  ? 'border-r-2 border-teal-600 bg-teal-50 text-teal-700'
                  : 'text-gray-700'
              }`}
            >
              <i className={`${item.icon} text-xl mr-3`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleBackToHome}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            Retour à l'accueil
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
