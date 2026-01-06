-- ============================================
-- TRIGGER DE SYNCHRONISATION AUTOMATIQUE
-- ============================================
-- Ce trigger crée automatiquement les profils dans les tables
-- profiles et professional_profiles quand un utilisateur s'inscrit
-- via Supabase Auth
-- ============================================

-- Créer une fonction pour gérer automatiquement la création des profils
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Récupérer le type d'utilisateur avec une valeur par défaut
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'client');
  
  -- Récupérer le prénom et nom
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Construire le nom complet avec plusieurs fallbacks
  v_full_name := COALESCE(
    NULLIF(TRIM(v_first_name || ' ' || v_last_name), ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'fullName',
    SPLIT_PART(NEW.email, '@', 1),
    'Utilisateur'
  );

  -- Insérer le profil utilisateur avec gestion d'erreur
  BEGIN
    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      user_type,
      is_verified,
      avatar_url,
      address,
      city,
      created_at,
      total_bookings,
      completed_bookings,
      total_reviews
    )
    VALUES (
      NEW.id,
      v_full_name,
      COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
      v_user_type,
      CASE WHEN v_user_type = 'client' THEN true ELSE false END,
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'address',
      COALESCE(NEW.raw_user_meta_data->>'city', 'Djibouti'),
      NOW(),
      0,
      0,
      0
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Le profil existe déjà, on le met à jour
      UPDATE public.profiles
      SET 
        full_name = v_full_name,
        phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, phone),
        user_type = v_user_type,
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', avatar_url),
        address = COALESCE(NEW.raw_user_meta_data->>'address', address),
        city = COALESCE(NEW.raw_user_meta_data->>'city', city)
      WHERE id = NEW.id;
    WHEN OTHERS THEN
      -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur
      RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.id, SQLERRM;
  END;

  -- Si c'est un professionnel, créer aussi le profil professionnel
  IF v_user_type = 'professional' THEN
    BEGIN
      INSERT INTO public.professional_profiles (
        id,
        business_name,
        phone,
        city,
        district,
        address,
        service_category,
        sub_category,
        experience_years,
        hourly_rate,
        description,
        rating,
        total_reviews,
        total_bookings,
        completed_bookings,
        is_premium,
        is_active,
        is_suspended,
        verification_status,
        verification_documents,
        has_license,
        has_insurance,
        commission_rate,
        trial_end_date
      )
      VALUES (
        NEW.id,
        COALESCE(
          NEW.raw_user_meta_data->>'business_name',
          NEW.raw_user_meta_data->>'businessName',
          v_full_name
        ),
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
        COALESCE(NEW.raw_user_meta_data->>'city', 'Djibouti'),
        NEW.raw_user_meta_data->>'district',
        NEW.raw_user_meta_data->>'address',
        COALESCE(NEW.raw_user_meta_data->>'service_category', NEW.raw_user_meta_data->>'category', ''),
        COALESCE(NEW.raw_user_meta_data->>'sub_category', NEW.raw_user_meta_data->>'subCategory', ''),
        COALESCE((NEW.raw_user_meta_data->>'experience_years')::INTEGER, (NEW.raw_user_meta_data->>'experience')::INTEGER, 0),
        COALESCE((NEW.raw_user_meta_data->>'hourly_rate')::NUMERIC, 25),
        COALESCE(NEW.raw_user_meta_data->>'description', ''),
        5.0,
        0,
        0,
        0,
        false,
        true,
        false,
        'pending',
        '[]'::jsonb,
        COALESCE((NEW.raw_user_meta_data->>'has_license')::BOOLEAN, (NEW.raw_user_meta_data->>'hasLicense')::BOOLEAN, false),
        COALESCE((NEW.raw_user_meta_data->>'has_insurance')::BOOLEAN, (NEW.raw_user_meta_data->>'hasInsurance')::BOOLEAN, false),
        10,
        (NOW() + INTERVAL '7 days')::date
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- Le profil professionnel existe déjà, on le met à jour
        UPDATE public.professional_profiles
        SET
          business_name = COALESCE(
            NEW.raw_user_meta_data->>'business_name',
            NEW.raw_user_meta_data->>'businessName',
            business_name
          ),
          phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, phone),
          city = COALESCE(NEW.raw_user_meta_data->>'city', city),
          district = COALESCE(NEW.raw_user_meta_data->>'district', district),
          address = COALESCE(NEW.raw_user_meta_data->>'address', address),
          service_category = COALESCE(
            NEW.raw_user_meta_data->>'service_category',
            NEW.raw_user_meta_data->>'category',
            service_category
          ),
          sub_category = COALESCE(
            NEW.raw_user_meta_data->>'sub_category',
            NEW.raw_user_meta_data->>'subCategory',
            sub_category
          ),
          experience_years = COALESCE(
            (NEW.raw_user_meta_data->>'experience_years')::INTEGER,
            (NEW.raw_user_meta_data->>'experience')::INTEGER,
            experience_years
          ),
          description = COALESCE(NEW.raw_user_meta_data->>'description', description),
          has_license = COALESCE(
            (NEW.raw_user_meta_data->>'has_license')::BOOLEAN,
            (NEW.raw_user_meta_data->>'hasLicense')::BOOLEAN,
            has_license
          ),
          has_insurance = COALESCE(
            (NEW.raw_user_meta_data->>'has_insurance')::BOOLEAN,
            (NEW.raw_user_meta_data->>'hasInsurance')::BOOLEAN,
            has_insurance
          ),
          updated_at = NOW()
        WHERE id = NEW.id;
      WHEN OTHERS THEN
        RAISE WARNING 'Erreur lors de la création du profil professionnel pour %: %', NEW.id, SQLERRM;
    END;
  END IF;

  -- Créer une notification de bienvenue
  BEGIN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      created_at
    )
    VALUES (
      NEW.id,
      CASE 
        WHEN v_user_type = 'professional' THEN 'Bienvenue sur DjibGo - Compte Professionnel'
        ELSE 'Bienvenue sur DjibGo'
      END,
      CASE 
        WHEN v_user_type = 'professional' THEN 'Votre compte professionnel a été créé avec succès. Votre profil est en attente de vérification.'
        ELSE 'Votre compte a été créé avec succès. Vous pouvez maintenant utiliser tous nos services.'
      END,
      'info',
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Ne pas bloquer si la notification échoue
      RAISE WARNING 'Erreur lors de la création de la notification pour %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur la table auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SYNCHRONISER LES UTILISATEURS EXISTANTS
-- ============================================
-- Cette requête synchronise les utilisateurs qui existent déjà
-- dans auth.users mais n'ont pas de profil dans profiles
-- ============================================

-- Insérer les profils manquants pour les utilisateurs existants
INSERT INTO public.profiles (
  id,
  full_name,
  phone,
  user_type,
  is_verified,
  created_at,
  total_bookings,
  completed_bookings,
  total_reviews
)
SELECT 
  au.id,
  COALESCE(
    NULLIF(TRIM(COALESCE(au.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(au.raw_user_meta_data->>'last_name', '')), ''),
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'fullName',
    SPLIT_PART(au.email, '@', 1),
    'Utilisateur'
  ),
  COALESCE(au.raw_user_meta_data->>'phone', au.phone),
  COALESCE(au.raw_user_meta_data->>'user_type', 'client'),
  true,
  au.created_at,
  0,
  0,
  0
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Message de confirmation
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '✅ Trigger créé avec succès !';
  RAISE NOTICE '✅ % utilisateur(s) synchronisé(s)', synced_count;
END $$;
