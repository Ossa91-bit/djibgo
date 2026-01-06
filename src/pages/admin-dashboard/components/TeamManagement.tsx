import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import LoadingSpinner from '../../../components/base/LoadingSpinner';

interface TeamMember {
  id: string;
  full_name: string;
  position: string;
  description: string;
  avatar_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const TeamManagement: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    description: '',
    avatar_url: '',
    display_order: 0,
    is_active: true
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `team-avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('team-members')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-members')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if file is selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        avatarUrl = uploadedUrl;

        // Delete old avatar if updating and old avatar exists
        if (editingMember && editingMember.avatar_url && editingMember.avatar_url.includes('team-avatars/')) {
          const oldPath = editingMember.avatar_url.split('team-avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('team-members')
              .remove([`team-avatars/${oldPath}`]);
          }
        }
      }

      // Validate avatar URL
      if (!avatarUrl && !editingMember) {
        alert('Please upload an avatar image');
        setLoading(false);
        return;
      }

      if (editingMember) {
        // Update existing member
        const { error } = await supabase
          .from('team_members')
          .update({
            full_name: formData.full_name,
            position: formData.position,
            description: formData.description,
            avatar_url: avatarUrl || editingMember.avatar_url,
            display_order: formData.display_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;
        alert('Team member updated successfully!');
      } else {
        // Add new member
        const { error } = await supabase
          .from('team_members')
          .insert([{
            full_name: formData.full_name,
            position: formData.position,
            description: formData.description,
            avatar_url: avatarUrl,
            display_order: formData.display_order,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        alert('Team member added successfully!');
      }

      setShowModal(false);
      setEditingMember(null);
      resetForm();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('Failed to save team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name,
      position: member.position,
      description: member.description,
      avatar_url: member.avatar_url,
      display_order: member.display_order,
      is_active: member.is_active
    });
    setAvatarPreview(member.avatar_url);
    setAvatarFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre de l\'équipe? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);

    try {
      // Find the member to get avatar URL
      const member = teamMembers.find(m => m.id === id);
      
      // Delete avatar from storage if it exists
      if (member?.avatar_url && member.avatar_url.includes('team-avatars/')) {
        const filePath = member.avatar_url.split('team-avatars/')[1];
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('team-members')
            .remove([`team-avatars/${filePath}`]);
          
          if (storageError) {
            console.error('Error deleting avatar:', storageError);
          }
        }
      }

      // Delete member from database
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Membre de l\'équipe supprimé avec succès!');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Erreur lors de la suppression du membre. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if file is selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        avatarUrl = uploadedUrl;
      }

      if (!avatarUrl) {
        alert('Please upload an avatar image');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('team_members')
        .insert([{
          full_name: formData.full_name,
          position: formData.position,
          description: formData.description,
          avatar_url: avatarUrl,
          display_order: formData.display_order,
          is_active: formData.is_active
        }]);

      if (error) throw error;

      alert('Team member added successfully!');
      setShowModal(false);
      resetForm();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setLoading(true);

    try {
      let avatarUrl = formData.avatar_url;

      // Upload new avatar if file is selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        avatarUrl = uploadedUrl;

        // Delete old avatar if it exists and is from our storage
        if (editingMember.avatar_url && editingMember.avatar_url.includes('team-avatars/')) {
          const oldPath = editingMember.avatar_url.split('team-avatars/')[1];
          if (oldPath) {
            await supabase.storage
              .from('team-members')
              .remove([`team-avatars/${oldPath}`]);
          }
        }
      }

      const { error } = await supabase
        .from('team_members')
        .update({
          full_name: formData.full_name,
          position: formData.position,
          description: formData.description,
          avatar_url: avatarUrl,
          display_order: formData.display_order,
          is_active: formData.is_active
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      alert('Team member updated successfully!');
      setShowModal(false);
      setEditingMember(null);
      resetForm();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error updating team member:', error);
      alert('Failed to update team member');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (id: string, avatarUrl: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre de l\'équipe?')) {
      return;
    }

    setLoading(true);

    try {
      // Delete avatar from storage if it exists
      if (avatarUrl && avatarUrl.includes('team-avatars/')) {
        const filePath = avatarUrl.split('team-avatars/')[1];
        if (filePath) {
          await supabase.storage
            .from('team-members')
            .remove([`team-avatars/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('Membre de l\'équipe supprimé avec succès!');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      position: '',
      description: '',
      avatar_url: '',
      display_order: 0,
      is_active: true
    });
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMember(null);
    resetForm();
  };

  // Pagination
  const totalPages = Math.ceil(teamMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMembers = teamMembers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage team members displayed on the About page
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap flex items-center gap-2"
        >
          <i className="ri-add-line"></i>
          Add Team Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-team-line text-2xl text-orange-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-2xl text-green-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="ri-close-circle-line text-2xl text-gray-600"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => !m.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {member.display_order}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {member.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{member.position}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 line-clamp-2 max-w-md">
                      {member.description}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-lg"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, teamMembers.length)} of{' '}
              {teamMembers.length} members
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    currentPage === page
                      ? 'bg-orange-500 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar Image {!editingMember && '*'}
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                        <i className="ri-user-line text-3xl text-gray-400"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 cursor-pointer"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB. {editingMember ? 'Leave empty to keep current image.' : 'Required for new members.'}
                    </p>
                    {uploadingImage && (
                      <p className="mt-2 text-xs text-orange-600 font-medium">
                        <i className="ri-loader-4-line animate-spin mr-1"></i>
                        Uploading image...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active (Display on website)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading || uploadingImage}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || uploadingImage}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i>
                      {editingMember ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editingMember ? 'Update' : 'Add'} Member
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;