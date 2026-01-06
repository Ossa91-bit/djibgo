-- ============================================
-- SYNCHRONISATION AUTOMATIQUE BIDIRECTIONNELLE
-- Entre profiles et professional_profiles
-- ============================================
-- 
-- Instructions:
-- 1. Allez dans votre Dashboard Supabase
-- 2. Cliquez sur "SQL Editor" dans le menu de gauche
-- 3. Créez une nouvelle requête
-- 4. Copiez et collez tout ce fichier
-- 5. Cliquez sur "Run" pour exécuter
-- ============================================

-- ============================================
-- FONCTION 1: Synchroniser profiles → professional_profiles
-- ============================================
-- Quand on modifie un profil utilisateur de type "professional",
-- les changements sont automatiquement appliqués au profil professionnel

CREATE OR REPLACE FUNCTION sync_profile_to_professional()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'utilisateur est un professionnel, synchroniser les données
  IF NEW.user_type = 'professional' THEN
    -- Vérifier si le profil professionnel existe
    IF EXISTS (SELECT 1 FROM professional_profiles WHERE id = NEW.id) THEN
      -- Mettre à jour le profil professionnel existant
      UPDATE professional_profiles
      SET
        phone = NEW.phone,
        city = NEW.city,
        address = NEW.address,
        is_active = NEW.is_verified,
        total_bookings = NEW.total_bookings,
        completed_bookings = NEW.completed_bookings,
        updated_at = NOW()
      WHERE id = NEW.id;
    ELSE
      -- Créer le profil professionnel s'il n'existe pas
      INSERT INTO professional_profiles (
        id,
        business_name,
        phone,
        city,
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
        commission_rate,
        trial_end_date,
        verification_documents
      )
      VALUES (
        NEW.id,
        NEW.full_name,
        NEW.phone,
        COALESCE(NEW.city, 'Djibouti'),
        NEW.address,
        '',
        '',
        0,
        25,
        '',
        0,
        0,
        NEW.total_bookings,
        NEW.completed_bookings,
        false,
        NEW.is_verified,
        false,
        'pending',
        10,
        (NOW() + INTERVAL '7 days')::date,
        '[]'::jsonb
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION 2: Synchroniser professional_profiles → profiles
-- ============================================
-- Quand on modifie un profil professionnel,
-- les changements sont automatiquement appliqués au profil utilisateur

CREATE OR REPLACE FUNCTION sync_professional_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour le profil utilisateur correspondant
  UPDATE profiles
  SET
    phone = COALESCE(NEW.phone, phone),
    city = COALESCE(NEW.city, city),
    address = COALESCE(NEW.address, address),
    is_verified = CASE 
      WHEN NEW.verification_status = 'approved' THEN true 
      ELSE is_verified 
    END,
    total_bookings = NEW.total_bookings,
    completed_bookings = NEW.completed_bookings,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUPPRIMER LES ANCIENS TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_sync_profile_to_professional ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_professional_to_profile ON professional_profiles;

-- ============================================
-- CRÉER LES NOUVEAUX TRIGGERS
-- ============================================

-- Trigger 1: Quand profiles est modifié → synchroniser professional_profiles
CREATE TRIGGER trigger_sync_profile_to_professional
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_professional();

-- Trigger 2: Quand professional_profiles est modifié → synchroniser profiles
CREATE TRIGGER trigger_sync_professional_to_profile
  AFTER UPDATE ON professional_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_professional_to_profile();

-- ============================================
-- SYNCHRONISER LES DONNÉES EXISTANTES
-- ============================================

-- Étape 1: Mettre à jour tous les professional_profiles avec les données de profiles
UPDATE professional_profiles pp
SET
  phone = COALESCE(p.phone, pp.phone),
  city = COALESCE(p.city, pp.city),
  address = COALESCE(p.address, pp.address),
  is_active = p.is_verified,
  total_bookings = p.total_bookings,
  completed_bookings = p.completed_bookings,
  updated_at = NOW()
FROM profiles p
WHERE pp.id = p.id AND p.user_type = 'professional';

-- Étape 2: Créer les profils professionnels manquants
INSERT INTO professional_profiles (
  id,
  business_name,
  phone,
  city,
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
  commission_rate,
  trial_end_date,
  verification_documents
)
SELECT 
  p.id,
  p.full_name,
  p.phone,
  COALESCE(p.city, 'Djibouti'),
  p.address,
  '',
  '',
  0,
  25,
  '',
  0,
  0,
  p.total_bookings,
  p.completed_bookings,
  false,
  p.is_verified,
  false,
  'pending',
  10,
  (NOW() + INTERVAL '7 days')::date,
  '[]'::jsonb
FROM profiles p
LEFT JOIN professional_profiles pp ON pp.id = p.id
WHERE p.user_type = 'professional' AND pp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MESSAGE DE CONFIRMATION
-- ============================================

DO $$
DECLARE
  synced_count INTEGER;
  created_count INTEGER;
BEGIN
  -- Compter les profils synchronisés
  SELECT COUNT(*) INTO synced_count
  FROM profiles p
  INNER JOIN professional_profiles pp ON pp.id = p.id
  WHERE p.user_type = 'professional';
  
  -- Compter les profils créés
  SELECT COUNT(*) INTO created_count
  FROM profiles p
  LEFT JOIN professional_profiles pp ON pp.id = p.id
  WHERE p.user_type = 'professional' AND pp.id IS NULL;
  
  RAISE NOTICE '✅ Synchronisation automatique activée !';
  RAISE NOTICE '✅ % profil(s) professionnel(s) synchronisé(s)', synced_count;
  RAISE NOTICE '✅ % profil(s) professionnel(s) créé(s)', created_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Les modifications seront maintenant synchronisées automatiquement entre:';
  RAISE NOTICE '   - profiles → professional_profiles';
  RAISE NOTICE '   - professional_profiles → profiles';
END $$;
