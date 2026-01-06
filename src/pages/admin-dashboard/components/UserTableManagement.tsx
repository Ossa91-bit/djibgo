
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../components/base/LoadingSpinner';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  user_type: 'client' | 'professional' | 'admin';
  avatar_url: string;
  is_verified: boolean;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

interface UserTableManagementProps {
  onClose: () => void;
}

export default function UserTableManagement({ onClose }: UserTableManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [stats, setStats] = useState({
    total: 0,
    clients: 0,
    professionals: 0,
    admins: 0,
    verified: 0,
    active: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: User[]) => {
    setStats({
      total: usersData.length,
      clients: usersData.filter(u => u.user_type === 'client').length,
      professionals: usersData.filter(u => u.user_type === 'professional').length,
      admins: usersData.filter(u => u.user_type === 'admin').length,
      verified: usersData.filter(u => u.is_verified).length,
      active: usersData.filter(u => u.is_active).length
    });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', selectedUser.id);

      if (error) throw error;

      alert('✅ Utilisateur mis à jour avec succès !');
      setShowEditModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      alert('✅ Utilisateur supprimé avec succès !');
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de vérification:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone_number?.includes(searchTerm);

    const matchesType = filterType === 'all' || user.user_type === filterType;
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active) ||
      (filterStatus === 'verified' && user.is_verified) ||
      (filterStatus === 'unverified' && !user.is_verified);

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-7xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h2>
            <p className="text-sm text-gray-600 mt-1">Table: profiles</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Clients</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{stats.clients}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Professionnels</div>
              <div className="text-2xl font-bold text-purple-900 mt-1">{stats.professionals}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium">Admins</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">{stats.admins}</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-4">
              <div className="text-sm text-teal-600 font-medium">Vérifiés</div>
              <div className="text-2xl font-bold text-teal-900 mt-1">{stats.verified}</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4">
              <div className="text-sm text-indigo-600 font-medium">Actifs</div>
              <div className="text-2xl font-bold text-indigo-900 mt-1">{stats.active}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rechercher
              </label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, email, téléphone..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'utilisateur
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="all">Tous les types</option>
                <option value="client">Clients</option>
                <option value="professional">Professionnels</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="verified">Vérifiés</option>
                <option value="unverified">Non vérifiés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-6 overflow-x-auto" style={{ maxHeight: '500px' }}>
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière connexion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || 'Sans nom'}</div>
                        <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-xs text-gray-500">{user.phone_number || 'Pas de téléphone'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                      user.user_type === 'admin' ? 'bg-orange-100 text-orange-800' :
                      user.user_type === 'professional' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.user_type === 'admin' ? 'Admin' :
                       user.user_type === 'professional' ? 'Professionnel' :
                       'Client'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? '✓ Actif' : '✗ Inactif'}
                      </button>
                      <button
                        onClick={() => handleToggleVerification(user.id, user.is_verified)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer ${
                          user.is_verified ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.is_verified ? '✓ Vérifié' : '✗ Non vérifié'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <i className="ri-user-search-line text-6xl text-gray-300"></i>
              <p className="text-gray-500 mt-4">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} affiché{filteredUsers.length > 1 ? 's' : ''}
            </p>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <i className="ri-refresh-line mr-2"></i>
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Modifier l'utilisateur</h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={editForm.phone_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'utilisateur
                </label>
                <select
                  value={editForm.user_type || 'client'}
                  onChange={(e) => setEditForm({ ...editForm, user_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="client">Client</option>
                  <option value="professional">Professionnel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'avatar
                </label>
                <input
                  type="url"
                  value={editForm.avatar_url || ''}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={editForm.is_verified || false}
                    onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compte vérifié</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={editForm.is_active || false}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compte actif</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium whitespace-nowrap"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium whitespace-nowrap"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
