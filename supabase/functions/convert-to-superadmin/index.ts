import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, email, full_name } = await req.json()

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'user_id ou email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Conversion en superadmin pour:', { user_id, email })

    // Trouver l'utilisateur par email si user_id n'est pas fourni
    let userId = user_id
    if (!userId && email) {
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la recherche de l\'utilisateur' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      const foundUser = authUser.users.find(u => u.email === email)
      if (!foundUser) {
        return new Response(
          JSON.stringify({ error: 'Utilisateur non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = foundUser.id
    }

    console.log('✅ Utilisateur trouvé:', userId)

    // Vérifier si l'admin existe déjà
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingAdmin) {
      console.log('⚠️ Cet utilisateur est déjà admin')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cet utilisateur est déjà un admin',
          admin: existingAdmin
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les infos du profil existant
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    const adminFullName = full_name || profile?.full_name || email?.split('@')[0] || 'Admin'

    // Supprimer le profil client de la table profiles
    console.log('🗑️ Suppression du profil client...')
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) {
      console.error('❌ Erreur lors de la suppression du profil:', deleteProfileError)
    } else {
      console.log('✅ Profil client supprimé')
    }

    // Supprimer le profil professionnel s'il existe
    const { error: deleteProfessionalError } = await supabaseAdmin
      .from('professional_profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfessionalError) {
      console.log('⚠️ Pas de profil professionnel à supprimer')
    } else {
      console.log('✅ Profil professionnel supprimé')
    }

    // Créer l'enregistrement admin avec tous les privilèges
    console.log('👑 Création du compte superadmin...')
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('admins')
      .insert({
        user_id: userId,
        email: email || profile?.email,
        role: 'superadmin',
        full_name: adminFullName,
        permissions: {
          manage_users: true,
          manage_professionals: true,
          manage_bookings: true,
          manage_payments: true,
          manage_settings: true,
          view_analytics: true,
          manage_admins: true,
          manage_categories: true,
          manage_services: true,
          manage_reviews: true
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (adminError) {
      console.error('❌ Erreur lors de la création de l\'admin:', adminError)
      return new Response(
        JSON.stringify({ error: adminError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Superadmin créé avec succès')

    // Créer une notification pour l'utilisateur
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'Compte Administrateur Activé',
        message: 'Votre compte a été converti en compte super administrateur. Vous avez maintenant accès à toutes les fonctionnalités d\'administration.',
        type: 'info',
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Utilisateur converti en superadmin avec succès',
        admin: adminData,
        changes: {
          profile_deleted: !deleteProfileError,
          professional_profile_deleted: !deleteProfessionalError,
          admin_created: true
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})