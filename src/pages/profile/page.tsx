import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/feature/Header';
import Footer from '../../components/feature/Footer';
import LoadingSpinner from '../../components/base/LoadingSpinner';
import AuthModal from '../../components/auth/AuthModal';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    city: profile?.city || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || ''
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{
    hasTemp: boolean;
    expiresAt: Date | null;
    hoursRemaining: number;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, professional_profiles(*)')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile(data);
          
          // Vérifier le mot de passe temporaire
          if (data.temp_password_expires_at) {
            const expiryDate = new Date(data.temp_password_expires_at);
            const now = new Date();
            const hoursRemaining = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            setTempPasswordInfo({
              hasTemp: true,
              expiresAt: expiryDate,
              hoursRemaining: Math.max(0, hoursRemaining),
            });
            
            // Ouvrir automatiquement le changement de mot de passe si moins de 6h
            if (hoursRemaining < 6) {
              setShowPasswordChange(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, afficher la modale de connexion
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [loading, user]);

  const fetchUserData = async () => {
    try {
      // Fetch bookings with explicit relationship specification
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services(title, category),
          profiles!bookings_professional_id_fkey(full_name)
        `)
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        setError('Failed to fetch bookings');
        return;
      }

      // Fetch reviews given by user with explicit relationship
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_professional_id_fkey(full_name),
          services(title)
        `)
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setError('Failed to fetch reviews');
        return;
      }

      setBookings(bookingsData || []);
      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to fetch user data');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('📝 Envoi des données du profil:', formData);
      
      const { data, error } = await updateProfile(formData);
      
      if (error) {
        console.error('❌ Erreur de mise à jour:', error);
        setError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
      } else {
        console.log('✅ Profil mis à jour avec succès:', data);
        setSuccessMessage('Profil mis à jour avec succès !');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('❌ Erreur inattendue:', err);
      setError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      // Supprimer l'expiration du mot de passe temporaire
      await supabase
        .from('profiles')
        .update({ temp_password_expires_at: null })
        .eq('id', user?.id);

      alert('✅ Mot de passe changé avec succès !');
      setShowPasswordChange(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTempPasswordInfo(null);
    } catch (error: any) {
      alert('Erreur : ' + error.message);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 5MB');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);
    
    try {
      console.log('📤 Téléchargement de l\'avatar...');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      // Supprimer l'ancien avatar s'il existe
      if (formData.avatar_url && formData.avatar_url.includes('avatars')) {
        try {
          const oldPath = formData.avatar_url.split('/avatars/').pop()?.split('?')[0];
          if (oldPath) {
            console.log('🗑️ Suppression de l\'ancien avatar:', oldPath);
            await supabase.storage
              .from('avatars')
              .remove([oldPath]);
          }
        } catch (deleteError) {
          console.log('⚠️ Ancien avatar non trouvé ou déjà supprimé');
        }
      }

      // Télécharger le nouveau fichier
      console.log('⬆️ Upload du fichier:', filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Erreur d\'upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ Fichier uploadé:', uploadData);

      // Obtenir l'URL publique avec timestamp pour éviter le cache
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;
      console.log('🔗 URL publique:', publicUrlWithTimestamp);

      // Mettre à jour le profil avec la nouvelle URL
      console.log('💾 Mise à jour du profil avec la nouvelle URL...');
      const { data: updateData, error: updateError } = await updateProfile({ 
        avatar_url: publicUrlWithTimestamp 
      });

      if (updateError) {
        console.error('❌ Erreur de mise à jour du profil:', updateError);
        throw updateError;
      }

      console.log('✅ Profil mis à jour:', updateData);

      // Mettre à jour l'état local immédiatement
      setFormData({ ...formData, avatar_url: publicUrlWithTimestamp });
      
      setSuccessMessage('Photo de profil mise à jour avec succès !');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Forcer le rechargement de l'image
      setTimeout(() => {
        const imgElements = document.querySelectorAll('img[src*="avatars"]');
        imgElements.forEach((img: any) => {
          const currentSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = publicUrlWithTimestamp;
          }, 10);
        });
      }, 100);
      
    } catch (err: any) {
      console.error('❌ Erreur lors du téléchargement:', err);
      setError(err.message || 'Erreur lors du téléchargement de l\'image');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; color: string } } = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    totalBookings: bookings.length,
    completedBookings: bookings.filter(b => b.status === 'completed').length,
    totalSpent: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0),
    reviewsGiven: reviews.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Si pas d'utilisateur, afficher la modale de connexion
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border p-8 text-center">
            <i className="ri-user-line text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connexion requise</h2>
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour accéder à votre profil
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium whitespace-nowrap"
            >
              Se connecter
            </button>
          </div>
        </main>
        <Footer />
        
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Alerte mot de passe temporaire */}
        {tempPasswordInfo?.hasTemp && tempPasswordInfo.hoursRemaining > 0 && (
          <div className={`mb-6 rounded-xl shadow-lg overflow-hidden ${
            tempPasswordInfo.hoursRemaining < 1 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : tempPasswordInfo.hoursRemaining < 6
              ? 'bg-gradient-to-r from-orange-500 to-orange-600'
              : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
          }`}>
            <div className="p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <i className={`${
                    tempPasswordInfo.hoursRemaining < 1 
                      ? 'ri-error-warning-fill' 
                      : 'ri-alarm-warning-fill'
                  } text-4xl`}></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">
                    {tempPasswordInfo.hoursRemaining < 1 
                      ? '🚨 URGENT : Changez votre mot de passe maintenant !' 
                      : '⚠️ Vous utilisez un mot de passe temporaire'}
                  </h3>
                  <p className="text-sm opacity-95 mb-4">
                    {tempPasswordInfo.hoursRemaining < 1 
                      ? `Votre mot de passe temporaire expire dans ${Math.floor(tempPasswordInfo.hoursRemaining * 60)} minutes. Changez-le immédiatement pour ne pas perdre l'accès à votre compte.`
                      : `Votre mot de passe temporaire expire dans ${Math.floor(tempPasswordInfo.hoursRemaining)} heures. Pour sécuriser votre compte, changez-le dès maintenant.`
                    }
                  </p>
                  {!showPasswordChange && (
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="bg-white text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
                    >
                      Changer mon mot de passe
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Picture */}
              <div className="relative">
                {formData.avatar_url ? (
                  <img
                    key={formData.avatar_url}
                    src={formData.avatar_url}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-orange-100"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23fed7aa" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="40" text-anchor="middle" dy=".3em" fill="%23f97316"%3E%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center border-4 border-orange-200">
                    <i className="ri-user-line text-orange-500 text-4xl"></i>
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer shadow-lg">
                  {isUploadingAvatar ? (
                    <i className="ri-loader-4-line animate-spin text-lg"></i>
                  ) : (
                    <i className="ri-camera-line text-lg"></i>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile?.full_name || 'Your Name'}
                </h1>
                <p className="text-gray-600 mb-4">{user.email}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <i className="ri-map-pin-line text-gray-400"></i>
                    <span className="text-gray-600">
                      {profile?.city || 'Location not set'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="ri-phone-line text-gray-400"></i>
                    <span className="text-gray-600">
                      {profile?.phone || 'Phone not set'}
                    </span>
                  </div>
                  {profile?.is_verified && (
                    <div className="flex items-center space-x-2">
                      <i className="ri-verified-badge-fill text-blue-500"></i>
                      <span className="text-blue-600 font-medium">Verified</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
                    <p className="text-sm text-gray-600">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSpent.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Spent (DJF)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.reviewsGiven}</p>
                    <p className="text-sm text-gray-600">Reviews Given</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === 'profile'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-user-line mr-2"></i>
                  Profile Settings
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === 'bookings'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-calendar-line mr-2"></i>
                  My Bookings
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === 'reviews'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-star-line mr-2"></i>
                  My Reviews
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 ${
                    activeTab === 'security'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <i className="ri-shield-line mr-2"></i>
                  Security
                </button>
              </nav>
            </div>

            <div className="p-8">
              {/* Profile Settings Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-error-warning-line text-red-600 mr-2"></i>
                        <span className="text-red-700">{error}</span>
                      </div>
                    </div>
                  )}

                  {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-check-line text-green-600 mr-2"></i>
                        <span className="text-green-700">{successMessage}</span>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Email address cannot be changed for security reasons
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="+253 XX XX XX XX"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select a city</option>
                          <option value="Djibouti">Djibouti</option>
                          <option value="Ali Sabieh">Ali Sabieh</option>
                          <option value="Dikhil">Dikhil</option>
                          <option value="Tadjourah">Tadjourah</option>
                          <option value="Obock">Obock</option>
                          <option value="Arta">Arta</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your complete address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        placeholder="Tell us about yourself..."
                        maxLength={500}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.bio.length}/500 characters
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <i className="ri-loader-4-line animate-spin mr-2"></i>
                            Updating...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <i className="ri-save-line mr-2"></i>
                            Save Changes
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
                  
                  {bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.services?.title}
                              </h3>
                              <p className="text-gray-600">
                                Professional: {booking.profiles?.full_name}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {formatDate(booking.scheduled_date)}
                              </p>
                            </div>
                            <div className="mt-4 md:mt-0 text-right">
                              {getStatusBadge(booking.status)}
                              <p className="text-xl font-bold text-gray-900 mt-2">
                                {parseFloat(booking.total_amount || 0).toLocaleString()} DJF
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-gray-600 flex items-center">
                              <i className="ri-map-pin-line mr-1"></i>
                              {booking.address}
                            </p>
                            <div className="flex space-x-3">
                              {booking.status === 'completed' && (
                                <button className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                                  Leave Review
                                </button>
                              )}
                              {booking.status === 'pending' && (
                                <button className="text-sm text-red-600 hover:text-red-700 font-medium">
                                  Cancel Booking
                                </button>
                              )}
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <i className="ri-calendar-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
                      <p className="text-gray-600 mb-6">
                        Start exploring our professional services
                      </p>
                      <button className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                        <i className="ri-search-line mr-2"></i>
                        Browse Services
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Reviews</h2>
                  
                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Review for {review.profiles?.full_name}
                              </h3>
                              <p className="text-gray-600">{review.services?.title}</p>
                            </div>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`ri-star-${i < review.rating ? 'fill' : 'line'} text-yellow-400`}
                                ></i>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-4">{review.comment}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <i className="ri-star-line text-6xl text-gray-300 mb-4"></i>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews given yet</h3>
                      <p className="text-gray-600">
                        Complete a service to leave your first review
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-8">
                    {/* Account Status */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Email Verification</span>
                          <div className={`flex items-center ${profile?.is_verified ? 'text-green-600' : 'text-orange-600'}`}>
                            <i className={`${profile?.is_verified ? 'ri-check-line' : 'ri-time-line'} mr-1`}></i>
                            <span className="font-medium">
                              {profile?.is_verified ? 'Verified' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">Two-Factor Authentication</span>
                          <div className="flex items-center text-gray-500">
                            <i className="ri-close-line mr-1"></i>
                            <span className="font-medium">Not Enabled</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Change */}
                    <div className="border border-gray-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                      <p className="text-gray-600 mb-6">
                        Update your password to keep your account secure
                      </p>
                      <button className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium">
                        <i className="ri-key-line mr-2"></i>
                        Change Password
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">Delete Account</h3>
                      <p className="text-red-700 mb-6">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium">
                        <i className="ri-delete-bin-line mr-2"></i>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section Changement de mot de passe */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <i className="ri-lock-password-line text-2xl text-teal-600"></i>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Changer le mot de passe
                  </h3>
                  {tempPasswordInfo?.hasTemp && (
                    <p className="text-sm text-orange-600 font-medium">
                      ⚠️ Mot de passe temporaire actif
                    </p>
                  )}
                </div>
              </div>
              <i className={`ri-arrow-${showPasswordChange ? 'up' : 'down'}-s-line text-2xl text-gray-400`}></i>
            </button>

            {showPasswordChange && (
              <div className="px-8 pb-8">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {tempPasswordInfo?.hasTemp && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <i className="ri-information-fill text-blue-600 text-xl mt-0.5"></i>
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">Vous utilisez un mot de passe temporaire</p>
                          <p>Vous n'avez pas besoin d'entrer votre mot de passe actuel. Créez simplement un nouveau mot de passe sécurisé.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!tempPasswordInfo?.hasTemp && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      required
                      minLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    Changer le mot de passe
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
