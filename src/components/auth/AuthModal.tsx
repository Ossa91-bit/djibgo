import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'reset-password' | 'resend-confirmation'>(defaultMode);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    userType: 'client' as 'client' | 'professional'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetMethod, setResetMethod] = useState<'email' | 'whatsapp'>('email');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // ✅ Trim whitespace from email and password before submit
      const trimmedEmail = formData.email.trim();
      const trimmedPassword = formData.password.trim();

      // ✅ Validate inputs
      if (!trimmedEmail || !trimmedPassword) {
        setError('Please enter both email and password.');
        setIsLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        console.log('✅ Connexion réussie pour:', data.user.id);
        
        // Vérifier le profil et le type d'utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, temporary_password_expires_at')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('❌ Erreur profil:', profileError);
        }

        // Vérifier si c'est un mot de passe temporaire expiré
        if (profile?.temporary_password_expires_at) {
          const expiresAt = new Date(profile.temporary_password_expires_at);
          const now = new Date();
          
          if (now > expiresAt) {
            // Mot de passe temporaire expiré
            await supabase.auth.signOut();
            setError('Votre mot de passe temporaire a expiré. Veuillez en demander un nouveau.');
            setIsLoading(false);
            return;
          }
        }

        // Vérifier si c'est un admin
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        // Fermer le modal
        onClose();

        // Attendre un peu pour que le modal se ferme
        await new Promise(resolve => setTimeout(resolve, 300));

        // Rediriger vers le bon dashboard
        if (adminData) {
          console.log('🔐 Redirection vers admin dashboard');
          window.location.href = '/admin-dashboard';
        } else {
          console.log('👤 Redirection vers dashboard utilisateur');
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      console.error('❌ Erreur connexion:', err);
      
      if (err.message.includes('Invalid login credentials')) {
        setError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.');
      } else {
        setError(err.message || 'Erreur lors de la connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // ✅ Trim whitespace from all inputs
      const trimmedFullName = formData.fullName.trim();
      const trimmedEmail = formData.email.trim();
      const trimmedPhone = formData.phone.trim();
      const trimmedPassword = formData.password.trim();

      console.log('📝 Début de l\'inscription...', {
        email: trimmedEmail,
        userType: formData.userType
      });

      // Validation des données
      if (!trimmedFullName || trimmedFullName.length < 2) {
        setError('Le nom complet doit contenir au moins 2 caractères.');
        setIsLoading(false);
        return;
      }

      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setError('Veuillez entrer une adresse email valide.');
        setIsLoading(false);
        return;
      }

      // ✅ Allow numeric-only passwords (for temporary codes)
      if (!trimmedPassword || trimmedPassword.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
        setIsLoading(false);
        return;
      }

      // Inscription avec les métadonnées utilisateur
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: trimmedFullName,
            phone: trimmedPhone,
            user_type: formData.userType,
            is_verified: false
          }
        }
      });

      if (error) {
        console.error('❌ Erreur d\'inscription:', error);
        
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setError('Cette adresse email existe déjà. Si vous avez oublié votre mot de passe, utilisez "Mot de passe oublié".');
        } else if (error.message.includes('Invalid email')) {
          setError('Adresse email invalide. Veuillez vérifier votre email.');
        } else if (error.message.includes('Password')) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
        } else {
          setError('Erreur lors de l\'inscription: ' + error.message);
        }
      } else if (data?.user) {
        console.log('✅ Inscription réussie pour:', data.user.id);
        
        // Vérifier si l'utilisateur doit confirmer son email
        if (data.user.identities && data.user.identities.length === 0) {
          setSuccessMessage('Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte mail (et vos spams).');
        } else if (!data.session) {
          setSuccessMessage('Votre compte a été créé ! Un email de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte mail (et vos spams) pour activer votre compte.');
        } else {
          // Connexion immédiate (confirmation désactivée)
          setSuccessMessage('Votre compte a été créé avec succès ! Redirection vers votre tableau de bord...');
          
          // Attendre un peu pour que le profil soit créé
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Vérifier que le profil existe avant de rediriger
          const { data: profileCheck } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();

          if (!profileCheck) {
            console.warn('⚠️ Profil non trouvé après inscription, tentative de création...');
            // Attendre encore un peu
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Rediriger vers le dashboard
          onClose();
          window.location.href = '/dashboard';
        }
        
        setFormData({
          email: '',
          password: '',
          fullName: '',
          phone: '',
          userType: 'client'
        });
      }
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'inscription:', err);
      setError('Erreur lors de l\'inscription. Veuillez réessayer dans quelques instants.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // ✅ Trim whitespace from inputs
      const trimmedEmail = formData.email.trim();
      const trimmedPhone = formData.phone.trim();

      if (resetMethod === 'email') {
        // Réinitialisation par email (méthode classique)
        const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setError(error.message);
        } else {
          setSuccessMessage('Un email de réinitialisation a été envoyé à votre adresse.');
        }
      } else {
        // Réinitialisation par WhatsApp (mot de passe temporaire)
        if (!trimmedPhone) {
          setError('Veuillez entrer votre numéro de téléphone.');
          setIsLoading(false);
          return;
        }

        // Appeler l'Edge Function pour générer et envoyer le mot de passe temporaire
        const { data, error } = await supabase.functions.invoke('send-temporary-password-whatsapp', {
          body: { 
            email: trimmedEmail,
            phone: trimmedPhone 
          }
        });

        if (error) {
          setError(error.message || 'Erreur lors de l\'envoi du mot de passe temporaire.');
        } else if (data?.whatsappUrl) {
          // Ouvrir WhatsApp avec le message pré-rempli
          window.open(data.whatsappUrl, '_blank');
          setSuccessMessage(`Un mot de passe temporaire a été envoyé sur WhatsApp au ${data.phone}. Cliquez sur le lien pour ouvrir WhatsApp.`);
        } else {
          setSuccessMessage('Mot de passe temporaire généré avec succès. Vérifiez votre WhatsApp.');
        }
      }
    } catch (err: any) {
      setError('Erreur lors de la réinitialisation. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Votre mot de passe ou code temporaire"
            required
            inputMode="text"
            autoComplete="current-password"
          />
          <p className="text-xs text-gray-500 mt-1">
            Entrez votre mot de passe habituel ou le code à 6 chiffres reçu par WhatsApp
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Connexion...
            </span>
          ) : (
            'Se connecter'
          )}
        </button>

        <div className="flex justify-between items-center text-sm">
          <button
            type="button"
            onClick={() => setMode('reset-password')}
            className="text-orange-500 hover:text-orange-600 font-medium whitespace-nowrap"
          >
            Mot de passe oublié ?
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className="text-orange-500 hover:text-orange-600 font-medium whitespace-nowrap"
          >
            Créer un compte
          </button>
        </div>
      </form>
    </div>
  );

  const renderRegisterForm = () => (
    <div className="space-y-4">
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Votre nom complet"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="votre@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="+253 XX XX XX XX"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Minimum 6 caractères"
            required
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de compte
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, userType: 'client' })}
              className={`p-3 border rounded-md text-center transition-colors ${
                formData.userType === 'client'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <i className="ri-user-line text-lg mb-1 block"></i>
              Client
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, userType: 'professional' })}
              className={`p-3 border rounded-md text-center transition-colors ${
                formData.userType === 'professional'
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <i className="ri-briefcase-line text-lg mb-1 block"></i>
              Professionnel
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Création du compte...
            </span>
          ) : (
            'Créer mon compte'
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode('login')}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium whitespace-nowrap"
          >
            Déjà un compte ? Se connecter
          </button>
        </div>
      </form>
    </div>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      {/* Sélection de la méthode de réinitialisation */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Méthode de réinitialisation
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setResetMethod('email')}
            className={`p-3 border rounded-lg text-center transition-all ${
              resetMethod === 'email'
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <i className="ri-mail-line text-xl mb-1 block"></i>
            <span className="text-sm font-medium">Par Email</span>
          </button>
          <button
            type="button"
            onClick={() => setResetMethod('whatsapp')}
            className={`p-3 border rounded-lg text-center transition-all ${
              resetMethod === 'whatsapp'
                ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <i className="ri-whatsapp-line text-xl mb-1 block"></i>
            <span className="text-sm font-medium">Par WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Champ Email (toujours visible) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="ri-mail-line text-gray-400"></i>
          </div>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="votre@email.com"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {resetMethod === 'email' 
            ? 'Un lien de réinitialisation sera envoyé à cette adresse'
            : 'Email associé à votre compte'}
        </p>
      </div>

      {/* Champ Téléphone (visible uniquement pour WhatsApp) */}
      {resetMethod === 'whatsapp' && (
        <div className="animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de téléphone
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="ri-phone-line text-gray-400"></i>
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="+253 XX XX XX XX"
              required={resetMethod === 'whatsapp'}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Un mot de passe temporaire sera envoyé sur WhatsApp
          </p>
        </div>
      )}

      {/* Message d'information selon la méthode */}
      <div className={`p-3 rounded-lg border ${
        resetMethod === 'email' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start">
          <i className={`${
            resetMethod === 'email' 
              ? 'ri-information-line text-blue-600' 
              : 'ri-whatsapp-line text-green-600'
          } text-lg mr-2 mt-0.5`}></i>
          <div className="text-sm">
            {resetMethod === 'email' ? (
              <>
                <p className="text-blue-800 font-medium mb-1">Réinitialisation par email</p>
                <p className="text-blue-700">
                  Vous recevrez un lien pour créer un nouveau mot de passe. Le lien est valide pendant 1 heure.
                </p>
              </>
            ) : (
              <>
                <p className="text-green-800 font-medium mb-1">Mot de passe temporaire par WhatsApp</p>
                <p className="text-green-700">
                  Vous recevrez un code à 6 chiffres valide pendant 24 heures. Connectez-vous avec ce code puis changez votre mot de passe.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap shadow-lg transition-all"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <i className="ri-loader-4-line animate-spin mr-2"></i>
            Envoi en cours...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <i className={`${resetMethod === 'email' ? 'ri-mail-send-line' : 'ri-whatsapp-line'} mr-2`}></i>
            {resetMethod === 'email' ? 'Envoyer le lien par email' : 'Recevoir par WhatsApp'}
          </span>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium whitespace-nowrap"
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  );

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Cette adresse email est déjà confirmée. Vous pouvez vous connecter.');
        } else {
          setError(error.message);
        }
      } else {
        setSuccessMessage('Un nouveau lien de confirmation a été envoyé à votre adresse email.');
      }
    } catch (err: any) {
      setError('Erreur lors de l\'envoi du lien. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderResendConfirmationForm = () => (
    <form onSubmit={handleResendConfirmation} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="votre@email.com"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <i className="ri-loader-4-line animate-spin mr-2"></i>
            Envoi en cours...
          </span>
        ) : (
          'Renvoyer le lien de confirmation'
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-orange-500 hover:text-orange-600 text-sm font-medium whitespace-nowrap"
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  );

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Connexion à DjibGo';
      case 'register':
        return 'Créer un compte DjibGo';
      case 'reset-password':
        return 'Réinitialiser le mot de passe';
      case 'resend-confirmation':
        return 'Renvoyer la confirmation';
      default:
        return 'DjibGo';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`bg-white rounded-lg p-6 w-full max-w-md mx-4 transform transition-transform ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-600 mr-2"></i>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            {error.includes('lien de confirmation') && (
              <button
                onClick={() => setMode('resend-confirmation')}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium mt-2 block whitespace-nowrap"
              >
                Renvoyer le lien de confirmation
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <i className="ri-check-line text-green-600 mr-2"></i>
              <span className="text-green-700 text-sm">{successMessage}</span>
            </div>
          </div>
        )}

        {mode === 'login' && renderLoginForm()}
        {mode === 'register' && renderRegisterForm()}
        {mode === 'reset-password' && renderResetPasswordForm()}
        {mode === 'resend-confirmation' && renderResendConfirmationForm()}
      </div>
    </div>
  );
}