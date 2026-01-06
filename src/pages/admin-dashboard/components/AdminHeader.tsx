import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'booking' | 'payment' | 'user' | 'professional';
  is_read: boolean;
  created_at: string;
}

interface AdminProfile {
  full_name: string;
  email: string;
  role: string;
}

export default function AdminHeader() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchAdminProfile();
    
    // Fermer les panneaux si on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Récupérer le profil (sans email car il n'existe pas dans profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, city, address')
        .eq('id', user.id)
        .single();

      // Récupérer le rôle admin
      const { data: admin } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setAdminProfile({
        full_name: profile?.full_name || 'Admin',
        email: user.email || '', // Email vient de auth.users
        role: admin?.role || 'admin'
      });

      setEditForm({
        full_name: profile?.full_name || '',
        email: user.email || '' // Email vient de auth.users
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Rediriger vers la page d'accueil
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.full_name.trim()) {
      alert('Le nom complet est requis');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mettre à jour le nom dans profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mettre à jour l'email dans auth.users si modifié
      if (editForm.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: editForm.email
        });

        if (emailError) throw emailError;
      }

      // Recharger le profil
      await fetchAdminProfile();
      setShowEditProfile(false);
      alert('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return 'ri-calendar-check-line';
      case 'payment':
        return 'ri-money-dollar-circle-line';
      case 'user':
        return 'ri-user-add-line';
      case 'professional':
        return 'ri-briefcase-line';
      default:
        return 'ri-notification-line';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'text-blue-600 bg-blue-100';
      case 'payment':
        return 'text-green-600 bg-green-100';
      case 'user':
        return 'text-purple-600 bg-purple-100';
      case 'professional':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)} j`;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Superadmin';
      case 'admin':
        return 'Administrateur';
      case 'moderator':
        return 'Modérateur';
      default:
        return 'Admin';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="https://static.readdy.ai/image/1e813d69c52c7bc1336df42262450a87/9e17b5b0e62ff9bc031ba4032efd4c16.png" 
              alt="DjibGo" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Admin</h1>
              <p className="text-sm text-gray-600 mt-1">Gérez votre plateforme DjibGo</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Bouton de notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-800 relative cursor-pointer"
              >
                <i className="ri-notification-line text-xl"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Panneau de notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[500px] overflow-hidden">
                  {/* En-tête */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap"
                      >
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  {/* Liste des notifications */}
                  <div className="overflow-y-auto max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <i className="ri-notification-off-line text-4xl mb-2"></i>
                        <p className="text-sm">Aucune notification</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                          className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                            !notification.is_read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                              <i className={`${getNotificationIcon(notification.type)} text-lg`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                {!notification.is_read && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatTime(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pied de page */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 text-center">
                      <button className="text-sm text-teal-600 hover:text-teal-700 font-medium cursor-pointer whitespace-nowrap">
                        Voir toutes les notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Menu Profil admin */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                  <i className="ri-admin-line text-white text-lg"></i>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{adminProfile?.full_name || 'Admin'}</p>
                  <p className="text-xs text-gray-600">{adminProfile ? getRoleLabel(adminProfile.role) : 'Chargement...'}</p>
                </div>
                <i className={`ri-arrow-down-s-line text-gray-600 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}></i>
              </button>

              {/* Menu déroulant */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                  {/* Info profil */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{adminProfile?.full_name}</p>
                    <p className="text-xs text-gray-600 mt-1">{adminProfile?.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                      {adminProfile ? getRoleLabel(adminProfile.role) : 'Admin'}
                    </span>
                  </div>

                  {/* Options du menu */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowEditProfile(true);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line text-lg mr-3 text-gray-600"></i>
                      Modifier le profil
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <i className="ri-logout-box-line text-lg mr-3"></i>
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modale d'édition du profil */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* En-tête */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Modifier le profil</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Contenu */}
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Votre nom complet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 text-lg mr-2 mt-0.5"></i>
                  <p className="text-xs text-blue-800">
                    Ces informations seront visibles dans votre profil administrateur.
                  </p>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditProfile(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
