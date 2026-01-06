import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'client' | 'professional'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [editForm, setEditForm] = useState<any>({});
  const [addForm, setAddForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    user_type: 'client' as 'client' | 'professional'
  });
  const [professionalForm, setProfessionalForm] = useState({
    business_name: '',
    service_category: 'chauffeur',
    experience_years: 0,
    hourly_rate: 0,
    description: ''
  });
  const usersPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('user_type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erreur:', error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_verified: !currentStatus }
          : user
      ));

      alert(`Utilisateur ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.filter(user => user.id !== userId));
      alert('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleShowDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      city: user.city || '',
      address: user.address || '',
      user_type: user.user_type || 'client'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // Vérifier si le type d'utilisateur a changé vers "professional"
      const typeChanged = selectedUser.user_type !== editForm.user_type;
      const becomingProfessional = editForm.user_type === 'professional' && typeChanged;

      // Si l'utilisateur devient professionnel, vérifier s'il a déjà un profil professionnel
      if (becomingProfessional) {
        const { data: existingProfile } = await supabase
          .from('professional_profiles')
          .select('id')
          .eq('user_id', selectedUser.id)
          .single();

        if (!existingProfile) {
          // Fermer le modal d'édition et ouvrir le modal de création de profil professionnel
          setShowEditModal(false);
          setShowChangeTypeModal(true);
          setActionLoading(false);
          return;
        }
      }

      // Mise à jour normale du profil
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          city: editForm.city,
          address: editForm.address,
          user_type: editForm.user_type
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      alert('Utilisateur modifié avec succès');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProfessionalProfile = async () => {
    if (!selectedUser) return;

    if (!professionalForm.business_name || !professionalForm.hourly_rate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/transform-to-professional`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
            full_name: editForm.full_name,
            phone: editForm.phone,
            city: editForm.city,
            address: editForm.address,
            business_name: professionalForm.business_name,
            service_category: professionalForm.service_category,
            experience_years: professionalForm.experience_years,
            hourly_rate: professionalForm.hourly_rate,
            description: professionalForm.description
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la transformation');
      }

      await fetchUsers();
      setShowChangeTypeModal(false);
      setSelectedUser(null);
      setProfessionalForm({
        business_name: '',
        service_category: 'chauffeur',
        experience_years: 0,
        hourly_rate: 0,
        description: ''
      });
      alert('✅ Profil professionnel créé avec succès !\n\nL\'utilisateur apparaît maintenant dans la Gestion des Professionnels.');
    } catch (error) {
      console.error('Erreur lors de la création du profil professionnel:', error);
      alert('❌ Erreur lors de la création du profil professionnel:\n\n' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddSubmit = async () => {
    if (!addForm.full_name || !addForm.phone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            full_name: addForm.full_name,
            phone: addForm.phone,
            city: addForm.city,
            address: addForm.address,
            user_type: addForm.user_type
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'ajout');
      }

      await fetchUsers();
      setShowAddModal(false);
      setAddForm({
        full_name: '',
        phone: '',
        city: '',
        address: '',
        user_type: 'client'
      });
      
      // Afficher les identifiants temporaires
      alert(`Utilisateur ajouté avec succès!\n\nIdentifiants temporaires:\nEmail: ${result.credentials.email}\nMot de passe: ${result.credentials.password}\n\nVeuillez les communiquer à l'utilisateur.`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout de l\'utilisateur: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendClick = (user: any) => {
    setSelectedUser(user);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedUser || !suspendReason.trim()) {
      alert('Veuillez indiquer une raison pour la suspension');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: true,
          suspension_reason: suspendReason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: selectedUser.id,
        title: 'Compte suspendu',
        message: `Votre compte a été suspendu. Raison: ${suspendReason}`,
        type: 'warning',
        created_at: new Date().toISOString()
      });

      setUsers(prev =>
        prev.map(u =>
          u.id === selectedUser.id
            ? { ...u, is_suspended: true, suspension_reason: suspendReason }
            : u
        )
      );

      setShowSuspendModal(false);
      setSelectedUser(null);
      setSuspendReason('');
      alert('Utilisateur suspendu avec succès');
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
      alert('Erreur lors de la suspension de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateClick = async (user: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir réactiver le compte de ${user.full_name} ?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null
        })
        .eq('id', user.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Compte réactivé',
        message: 'Votre compte a été réactivé.',
        type: 'success',
        created_at: new Date().toISOString()
      });

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id
            ? { ...u, is_suspended: false, suspension_reason: null }
            : u
        )
      );
      
      alert('Utilisateur réactivé avec succès');
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error);
      alert('Erreur lors de la réactivation de l\'utilisateur');
    } finally {
      setActionLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm) ||
    user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Récupérer tous les utilisateurs
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Créer le contenu CSV
      const headers = ['ID', 'Nom complet', 'Téléphone', 'Ville', 'Adresse', 'Date d\'inscription', 'Statut', 'Vérifié'];
      const csvContent = [
        headers.join(','),
        ...users.map(user => [
          user.id,
          `"${user.full_name || ''}"`,
          user.phone || '',
          `"${user.city || ''}"`,
          `"${user.address || ''}"`,
          new Date(user.created_at).toLocaleDateString('fr-FR'),
          user.is_suspended ? 'Suspendu' : 'Actif',
          user.is_verified ? 'Oui' : 'Non'
        ].join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `utilisateurs_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert('Export réussi ! Le fichier a été téléchargé.');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export des données');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors whitespace-nowrap"
          >
            <i className="ri-add-line mr-2"></i>
            Ajouter
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`ri-download-line mr-2 ${isExporting ? 'animate-bounce' : ''}`}></i>
            {isExporting ? 'Export en cours...' : 'Exporter'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nom, téléphone, ville..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'utilisateur
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Tous</option>
              <option value="client">Clients</option>
              <option value="professional">Professionnels</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchUsers}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{user.full_name || 'Sans nom'}</div>
                <div className="text-xs text-gray-500">{user.user_type === 'professional' ? 'Professionnel' : 'Client'}</div>
              </div>
              {user.is_suspended && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                  Suspendu
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <i className="ri-phone-line mr-2"></i>
                {user.phone || 'Non renseigné'}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <i className="ri-map-pin-line mr-2"></i>
                {user.city || 'Non renseigné'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEditClick(user)}
                className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-edit-line mr-1"></i>
                Modifier
              </button>
              {user.is_suspended ? (
                <button
                  onClick={() => handleActivateClick(user)}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Réactiver
                </button>
              ) : (
                <button
                  onClick={() => handleSuspendClick(user)}
                  disabled={actionLoading}
                  className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Suspendre
                </button>
              )}
              <button
                onClick={() => handleShowDetails(user)}
                className="col-span-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                <i className="ri-eye-line mr-1"></i>
                Voir Détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-teal-600 text-white'
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Ajouter un utilisateur</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'utilisateur
                  </label>
                  <select
                    value={addForm.user_type}
                    onChange={(e) => setAddForm({ ...addForm, user_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="client">Client</option>
                    <option value="professional">Professionnel</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {actionLoading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'utilisateur</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de compte
                  </label>
                  <select
                    value={editForm.user_type}
                    onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="client">Client</option>
                    <option value="professional">Professionnel</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {editForm.user_type === 'professional' && selectedUser.user_type !== 'professional' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <i className="ri-information-line text-blue-600 text-xl mr-3 flex-shrink-0"></i>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Changement vers Professionnel</p>
                      <p>
                        Vous devrez remplir les informations professionnelles à l'étape suivante.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Annuler
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {actionLoading ? 'Modification...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création de profil professionnel */}
      {showChangeTypeModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Créer le profil professionnel</h3>
              <button
                onClick={() => {
                  setShowChangeTypeModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <i className="ri-information-line text-teal-600 text-xl mr-3 flex-shrink-0"></i>
                  <div className="text-sm text-teal-800">
                    <p className="font-medium mb-1">Transformation en professionnel</p>
                    <p>
                      <strong>{selectedUser.full_name}</strong> va devenir un professionnel. 
                      Veuillez remplir les informations professionnelles ci-dessous.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={professionalForm.business_name}
                    onChange={(e) => setProfessionalForm({ ...professionalForm, business_name: e.target.value })}
                    placeholder="Ex: Transport Express Djibouti"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie de service *
                  </label>
                  <select
                    value={professionalForm.service_category}
                    onChange={(e) => setProfessionalForm({ ...professionalForm, service_category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="chauffeur">Chauffeur</option>
                    <option value="artisan">Artisan</option>
                    <option value="technicien">Technicien</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={professionalForm.experience_years}
                    onChange={(e) => setProfessionalForm({ ...professionalForm, experience_years: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif horaire (DJF) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={professionalForm.hourly_rate}
                    onChange={(e) => setProfessionalForm({ ...professionalForm, hourly_rate: parseInt(e.target.value) || 0 })}
                    placeholder="Ex: 2000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description des services
                  </label>
                  <textarea
                    value={professionalForm.description}
                    onChange={(e) => setProfessionalForm({ ...professionalForm, description: e.target.value })}
                    placeholder="Décrivez les services proposés..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowChangeTypeModal(false);
                    setSelectedUser(null);
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateProfessionalProfile}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {actionLoading ? 'Création...' : 'Créer le profil professionnel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suspension */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-error-warning-line text-red-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Suspendre l'utilisateur
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedUser.full_name}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la suspension *
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Expliquez pourquoi cet utilisateur est suspendu..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {suspendReason.length}/500 caractères
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <i className="ri-alert-line text-yellow-600 text-xl mr-3 flex-shrink-0"></i>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Attention</p>
                  <p>
                    L'utilisateur ne pourra plus accéder à son compte.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedUser(null);
                  setSuspendReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={handleSuspendConfirm}
                disabled={actionLoading || !suspendReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {actionLoading ? (
                  <span className="flex items-center justify-center">
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Suspension...
                  </span>
                ) : (
                  'Confirmer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Détails de l'utilisateur</h3>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt={selectedUser.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{selectedUser.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.user_type === 'professional'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedUser.user_type === 'professional' ? 'Professionnel' : 'Client'}
                    </span>
                    {selectedUser.is_verified && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Vérifié
                      </span>
                    )}
                    {selectedUser.is_suspended && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Suspendu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <i className="ri-information-line mr-2 text-blue-600"></i>
                  Informations de base
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">ID Utilisateur</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date d'inscription</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Téléphone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.phone}</p>
                    </div>
                  )}
                  {selectedUser.city && (
                    <div>
                      <p className="text-sm text-gray-600">Ville</p>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.city}</p>
                    </div>
                  )}
                  {selectedUser.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-sm font-medium text-gray-900">{selectedUser.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <i className="ri-bar-chart-line mr-2 text-teal-600"></i>
                  Statistiques
                </h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{selectedUser.total_bookings || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Réservations</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{selectedUser.completed_bookings || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Complétées</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">{selectedUser.total_reviews || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Avis</p>
                  </div>
                </div>
              </div>

              {/* Raison de suspension */}
              {selectedUser.is_suspended && selectedUser.suspension_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-900 flex items-center mb-2">
                    <i className="ri-error-warning-line mr-2"></i>
                    Raison de la suspension
                  </h5>
                  <p className="text-sm text-red-800">{selectedUser.suspension_reason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    closeDetailsModal();
                    handleEditClick(selectedUser);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Modifier
                </button>
                <button
                  onClick={closeDetailsModal}
                  className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
