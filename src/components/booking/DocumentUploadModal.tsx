import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  onUploadComplete: () => void;
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  professionalId,
  onUploadComplete
}: DocumentUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const documentTypes = [
    { value: 'id_card', label: 'Carte d\'Identité', icon: 'ri-id-card-line' },
    { value: 'passport', label: 'Passeport', icon: 'ri-passport-line' },
    { value: 'certification', label: 'Certification Professionnelle', icon: 'ri-award-line' },
    { value: 'diploma', label: 'Diplôme', icon: 'ri-medal-line' },
    { value: 'business_license', label: 'Licence Commerciale', icon: 'ri-file-text-line' },
    { value: 'other', label: 'Autre Document', icon: 'ri-file-line' }
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Vérifier la taille des fichiers (max 5MB par fichier)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    if (!documentType) {
      setError('Veuillez sélectionner le type de document');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Récupérer l'utilisateur authentifié
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Vous devez être connecté pour télécharger des documents');
      }

      const uploadedDocuments = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${documentType}_${Date.now()}_${i}.${fileExt}`;

        console.log('Upload du fichier:', fileName);

        // Upload vers Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('professional-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erreur upload Storage:', uploadError);
          throw new Error(`Erreur lors du téléchargement: ${uploadError.message}`);
        }

        console.log('Fichier uploadé avec succès:', uploadData);

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('professional-documents')
          .getPublicUrl(fileName);

        console.log('URL publique générée:', publicUrl);

        // Insérer dans la table professional_documents
        const { data: insertData, error: insertError } = await supabase
          .from('professional_documents')
          .insert({
            bucket_id: 'professional-documents',
            name: fileName,
            owner_id: user.id,
            metadata: {
              type: documentType,
              original_name: file.name,
              size: file.size,
              mime_type: file.type
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erreur lors de l\'insertion dans professional_documents:', insertError);
          // Ne pas bloquer le processus si l'insertion échoue
        } else {
          console.log('Document inséré dans la table:', insertData);
        }

        uploadedDocuments.push({
          type: documentType,
          fileName: file.name,
          url: publicUrl,
          uploadedAt: new Date().toISOString()
        });

        // Mettre à jour la progression
        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Récupérer les documents existants
      const { data: professionalData } = await supabase
        .from('professional_profiles')
        .select('verification_documents')
        .eq('id', user.id)
        .single();

      const existingDocs = professionalData?.verification_documents || [];
      const allDocuments = [...existingDocs, ...uploadedDocuments];

      // Mettre à jour le profil professionnel
      const { error: updateError } = await supabase
        .from('professional_profiles')
        .update({
          verification_documents: allDocuments,
          verification_status: 'under_review'
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Erreur mise à jour profil:', updateError);
        throw new Error(`Erreur lors de la mise à jour du profil: ${updateError.message}`);
      }

      console.log('Profil mis à jour avec succès');

      // Créer une notification pour l'admin
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'document_uploaded',
          title: 'Documents de vérification téléchargés',
          message: `${uploadedDocuments.length} document(s) téléchargé(s) pour vérification`,
          created_at: new Date().toISOString()
        });

      console.log('Upload terminé avec succès');
      
      onUploadComplete();
      onClose();
      setSelectedFiles([]);
      setDocumentType('');
    } catch (err: any) {
      console.error('Erreur lors du téléchargement:', err);
      setError(err.message || 'Erreur lors du téléchargement des documents. Veuillez réessayer.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Télécharger des Documents
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Téléchargez vos documents d'identité et certifications pour vérification
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <i className="ri-error-warning-line text-red-600 mr-2"></i>
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Type de document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de Document *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {documentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDocumentType(type.value)}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    documentType === type.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <i className={`${type.icon} text-2xl mb-2 block ${
                    documentType === type.value ? 'text-orange-500' : 'text-gray-600'
                  }`}></i>
                  <span className="text-sm font-medium text-gray-900">
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Zone de téléchargement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Fichiers *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <i className="ri-upload-cloud-2-line text-5xl text-gray-400 mb-3"></i>
                <span className="text-sm font-medium text-gray-900 mb-1">
                  Cliquez pour télécharger ou glissez-déposez
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG, PDF jusqu'à 5MB par fichier
                </span>
              </label>
            </div>
          </div>

          {/* Liste des fichiers sélectionnés */}
          {selectedFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fichiers Sélectionnés ({selectedFiles.length})
              </label>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <i className="ri-file-line text-orange-500 text-xl mr-3 flex-shrink-0"></i>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                      className="ml-3 text-red-600 hover:text-red-700 disabled:opacity-50 flex-shrink-0"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barre de progression */}
          {isUploading && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Téléchargement en cours...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Informations importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="ri-information-line text-blue-600 text-xl mr-3 flex-shrink-0 mt-0.5"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Informations Importantes :</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Les documents doivent être clairs et lisibles</li>
                  <li>Formats acceptés : PNG, JPG, PDF</li>
                  <li>Taille maximale : 5MB par fichier</li>
                  <li>Vos documents seront vérifiés par notre équipe sous 24-48h</li>
                  <li>Vous recevrez une notification une fois la vérification terminée</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0 || !documentType}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
          >
            {isUploading ? (
              <>
                <i className="ri-loader-4-line animate-spin mr-2"></i>
                Téléchargement...
              </>
            ) : (
              <>
                <i className="ri-upload-2-line mr-2"></i>
                Télécharger ({selectedFiles.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
