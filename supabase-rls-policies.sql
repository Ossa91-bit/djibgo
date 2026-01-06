-- ============================================
-- SUPABASE RLS CONFIGURATION
-- DjibGo Platform Security Policies
-- ============================================
-- 
-- Instructions:
-- 1. Go to your Supabase Dashboard
-- 2. Click on "SQL Editor" in the left menu
-- 3. Create a new query
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
-- ============================================

-- First, ensure the admins table has a unique constraint on user_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admins_user_id_key'
  ) THEN
    ALTER TABLE admins ADD CONSTRAINT admins_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public can view verified professionals" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

DROP POLICY IF EXISTS "Professionals can view own profile" ON professional_profiles;
DROP POLICY IF EXISTS "Professionals can insert own profile" ON professional_profiles;
DROP POLICY IF EXISTS "Professionals can update own profile" ON professional_profiles;
DROP POLICY IF EXISTS "Public can view verified professional profiles" ON professional_profiles;
DROP POLICY IF EXISTS "Admins can view all professional profiles" ON professional_profiles;
DROP POLICY IF EXISTS "Admins can update all professional profiles" ON professional_profiles;

DROP POLICY IF EXISTS "Public can view verified services" ON services;
DROP POLICY IF EXISTS "Professionals can view own services" ON services;
DROP POLICY IF EXISTS "Professionals can insert own services" ON services;
DROP POLICY IF EXISTS "Professionals can update own services" ON services;
DROP POLICY IF EXISTS "Professionals can delete own services" ON services;
DROP POLICY IF EXISTS "Admins can manage all services" ON services;

DROP POLICY IF EXISTS "Clients can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Professionals can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can create bookings" ON bookings;
DROP POLICY IF EXISTS "Clients can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Professionals can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

DROP POLICY IF EXISTS "Public can view reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can create reviews" ON reviews;
DROP POLICY IF EXISTS "Clients can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own payments" ON local_payments;
DROP POLICY IF EXISTS "Clients can create payments" ON local_payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON local_payments;

DROP POLICY IF EXISTS "Public can view professional availability" ON professional_availability;
DROP POLICY IF EXISTS "Professionals can manage own availability" ON professional_availability;
DROP POLICY IF EXISTS "Admins can manage all availability" ON professional_availability;

DROP POLICY IF EXISTS "Admins can view SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "System can insert SMS logs" ON sms_logs;

DROP POLICY IF EXISTS "Admins can view admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admins" ON admins;
DROP POLICY IF EXISTS "Service role can manage admins" ON admins;

DROP POLICY IF EXISTS "Professionals can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
DROP POLICY IF EXISTS "Professionals can delete own documents" ON storage.objects;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADMINS TABLE POLICIES (MUST BE FIRST!)
-- ============================================

-- Allow authenticated users to check if they are admin (no recursion)
CREATE POLICY "Users can check own admin status"
ON admins FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role to manage admins
CREATE POLICY "Service role can manage admins"
ON admins FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow everyone to view verified professional profiles
CREATE POLICY "Public can view verified professionals"
ON profiles FOR SELECT
USING (user_type = 'professional' AND is_verified = true);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- PROFESSIONAL_PROFILES TABLE POLICIES
-- ============================================

-- Allow professionals to view their own profile
CREATE POLICY "Professionals can view own profile"
ON professional_profiles FOR SELECT
USING (auth.uid() = id);

-- Allow professionals to insert their own profile
CREATE POLICY "Professionals can insert own profile"
ON professional_profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow professionals to update their own profile
CREATE POLICY "Professionals can update own profile"
ON professional_profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow everyone to view verified professional profiles
CREATE POLICY "Public can view verified professional profiles"
ON professional_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professional_profiles.id 
    AND profiles.is_verified = true
  )
);

-- Allow admins to view all professional profiles
CREATE POLICY "Admins can view all professional profiles"
ON professional_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Allow admins to update any professional profile
CREATE POLICY "Admins can update all professional profiles"
ON professional_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- SERVICES TABLE POLICIES
-- ============================================

-- Allow everyone to view services from verified professionals
CREATE POLICY "Public can view verified services"
ON services FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = services.professional_id 
    AND profiles.is_verified = true
  )
);

-- Allow professionals to view their own services
CREATE POLICY "Professionals can view own services"
ON services FOR SELECT
USING (auth.uid() = professional_id);

-- Allow professionals to insert their own services
CREATE POLICY "Professionals can insert own services"
ON services FOR INSERT
WITH CHECK (auth.uid() = professional_id);

