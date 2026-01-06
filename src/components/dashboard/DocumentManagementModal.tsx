import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DocumentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  onDocumentDeleted: () => void;
}

interface Document {
  id: string;
  bucket_id: string;
  name: string;
  owner_id: string;
  created_at: string;
  metadata: {
    type: string;
    original_name: string;
    size: number;
    mime_type: string;
  };
}

export default function DocumentManagementModal({
  isOpen,
  onClose,
  professionalId,
  onDocumentDeleted
}: DocumentManagementModalProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      fetchProfessionalProfile();
    }
  }, [isOpen, professionalId]);

  const fetchProfessionalProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('verification_status, verification_notes')
        .eq('user_id', professionalId)
        .single();

      if (!error && data) {
        setProfessionalProfile(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
    }
  };

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer les documents depuis la table professional_documents
      const { data, error } = await supabase
        .from('professional_documents')
        .select('*')
        .eq('owner_id', professionalId)
        .eq('bucket_id', 'professional-documents')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors du chargement des documents:', error);
        throw error;
      }

      setDocuments(data || []);
    } catch (err: any) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      return;
    }

    setDeletingDocId(doc.id);
    setError(null);

    try {
      // Supprimer le fichier du Storage
      const { error: storageError } = await supabase.storage
        .from('professional-documents')
        .remove([doc.name]);

      if (storageError) {
        console.error('Erreur suppression Storage:', storageError);
        throw new Error('Erreur lors de la suppression du fichier');
      }

      // Supprimer l'entrée de la table
      const { error: dbError } = await supabase
        .from('professional_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) {
        console.error('Erreur suppression DB:', dbError);
        throw new Error('Erreur lors de la suppression de l\'enregistrement');
      }

      // Mettre à jour la liste locale
      setDocuments(prev => prev.filter(d => d.id !== doc.id));

      // Vérifier s'il reste des documents
      const remainingDocs = documents.filter(d => d.id !== doc.id);
      
      // Si plus de documents, mettre à jour le statut du profil
      if (remainingDocs.length === 0) {
        await supabase
          .from('professional_profiles')
          .update({
            verification_status: 'pending',
            verification_notes: null
          })
          .eq('user_id', professionalId);
      }

      onDocumentDeleted();
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Erreur lors de la suppression du document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      // Extraire le chemin du fichier depuis le nom
      const filePath = document.name;
      
      // Générer une URL signée temporaire (valide 1 heure)
      const { data, error } = await supabase.storage
        .from('professional-documents')
        .createSignedUrl(filePath, 3600); // 3600 secondes = 1 heure

      if (error) {
        console.error('Erreur lors de la génération de l\'URL signée:', error);
        alert('Impossible de charger le document. Veuillez réessayer.');
        return;
      }

      if (data?.signedUrl) {
        // Ouvrir le document dans un nouvel onglet
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue lors de l\'ouverture du document.');
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      id_card: 'Carte d\'Identité',
      passport: 'Passeport',
      certification: 'Certification Professionnelle',
      diploma: 'Diplôme',
      business_license: 'Licence Commerciale',
      other: 'Autre Document'
    };
    return types[type] || type;
  };

  const getDocumentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      id_card: 'ri-id-card-line',
      passport: 'ri-passport-line',
      certification: 'ri-award-line',
      diploma: 'ri-medal-line',
      business_license: 'ri-file-text-line',
      other: 'ri-file-line'
    };
    return icons[type] || 'ri-file-line';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationStatusBadge = () => {
    if (!professionalProfile?.verification_status) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          En Attente
        </span>
      );
    }

    const statusConfig: { [key: string]: { label: string; color: string } } = {
      pending: { label: 'En Attente', color: 'bg-yellow-100 text-yellow-800' },
      under_review: { label: 'En Cours de Vérification', color: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Approuvé ✓', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Refusé', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[professionalProfile.verification_status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Mes Documents
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Gérez vos documents de vérification
              </p>
              <div className="mt-3 flex items-center space-x-3">
                <span className="text-sm text-gray-700 font-medium">Statut :</span>
                {getVerificationStatusBadge()}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-600 mr-2"></i>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Notes de vérification si refusé */}
          {professionalProfile?.verification_status === 'rejected' && professionalProfile?.verification_notes && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <i className="ri-error-warning-line text-red-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Raison du Refus</h3>
                  <p className="text-sm text-red-700">{professionalProfile.verification_notes}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Veuillez supprimer les documents non conformes et télécharger de nouveaux documents.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statut en cours de vérification */}
          {professionalProfile?.verification_status === 'under_review' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <i className="ri-time-line text-blue-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Vérification en Cours</h3>
                  <p className="text-sm text-blue-700">
                    Vos documents sont en cours de vérification par notre équipe. Vous serez notifié sous 24-48h.
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Vous ne pouvez pas modifier ou supprimer vos documents pendant la vérification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Statut approuvé */}
          {professionalProfile?.verification_status === 'approved' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <i className="ri-checkbox-circle-line text-green-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Profil Vérifié ✓</h3>
                  <p className="text-sm text-green-700">
                    Vos documents ont été approuvés. Votre profil est maintenant vérifié et visible aux clients.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <i className="ri-loader-4-line animate-spin text-4xl text-orange-500"></i>
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Documents Téléchargés ({documents.length})
              </h3>
              
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i className={`${getDocumentIcon(doc.metadata?.type)} text-orange-500 text-2xl`}></i>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {getDocumentTypeLabel(doc.metadata?.type)}
                          </h4>
                          {professionalProfile?.verification_status === 'approved' && (
                            <i className="ri-checkbox-circle-fill text-green-500" title="Document approuvé"></i>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {doc.metadata?.original_name || doc.name}
                        </p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <i className="ri-file-line mr-1"></i>
                            {formatFileSize(doc.metadata?.size || 0)}
                          </span>
                          <span className="flex items-center">
                            <i className="ri-calendar-line mr-1"></i>
                            {formatDate(doc.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir le document"
                      >
                        <i className="ri-eye-line text-lg"></i>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        disabled={
                          deletingDocId === doc.id || 
                          professionalProfile?.verification_status === 'under_review' ||
                          professionalProfile?.verification_status === 'approved'
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={
                          professionalProfile?.verification_status === 'under_review'
                            ? 'Impossible de supprimer pendant la vérification'
                            : professionalProfile?.verification_status === 'approved'
                            ? 'Impossible de supprimer un document approuvé'
                            : 'Supprimer le document'
                        }
                      >
                        {deletingDocId === doc.id ? (
                          <i className="ri-loader-4-line animate-spin text-lg"></i>
                        ) : (
                          <i className="ri-delete-bin-line text-lg"></i>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="ri-file-line text-5xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 font-medium">Aucun document téléchargé</p>
              <p className="text-sm text-gray-400 mt-2">
                Téléchargez vos documents pour commencer la vérification
              </p>
            </div>
          )}

          {/* Informations importantes */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Informations Importantes :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Vous pouvez supprimer vos documents uniquement s'ils ne sont pas en cours de vérification</li>
                  <li>Les documents approuvés ne peuvent pas être supprimés</li>
                  <li>Si vos documents sont refusés, supprimez-les et téléchargez de nouveaux documents conformes</li>
                  <li>La vérification prend généralement 24-48 heures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
