import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ProfessionalManagement() {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [addForm, setAddForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    address: '',
    service_category: '',
    experience_years: 0,
    hourly_rate: 0,
    description: ''
  });

  const [isExporting, setIsExporting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    fetchProfessionals();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!inner(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur:', error);
      } else {
        setProfessionals(data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des professionnels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les professionnels
  const filteredProfessionals = professionals.filter((professional) => {
    const matchesSearch = 
      professional.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.profiles?.phone?.includes(searchTerm) ||
      professional.service_category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      filterCategory === 'all' || 
      professional.service_category === filterCategory;

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'verified' && professional.profiles?.is_verified) ||
      (filterStatus === 'pending' && !professional.profiles?.is_verified);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleProfessionalStatus = async (professionalId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', professionalId);

      if (!error) {
        fetchProfessionals();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleToggleStatus = async (professionalId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: newStatus })
        .eq('id', professionalId);

      if (!error) {
        fetchProfessionals();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleSuspendClick = (professional: any) => {
    setSelectedProfessional(professional);
    setSuspendReason('');
    setShowSuspendModal(true);
  };

  const handleSuspendConfirm = async () => {
    if (!selectedProfessional || !suspendReason.trim()) {
      alert('Veuillez indiquer une raison pour la suspension');
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ 
          is_suspended: true,
          suspension_reason: suspendReason,
          suspended_at: new Date().toISOString()
        })
        .eq('id', selectedProfessional.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: selectedProfessional.id,
        title: 'Compte suspendu',
        message: `Votre compte a été suspendu. Raison: ${suspendReason}`,
        type: 'warning',
        created_at: new Date().toISOString()
      });

      setProfessionals(prev =>
        prev.map(p =>
          p.id === selectedProfessional.id
            ? { ...p, is_suspended: true, suspension_reason: suspendReason }
            : p
        )
      );

      setShowSuspendModal(false);
      setSelectedProfessional(null);
      setSuspendReason('');
      alert('Professionnel suspendu avec succès');
    } catch (error) {
      console.error('Erreur lors de la suspension:', error);
      alert('Erreur lors de la suspension du professionnel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateClick = async (professional: any) => {
    if (!confirm(`Êtes-vous sûr de vouloir réactiver le compte de ${professional.full_name} ?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('professional_profiles')
        .update({ 
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null
        })
        .eq('id', professional.id);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: professional.id,
        title: 'Compte réactivé',
        message: 'Votre compte a été réactivé. Vous pouvez à nouveau recevoir des réservations.',
        type: 'success',
        created_at: new Date().toISOString()
      });

      setProfessionals(prev =>
        prev.map(p =>
          p.id === professional.id
            ? { ...p, is_suspended: false, suspension_reason: null }
            : p
        )
      );
      
      alert('Professionnel réactivé avec succès');
    } catch (error) {
      console.error('Erreur lors de la réactivation:', error);
      alert('Erreur lors de la réactivation du professionnel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetailsClick = (professional: any) => {
    setSelectedProfessional(professional);
    setShowDetailsModal(true);
  };

  const handleEditClick = (professional: any) => {
    setSelectedProfessional(professional);
    setEditForm({
      full_name: professional.full_name || '',
      phone: professional.phone || '',
      city: professional.city || '',
      address: professional.address || '',
      service_category: professional.professional_profiles?.service_category || '',
      experience_years: professional.professional_profiles?.experience_years || 0,
      hourly_rate: professional.professional_profiles?.hourly_rate || 0,
      description: professional.professional_profiles?.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedProfessional) return;

    setActionLoading(true);
    try {
      // Mise à jour du profil utilisateur
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          city: editForm.city,
          address: editForm.address
        })
        .eq('id', selectedProfessional.id);

      if (profileError) throw profileError;

      // Mise à jour du profil professionnel
      const { error: professionalError } = await supabase
        .from('professional_profiles')
        .update({
          service_category: editForm.service_category,
          experience_years: Number(editForm.experience_years) || 0,
          hourly_rate: Number(editForm.hourly_rate) || 0,
          description: editForm.description
        })
        .eq('id', selectedProfessional.id);

      if (professionalError) throw professionalError;

      // Recharger les données
      await fetchProfessionals();
      
      setShowEditModal(false);
      setSelectedProfessional(null);
      alert('Professionnel modifié avec succès');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification du professionnel');
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
      // Appeler l'Edge Function pour créer le professionnel
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/create-professional`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            full_name: addForm.full_name,
            phone: addForm.phone,
            city: addForm.city,
            address: addForm.address,
            service_category: addForm.service_category,
            experience_years: Number(addForm.experience_years) || 0,
            hourly_rate: Number(addForm.hourly_rate) || 0,
            description: addForm.description
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'ajout');
      }

      await fetchProfessionals();
      setShowAddModal(false);
      setAddForm({
        full_name: '',
        phone: '',
        city: '',
        address: '',
        service_category: '',
        experience_years: 0,
        hourly_rate: 0,
        description: ''
      });
      
      alert(`Professionnel ajouté avec succès!\n\nIdentifiants temporaires:\nEmail: ${result.credentials.email}\nMot de passe: ${result.credentials.password}\n\nVeuillez les communiquer au professionnel.`);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout:', error);
      alert('Erreur lors de l\'ajout du professionnel: ' + (error.message || 'Erreur inconnue'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Récupérer tous les professionnels avec leurs informations
      const { data: professionals, error } = await supabase
        .from('professional_profiles')
        .select(`
          id,
          phone,
          city,
          address,
          service_category,
          experience_years,
          hourly_rate,
          description,
          is_active,
          created_at,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Créer le contenu CSV
      const headers = [
        'ID',
        'Nom complet',
        'Téléphone',
        'Ville',
        'Adresse',
        'Catégorie',
        'Expérience (années)',
        'Tarif horaire (FDJ)',
        'Description',
        'Vérifié',
        'Date d\'inscription'
      ];

      const rows = professionals?.map(prof => [
        prof.id,
        prof.profiles?.full_name || 'N/A',
        prof.phone || 'N/A',
        prof.city || 'N/A',
        prof.address || 'N/A',
        prof.service_category || 'N/A',
        prof.experience_years || '0',
        prof.hourly_rate || '0',
        (prof.description || 'N/A').replace(/\n/g, ' ').replace(/,/g, ';'),
        prof.is_active ? 'Oui' : 'Non',
        new Date(prof.created_at).toLocaleDateString('fr-FR')
      ]) || [];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `professionnels_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleVerifyProfessional = async (professionalId: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !verificationNotes.trim()) {
      alert('Veuillez indiquer une raison pour le refus');
      return;
    }

    if (status === 'approved') {
      setApproveLoading(true);
    } else {
      setRejectLoading(true);
    }

    try {
      console.log('🔄 Début de la vérification:', { professionalId, status });

      // Mettre à jour le profil professionnel
      const { error: professionalError } = await supabase
        .from('professional_profiles')
        .update({
          verification_status: status,
          verification_notes: verificationNotes || null,
          verified_at: status === 'approved' ? new Date().toISOString() : null,
          verified_by: user?.id
        })
        .eq('id', professionalId);

      if (professionalError) {
        console.error('❌ Erreur mise à jour professional_profiles:', professionalError);
        throw professionalError;
      }

      console.log('✅ Profil professionnel mis à jour');

      // Mettre à jour le profil principal (is_verified)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_verified: status === 'approved'
        })
        .eq('id', professionalId);

      if (profileError) {
        console.error('❌ Erreur mise à jour profiles:', profileError);
        throw profileError;
      }

      console.log('✅ Profil principal mis à jour');

      // Créer une notification pour le professionnel
      const notificationMessage = status === 'approved' 
        ? 'Félicitations ! Votre profil a été vérifié avec succès. Vous êtes maintenant visible aux clients et pouvez recevoir des réservations.'
        : `Votre profil n'a pas été vérifié. Raison: ${verificationNotes}. Veuillez télécharger de nouveaux documents conformes.`;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: professionalId,
          type: status === 'approved' ? 'profile_verified' : 'profile_rejected',
          title: status === 'approved' ? 'Profil Vérifié ✓' : 'Vérification Refusée',
          message: notificationMessage,
          created_at: new Date().toISOString()
        });

      if (notificationError) {
        console.error('⚠️ Erreur notification (non bloquante):', notificationError);
      } else {
        console.log('✅ Notification créée');
      }

      // Envoyer un email de notification (optionnel)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        const emailResponse = await fetch(
          `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/email-notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
              to: selectedProfessional.profiles?.email,
              type: status === 'approved' ? 'profile_verified' : 'profile_rejected',
              data: {
                name: selectedProfessional.profiles?.full_name,
                notes: verificationNotes
              }
            })
          }
        );

        if (emailResponse.ok) {
          console.log('✅ Email envoyé');
        } else {
          console.warn('⚠️ Email non envoyé (non bloquant)');
        }
      } catch (emailError) {
        console.error('⚠️ Erreur email (non bloquante):', emailError);
      }

      // Fermer le modal et rafraîchir la liste
      setShowDocuments(false);
      setSelectedProfessional(null);
      setVerificationNotes('');
      
      console.log('🔄 Rafraîchissement de la liste...');
      await fetchProfessionals();
      console.log('✅ Liste rafraîchie');

      // Afficher un message de succès
      const successMessage = status === 'approved' 
        ? `✅ Professionnel approuvé avec succès !\n\n${selectedProfessional.profiles?.full_name} peut maintenant recevoir des réservations.`
        : `❌ Professionnel refusé.\n\nUne notification a été envoyée à ${selectedProfessional.profiles?.full_name}.`;
      
      alert(successMessage);
      
      console.log('✅ Vérification terminée avec succès');
    } catch (err: any) {
      console.error('❌ Erreur lors de la vérification:', err);
      alert(`Erreur lors de la vérification du professionnel: ${err.message || 'Erreur inconnue'}`);
    } finally {
      // Toujours réinitialiser les états de chargement
      setApproveLoading(false);
      setRejectLoading(false);
      console.log('🔄 États de chargement réinitialisés');
    }
  };

  const viewDocuments = async (professional: any) => {
    setSelectedProfessional(professional);
    
    // Charger les documents depuis la table professional_documents
    try {
      const { data: documents, error } = await supabase
        .from('professional_documents')
        .select('*')
        .eq('owner_id', professional.id)
        .eq('bucket_id', 'professional-documents')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
      } else {
        console.log('Documents trouvés:', documents);
        // Enrichir les données du professionnel avec les documents de la table
        setSelectedProfessional({
          ...professional,
          documents_from_table: documents || []
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
    
    setShowDocuments(true);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Professionnels</h2>
          <p className="text-gray-600 mt-1">Gérez les professionnels inscrits sur la plateforme</p>
        </div>
        <div className="flex gap-3">
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

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4">
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
                placeholder="Nom, téléphone, catégorie..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Artisans">Artisans</option>
              <option value="Techniciens">Techniciens</option>
              <option value="Chauffeurs">Chauffeurs</option>
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
              <option value="verified">Vérifiés</option>
              <option value="pending">En attente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des professionnels en cartes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
          {filteredProfessionals.map((professional) => (
            <div key={professional.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <i className="ri-user-star-line text-orange-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{professional.profiles?.full_name || 'Nom non renseigné'}</h3>
                    <p className="text-sm text-gray-600">
                      {professional.service_category || 'Catégorie non spécifiée'}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  professional.profiles?.is_verified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {professional.profiles?.is_verified ? 'Vérifié' : 'En attente'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-phone-line mr-2"></i>
                  {professional.profiles?.phone || 'Non renseigné'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-map-pin-line mr-2"></i>
                  {professional.city || 'Non renseigné'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-time-line mr-2"></i>
                  {professional.experience_years || 0} ans d'expérience
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <i className="ri-money-dollar-circle-line mr-2"></i>
                  {professional.hourly_rate || 0} FDJ/h
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400 text-sm mr-2">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`ri-star-${i < (professional.rating || 0) ? 'fill' : 'line'}`}></i>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  ({professional.total_reviews || 0} avis)
                </span>
              </div>

              {/* Premium Status */}
              {professional.is_premium && (
                <div className="mb-4">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    <i className="ri-crown-line mr-1"></i>
                    Premium
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEditClick(professional)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-1"></i>
                  Modifier
                </button>
                {professional.is_suspended ? (
                  <button
                    onClick={() => handleActivateClick(professional)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Réactiver
                  </button>
                ) : (
                  <button
                    onClick={() => handleSuspendClick(professional)}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Suspendre
                  </button>
                )}
                <button 
                  onClick={() => handleDetailsClick(professional)}
                  className="col-span-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-eye-line mr-1"></i>
                  Voir Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Ajouter un professionnel</h3>
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
                    Catégorie de service
                  </label>
                  <select
                    value={addForm.service_category}
                    onChange={(e) => setAddForm({ ...addForm, service_category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Artisans">Artisans</option>
                    <option value="Techniciens">Techniciens</option>
                    <option value="Chauffeurs">Chauffeurs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={addForm.experience_years}
                    onChange={(e) => setAddForm({ ...addForm, experience_years: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif horaire (FDJ)
                  </label>
                  <input
                    type="number"
                    value={addForm.hourly_rate}
                    onChange={(e) => setAddForm({ ...addForm, hourly_rate: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
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
      {showEditModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Modifier le professionnel</h3>
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
                    Catégorie de service
                  </label>
                  <select
                    value={editForm.service_category}
                    onChange={(e) => setEditForm({ ...editForm, service_category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Artisans">Artisans</option>
                    <option value="Techniciens">Techniciens</option>
                    <option value="Chauffeurs">Chauffeurs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    value={editForm.experience_years}
                    onChange={(e) => setEditForm({ ...editForm, experience_years: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarif horaire (FDJ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editForm.hourly_rate}
                      onChange={(e) => setEditForm({ ...editForm, hourly_rate: e.target.value })}
                      className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                      FDJ
                    </span>
                  </div>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>

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

      {/* Modal de détails */}
      {showDetailsModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Détails du professionnel</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* En-tête du profil */}
              <div className="flex items-center space-x-4 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <i className="ri-user-star-line text-orange-600 text-3xl"></i>
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900">{selectedProfessional.full_name}</h4>
                  <p className="text-gray-600">{selectedProfessional.professional_profiles?.service_category || 'Catégorie non spécifiée'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedProfessional.is_verified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedProfessional.is_verified ? 'Vérifié' : 'En attente'}
                    </span>
                    {selectedProfessional.professional_profiles?.is_premium && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        <i className="ri-crown-line mr-1"></i>
                        Premium
                      </span>
                    )}
                    {selectedProfessional.is_suspended && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        Suspendu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <i className="ri-contacts-line mr-2 text-blue-600"></i>
                  Informations de contact
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Téléphone</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProfessional.phone || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ville</p>
                    <p className="text-sm font-medium text-gray-900">{selectedProfessional.city || 'Non renseigné'}</p>
                  </div>
                  {selectedProfessional.address && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-sm font-medium text-gray-900">{selectedProfessional.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations professionnelles */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <i className="ri-briefcase-line mr-2 text-purple-600"></i>
                  Informations professionnelles
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Années d'expérience</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedProfessional.professional_profiles?.experience_years || 0} ans
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tarif horaire</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedProfessional.professional_profiles?.hourly_rate || 0} FDJ/h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Note moyenne</p>
                    <div className="flex items-center">
                      <i className="ri-star-fill text-yellow-400 mr-1"></i>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedProfessional.professional_profiles?.rating?.toFixed(1) || '0.0'} 
                        ({selectedProfessional.professional_profiles?.total_reviews || 0} avis)
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date d'inscription</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedProfessional.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {selectedProfessional.professional_profiles?.description && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Description</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedProfessional.professional_profiles.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistiques */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-900 flex items-center">
                  <i className="ri-bar-chart-line mr-2 text-teal-600"></i>
                  Statistiques
                </h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedProfessional.professional_profiles?.total_bookings || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Réservations</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedProfessional.professional_profiles?.completed_bookings || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Complétées</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {selectedProfessional.professional_profiles?.total_reviews || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Avis</p>
                  </div>
                </div>
              </div>

              {/* Raison de suspension */}
              {selectedProfessional.is_suspended && selectedProfessional.suspension_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h5 className="font-semibold text-red-900 flex items-center mb-2">
                    <i className="ri-error-warning-line mr-2"></i>
                    Raison de la suspension
                  </h5>
                  <p className="text-sm text-red-800">{selectedProfessional.suspension_reason}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditClick(selectedProfessional);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Modifier
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suspension */}
      {showSuspendModal && selectedProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-error-warning-line text-red-600 text-2xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Suspendre le professionnel
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedProfessional.full_name}
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
                placeholder="Expliquez pourquoi ce professionnel est suspendu..."
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
                    Le professionnel ne pourra plus recevoir de nouvelles réservations.
                    Les réservations en cours ne seront pas affectées.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedProfessional(null);
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

      {/* Tableau des professionnels */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professionnel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catégorie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vérification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfessionals.map((professional) => (
                <tr key={professional.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-user-line text-orange-600"></i>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {professional.profiles?.full_name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {professional.profiles?.phone || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {professional.service_category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      professional.profiles?.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {professional.profiles?.is_verified ? 'Actif' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      professional.verification_status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : professional.verification_status === 'under_review'
                        ? 'bg-blue-100 text-blue-800'
                        : professional.verification_status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {professional.verification_status === 'approved' && 'Vérifié'}
                      {professional.verification_status === 'under_review' && 'En cours'}
                      {professional.verification_status === 'rejected' && 'Refusé'}
                      {professional.verification_status === 'pending' && 'En attente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {professional.verification_documents && 
                     Array.isArray(professional.verification_documents) && 
                     professional.verification_documents.length > 0 ? (
                      <button
                        onClick={() => viewDocuments(professional)}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                      >
                        <i className="ri-eye-line mr-1"></i>
                        {professional.verification_documents.length} doc(s)
                      </button>
                    ) : (
                      <span className="text-sm text-gray-400">Aucun</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-2">
                      {professional.verification_status !== 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedProfessional(professional);
                            setShowDocuments(true);
                          }}
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          Vérifier
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleStatus(professional.id, !professional.profiles?.is_verified)}
                        className={`font-medium ${
                          professional.profiles?.is_verified
                            ? 'text-red-600 hover:text-red-700'
                            : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {professional.profiles?.is_verified ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de vérification des documents */}
      {showDocuments && selectedProfessional && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Vérification du Professionnel
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedProfessional.profiles?.full_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDocuments(false);
                    setSelectedProfessional(null);
                    setVerificationNotes('');
                  }}
                  disabled={approveLoading || rejectLoading}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="ri-close-line text-2xl"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations du professionnel */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Informations du Professionnel
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nom:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.profiles?.full_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.profiles?.phone || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Catégorie:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.service_category}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expérience:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.experience_years} ans
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Ville:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.city || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tarif horaire:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedProfessional.hourly_rate} FDJ/h
                    </span>
                  </div>
                </div>
                {selectedProfessional.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Description:</span>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedProfessional.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Statut actuel */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="ri-information-line text-blue-600 text-xl mr-3 flex-shrink-0"></i>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Statut de Vérification Actuel</p>
                    <p className="text-blue-800">
                      {selectedProfessional.verification_status === 'approved' && '✅ Profil déjà vérifié et approuvé'}
                      {selectedProfessional.verification_status === 'under_review' && '🔍 Vérification en cours'}
                      {selectedProfessional.verification_status === 'rejected' && '❌ Profil refusé précédemment'}
                      {selectedProfessional.verification_status === 'pending' && '⏳ En attente de vérification'}
                    </p>
                    {selectedProfessional.verification_notes && (
                      <p className="text-blue-700 mt-2">
                        <strong>Notes précédentes:</strong> {selectedProfessional.verification_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents depuis la table professional_documents */}
              {selectedProfessional.documents_from_table && 
               selectedProfessional.documents_from_table.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Documents depuis la Table ({selectedProfessional.documents_from_table.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProfessional.documents_from_table.map((doc: any) => {
                      const metadata = doc.metadata || {};
                      const documentType = metadata.type || 'unknown';
                      
                      return (
                        <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center">
                              <i className="ri-file-line text-orange-500 text-xl mr-2"></i>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {documentType === 'id_card' && 'Carte d\'Identité'}
                                  {documentType === 'passport' && 'Passeport'}
                                  {documentType === 'certification' && 'Certification'}
                                  {documentType === 'diploma' && 'Diplôme'}
                                  {documentType === 'business_license' && 'Licence Commerciale'}
                                  {documentType === 'other' && 'Autre Document'}
                                  {documentType === 'unknown' && metadata.original_name || 'Document'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Téléchargé le {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                                </p>
                                {metadata.size && (
                                  <p className="text-xs text-gray-500">
                                    Taille: {(metadata.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const { data } = supabase.storage
                                  .from('professional-documents')
                                  .createSignedUrl(doc.name, 3600); // 3600 secondes = 1 heure
                                
                                if (data?.signedUrl) {
                                  console.log('URL signée générée avec succès');
                                  // Ouvrir le document dans un nouvel onglet
                                  window.open(data.signedUrl, '_blank');
                                }
                              } catch (err) {
                                console.error('Erreur:', err);
                                alert('Une erreur est survenue lors de l\'ouverture du document.');
                              }
                            }}
                            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap"
                          >
                            <i className="ri-eye-line mr-2"></i>
                            Voir le Document
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents téléchargés (depuis verification_documents) */}
              {selectedProfessional.verification_documents && 
               Array.isArray(selectedProfessional.verification_documents) && 
               selectedProfessional.verification_documents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Documents Téléchargés ({selectedProfessional.verification_documents.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProfessional.verification_documents.map((doc: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <i className="ri-file-line text-orange-500 text-xl mr-2"></i>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {doc.type === 'id_card' && 'Carte d\'Identité'}
                                {doc.type === 'passport' && 'Passeport'}
                                {doc.type === 'certification' && 'Certification'}
                                {doc.type === 'diploma' && 'Diplôme'}
                                {doc.type === 'business_license' && 'Licence Commerciale'}
                                {doc.type === 'other' && 'Autre Document'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Téléchargé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // Extraire le chemin du fichier depuis l'URL
                              let filePath = doc.url;
                              
                              // Si c'est une URL complète, extraire juste le chemin
                              if (filePath.includes('/storage/v1/object/')) {
                                const parts = filePath.split('/storage/v1/object/public/professional-documents/');
                                if (parts.length > 1) {
                                  filePath = parts[1];
                                }
                              }
                              
                              console.log('Chemin du fichier:', filePath);
                              
                              // Générer une URL signée temporaire (valide 1 heure)
                              const { data, error } = await supabase.storage
                                .from('professional-documents')
                                .createSignedUrl(filePath, 3600);
                              
                              if (error) {
                                console.error('Erreur lors de la génération de l\'URL signée:', error);
                                alert('Impossible de charger le document. Veuillez réessayer.');
                                return;
                              }
                              
                              if (data?.signedUrl) {
                                console.log('URL signée générée avec succès');
                                window.open(data.signedUrl, '_blank');
                              }
                            } catch (err) {
                              console.error('Erreur:', err);
                              alert('Une erreur est survenue lors de l\'ouverture du document.');
                            }
                          }}
                          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center whitespace-nowrap"
                        >
                          <i className="ri-eye-line mr-2"></i>
                          Voir le Document
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aucun document */}
              {(!selectedProfessional.verification_documents || selectedProfessional.verification_documents.length === 0) &&
               (!selectedProfessional.documents_from_table || selectedProfessional.documents_from_table.length === 0) && (
                <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-300">
                  <i className="ri-file-line text-4xl text-gray-400 mb-4"></i>
                  <p className="text-gray-600">Aucun document téléchargé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Le professionnel n'a pas encore téléchargé de documents de vérification
                  </p>
                </div>
              )}

              {/* Notes de vérification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes de Vérification
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-gray-500 font-normal ml-2">(Requis pour le refus)</span>
                </label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ajoutez des notes sur la vérification (optionnel pour approbation, requis pour refus)&#10;&#10;Exemples:&#10;- Documents conformes, profil vérifié&#10;- Documents illisibles, veuillez télécharger de nouvelles photos&#10;- Informations incohérentes entre les documents"
                  disabled={approveLoading || rejectLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {verificationNotes.length} caractères
                </p>
              </div>

              {/* Avertissement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <i className="ri-alert-line text-yellow-600 text-xl mr-3 flex-shrink-0"></i>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>L'approbation rendra le professionnel visible aux clients</li>
                      <li>Le professionnel recevra une notification par email et dans l'application</li>
                      <li>En cas de refus, le professionnel devra télécharger de nouveaux documents</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDocuments(false);
                  setSelectedProfessional(null);
                  setVerificationNotes('');
                }}
                disabled={approveLoading || rejectLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={() => handleVerifyProfessional(selectedProfessional.id, 'rejected')}
                disabled={!verificationNotes.trim() || approveLoading || rejectLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center whitespace-nowrap"
              >
                {rejectLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Refus en cours...
                  </>
                ) : (
                  <>
                    <i className="ri-close-circle-line mr-2"></i>
                    Refuser
                  </>
                )}
              </button>
              <button
                onClick={() => handleVerifyProfessional(selectedProfessional.id, 'approved')}
                disabled={approveLoading || rejectLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center whitespace-nowrap"
              >
                {approveLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Approbation en cours...
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line mr-2"></i>
                    Approuver
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {professionals.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <i className="ri-user-star-line text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">Aucun professionnel trouvé</p>
        </div>
      )}
    </div>
  );
}