-- Allow professionals to update their own services
CREATE POLICY "Professionals can update own services"
ON services FOR UPDATE
USING (auth.uid() = professional_id);

-- Allow professionals to delete their own services
CREATE POLICY "Professionals can delete own services"
ON services FOR DELETE
USING (auth.uid() = professional_id);

-- Allow admins to manage all services
CREATE POLICY "Admins can manage all services"
ON services FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- BOOKINGS TABLE POLICIES
-- ============================================

-- Allow clients to view their own bookings
CREATE POLICY "Clients can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = client_id);

-- Allow professionals to view bookings for their services
CREATE POLICY "Professionals can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = professional_id);

-- Allow clients to create bookings
CREATE POLICY "Clients can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Allow clients to update their own bookings
CREATE POLICY "Clients can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = client_id);

-- Allow professionals to update bookings for their services
CREATE POLICY "Professionals can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = professional_id);

-- Allow admins to manage all bookings
CREATE POLICY "Admins can manage all bookings"
ON bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- REVIEWS TABLE POLICIES
-- ============================================

-- Allow everyone to view reviews
CREATE POLICY "Public can view reviews"
ON reviews FOR SELECT
USING (true);

-- Allow clients to insert reviews for their bookings
CREATE POLICY "Clients can create reviews"
ON reviews FOR INSERT
WITH CHECK (
  auth.uid() = client_id AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = reviews.booking_id 
    AND bookings.client_id = auth.uid()
    AND bookings.status = 'completed'
  )
);

-- Allow clients to update their own reviews
CREATE POLICY "Clients can update own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = client_id);

-- Allow admins to manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own notifications
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow system to insert notifications (via service role)
CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
WITH CHECK (true);

-- ============================================
-- LOCAL_PAYMENTS TABLE POLICIES
-- ============================================

-- Allow users to view their own payments
CREATE POLICY "Users can view own payments"
ON local_payments FOR SELECT
USING (
  auth.uid() IN (
    SELECT client_id FROM bookings WHERE bookings.id = local_payments.booking_id
    UNION
    SELECT professional_id FROM bookings WHERE bookings.id = local_payments.booking_id
  )
);

-- Allow clients to create payments for their bookings
CREATE POLICY "Clients can create payments"
ON local_payments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = local_payments.booking_id 
    AND bookings.client_id = auth.uid()
  )
);

-- Allow admins to manage all payments
CREATE POLICY "Admins can manage all payments"
ON local_payments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- PROFESSIONAL_AVAILABILITY TABLE POLICIES
-- ============================================

-- Allow everyone to view availability of verified professionals
CREATE POLICY "Public can view professional availability"
ON professional_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = professional_availability.professional_id 
    AND profiles.is_verified = true
  )
);

-- Allow professionals to manage their own availability
CREATE POLICY "Professionals can manage own availability"
ON professional_availability FOR ALL
USING (auth.uid() = professional_id);

-- Allow admins to manage all availability
CREATE POLICY "Admins can manage all availability"
ON professional_availability FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- ============================================
-- SMS_LOGS TABLE POLICIES
-- ============================================

-- Only admins can view SMS logs
CREATE POLICY "Admins can view SMS logs"
ON sms_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- System can insert SMS logs
CREATE POLICY "System can insert SMS logs"
ON sms_logs FOR INSERT
WITH CHECK (true);

-- ============================================
-- STORAGE POLICIES (for document uploads)
-- ============================================

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow professionals to upload their own documents
CREATE POLICY "Professionals can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow professionals to view their own documents
CREATE POLICY "Professionals can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM admins 
    WHERE admins.user_id = auth.uid()
  )
);

-- Allow professionals to delete their own documents
CREATE POLICY "Professionals can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- ADD VERIFICATION FIELDS TO PROFESSIONAL_PROFILES
-- ============================================

-- Add columns for document verification
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'verification_documents'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD COLUMN verification_documents JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'verification_notes'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD COLUMN verification_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'professional_profiles' 
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD COLUMN verified_by UUID;
  END IF;
END $$;

-- Add check constraint for verification status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_verification_status'
  ) THEN
    ALTER TABLE professional_profiles 
    ADD CONSTRAINT check_verification_status 
    CHECK (verification_status IN ('pending', 'under_review', 'approved', 'rejected'));
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_professional_verification_status 
ON professional_profiles(verification_status);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

-- If you see this message, all policies have been created successfully!
SELECT 'RLS Policies configured successfully! ✅' AS status;
