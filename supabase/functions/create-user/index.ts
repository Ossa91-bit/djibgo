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

    const { 
      full_name, 
      phone, 
      city, 
      address, 
      user_type 
    } = await req.json();

    // Validation
    if (!full_name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Le nom et le téléphone sont obligatoires' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Générer un email temporaire basé sur le téléphone
    const tempEmail = `user_${phone.replace(/\s+/g, '')}@temp.servicedj.com`;
    const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        user_type: user_type || 'client'
      }
    });

    if (authError) {
      console.error('Erreur création auth:', authError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du compte: ' + authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // Créer le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name,
        phone,
        city: city || '',
        address: address || '',
        user_type: user_type || 'client',
        is_verified: false
      });

    if (profileError) {
      console.error('Erreur création profil:', profileError);
      // Supprimer l'utilisateur auth si le profil échoue
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du profil: ' + profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Si c'est un professionnel, créer aussi le profil professionnel
    if (user_type === 'professional') {
      const { error: professionalError } = await supabaseAdmin
        .from('professional_profiles')
        .insert({
          id: userId,
          service_category: '',
          experience_years: 0,
          hourly_rate: 0,
          description: '',
          rating: 0,
          total_reviews: 0,
          is_premium: false,
          is_suspended: false
        });

      if (professionalError) {
        console.error('Erreur création profil pro:', professionalError);
        // Supprimer le profil et l'utilisateur si ça échoue
        await supabaseAdmin.from('profiles').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la création du profil professionnel: ' + professionalError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Créer une notification pour le nouvel utilisateur
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: 'Bienvenue sur ServiceDJ',
      message: 'Votre compte a été créé par un administrateur. Vous pouvez maintenant utiliser tous nos services.',
      type: 'info',
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        message: 'Utilisateur créé avec succès',
        credentials: {
          email: tempEmail,
          password: tempPassword
        }
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