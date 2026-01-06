-- ============================================
-- OPTIMISATION DES PERFORMANCES - INDEX
-- ============================================
-- Exécutez ce script dans votre tableau de bord Supabase
-- SQL Editor pour créer tous les index nécessaires

-- ============================================
-- INDEX POUR LA TABLE LOCATIONS
-- ============================================

-- Index sur la colonne type pour accélérer les filtres par type
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);

-- Index sur la colonne parent_id pour accélérer les recherches de relations parent-enfant
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON locations(parent_id);

-- Index sur la colonne name pour accélérer les recherches par nom
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);

-- Index composite pour les recherches combinées type + parent_id
CREATE INDEX IF NOT EXISTS idx_locations_type_parent ON locations(type, parent_id);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_locations_created_at ON locations(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE SERVICES
-- ============================================

-- Index sur professional_id pour trouver rapidement les services d'un professionnel
CREATE INDEX IF NOT EXISTS idx_services_professional_id ON services(professional_id);

-- Index sur category pour filtrer par catégorie
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);

-- Index sur sub_category pour filtrer par sous-catégorie
CREATE INDEX IF NOT EXISTS idx_services_sub_category ON services(sub_category);

-- Index sur is_active pour filtrer les services actifs
CREATE INDEX IF NOT EXISTS idx_services_is_active ON services(is_active);

-- Index composite pour les recherches combinées
CREATE INDEX IF NOT EXISTS idx_services_category_active ON services(category, is_active);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE BOOKINGS
-- ============================================

-- Index sur client_id pour trouver les réservations d'un client
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);

-- Index sur professional_id pour trouver les réservations d'un professionnel
CREATE INDEX IF NOT EXISTS idx_bookings_professional_id ON bookings(professional_id);

-- Index sur status pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Index sur booking_date pour filtrer par date
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- Index composite pour les recherches combinées
CREATE INDEX IF NOT EXISTS idx_bookings_professional_status ON bookings(professional_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_client_status ON bookings(client_id, status);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE PROFESSIONAL_PROFILES
-- ============================================

-- Index sur user_id pour trouver rapidement le profil d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_professional_profiles_user_id ON professional_profiles(user_id);

-- Index sur category pour filtrer par catégorie
CREATE INDEX IF NOT EXISTS idx_professional_profiles_category ON professional_profiles(category);

-- Index sur is_available pour filtrer les professionnels disponibles
CREATE INDEX IF NOT EXISTS idx_professional_profiles_is_available ON professional_profiles(is_available);

-- Index composite pour les recherches combinées
CREATE INDEX IF NOT EXISTS idx_professional_profiles_category_available ON professional_profiles(category, is_available);

-- Index sur rating pour trier par note
CREATE INDEX IF NOT EXISTS idx_professional_profiles_rating ON professional_profiles(rating DESC);

-- ============================================
-- INDEX POUR LA TABLE REVIEWS
-- ============================================

-- Index sur professional_id pour trouver les avis d'un professionnel
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON reviews(professional_id);

-- Index sur client_id pour trouver les avis d'un client
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);

-- Index sur rating pour filtrer par note
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE NOTIFICATIONS
-- ============================================

-- Index sur user_id pour trouver les notifications d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Index sur is_read pour filtrer les notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Index composite pour les recherches combinées
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE PROFILES
-- ============================================

-- Index sur email pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index sur phone pour les recherches par téléphone
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Index sur user_type pour filtrer par type d'utilisateur
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- ============================================
-- INDEX POUR LA TABLE SMS_LOGS
-- ============================================

-- Index sur user_id pour trouver les SMS d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);

-- Index sur status pour filtrer par statut
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);

-- ============================================
-- INDEX POUR LA TABLE LOYALTY_POINTS
-- ============================================

-- Index sur user_id pour trouver les points d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);

-- ============================================
-- INDEX POUR LA TABLE LOYALTY_TRANSACTIONS
-- ============================================

-- Index sur user_id pour trouver les transactions d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);

-- Index sur created_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);

-- ============================================
-- VÉRIFICATION DES INDEX CRÉÉS
-- ============================================

-- Pour vérifier que tous les index ont été créés, exécutez :
-- SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
