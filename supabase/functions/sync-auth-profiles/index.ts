import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer l'utilisateur depuis Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Erreur listUsers:', listError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authUser = users.find(u => u.email === email);

    if (!authUser) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé dans Auth' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si le profil existe déjà
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Le profil existe déjà',
          user_id: authUser.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer le profil manquant
    const profileData = {
      id: authUser.id,
      full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Utilisateur',
      phone: authUser.user_metadata?.phone || authUser.phone || null,
      user_type: authUser.user_metadata?.user_type || 'client',
      is_verified: authUser.user_metadata?.user_type === 'professional' ? false : true,
      avatar_url: authUser.user_metadata?.avatar_url || null,
      address: authUser.user_metadata?.address || null,
      city: authUser.user_metadata?.city || null,
      created_at: authUser.created_at,
      total_bookings: 0,
      completed_bookings: 0,
      total_reviews: 0
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (profileError) {
      console.error('Erreur création profil:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du profil: ' + profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si c'est un professionnel, créer aussi le profil professionnel
    if (profileData.user_type === 'professional') {
      const { error: professionalError } = await supabaseAdmin
        .from('professional_profiles')
        .insert({
          id: authUser.id,
          service_category: '',
          experience_years: 0,
          hourly_rate: 0,
          description: '',
          rating: 0,
          total_reviews: 0,
          is_premium: false,
          is_suspended: false,
          verification_status: 'pending',
          verification_documents: [],
          commission_rate: 15
        });

      if (professionalError) {
        console.error('Erreur création profil pro:', professionalError);
      }
    }

    // Créer une notification de bienvenue
    await supabaseAdmin.from('notifications').insert({
      user_id: authUser.id,
      title: 'Bienvenue sur DjibGo',
      message: 'Votre profil a été créé avec succès. Vous pouvez maintenant utiliser tous nos services.',
      type: 'info',
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profil créé avec succès',
        user_id: authUser.id,
        profile: profileData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});