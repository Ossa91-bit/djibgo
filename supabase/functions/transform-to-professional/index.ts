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
      user_id,
      full_name,
      phone,
      city,
      address,
      business_name,
      service_category,
      experience_years,
      hourly_rate,
      description
    } = await req.json();

    // Validation
    if (!user_id || !business_name || !hourly_rate) {
      return new Response(
        JSON.stringify({ error: 'Les champs obligatoires sont manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Mettre à jour le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        phone,
        city,
        address,
        user_type: 'professional'
      })
      .eq('id', user_id);

    if (profileError) {
      console.error('Erreur mise à jour profil:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour du profil: ' + profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Créer le profil professionnel
    const { error: professionalError } = await supabaseAdmin
      .from('professional_profiles')
      .insert({
        id: user_id,
        service_category: service_category || 'chauffeur',
        experience_years: experience_years || 0,
        hourly_rate: hourly_rate,
        description: description || '',
        rating: 0,
        total_reviews: 0,
        commission_rate: 10,
        is_premium: false,
        verification_status: 'pending'
      });

    if (professionalError) {
      console.error('Erreur création profil pro:', professionalError);
      
      // Rollback: remettre le type à client
      await supabaseAdmin
        .from('profiles')
        .update({ user_type: 'client' })
        .eq('id', user_id);
      
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du profil professionnel: ' + professionalError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Créer une notification
    await supabaseAdmin.from('notifications').insert({
      user_id: user_id,
      title: 'Compte professionnel créé',
      message: 'Votre compte a été transformé en compte professionnel. Vous pouvez maintenant recevoir des réservations.',
      type: 'info',
      created_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Utilisateur transformé en professionnel avec succès'
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