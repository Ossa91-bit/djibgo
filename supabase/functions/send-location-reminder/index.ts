import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer tous les professionnels sans localisation GPS
    const { data: professionals, error: fetchError } = await supabaseClient
      .from('professional_profiles')
      .select('id, user_id, business_name, location, latitude, longitude, profiles!inner(full_name, email)')
      .eq('is_active', true)
      .or('latitude.is.null,longitude.is.null');

    if (fetchError) throw fetchError;

    if (!professionals || professionals.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Tous les professionnels ont déjà configuré leur localisation',
          count: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Envoyer une notification à chaque professionnel
    const notifications = professionals.map(prof => ({
      user_id: prof.user_id,
      type: 'location_reminder',
      title: 'Mettez à jour votre localisation',
      message: `Bonjour ${prof.profiles.full_name || prof.business_name}, pour améliorer votre visibilité auprès des clients, veuillez configurer votre localisation GPS dans votre tableau de bord. Les clients pourront ainsi vous trouver plus facilement par distance et voir votre position sur la carte.`,
      read: false,
      created_at: new Date().toISOString()
    }));

    const { error: notifError } = await supabaseClient
      .from('notifications')
      .insert(notifications);

    if (notifError) throw notifError;

    // Envoyer également un email de rappel (optionnel)
    for (const prof of professionals) {
      try {
        await supabaseClient.functions.invoke('email-notifications', {
          body: {
            to: prof.profiles.email,
            subject: 'Mettez à jour votre localisation sur DjibGo',
            html: `
              &lt;div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"&gt;
                &lt;h2 style="color: #14B8A6;"&gt;Bonjour ${prof.profiles.full_name || prof.business_name},&lt;/h2&gt;
                
                &lt;p&gt;Nous avons remarqué que vous n'avez pas encore configuré votre localisation GPS sur DjibGo.&lt;/p&gt;
                
                &lt;p&gt;&lt;strong&gt;Pourquoi c'est important ?&lt;/strong&gt;&lt;/p&gt;
                &lt;ul&gt;
                  &lt;li&gt;Les clients peuvent vous trouver par distance (ex: "professionnels à moins de 2 km")&lt;/li&gt;
                  &lt;li&gt;Votre position apparaît sur la carte interactive&lt;/li&gt;
                  &lt;li&gt;Vous êtes mieux classé dans les résultats de recherche locaux&lt;/li&gt;
                  &lt;li&gt;Augmentez vos chances d'être contacté par des clients proches&lt;/li&gt;
                &lt;/ul&gt;
                
                &lt;p&gt;&lt;strong&gt;Comment faire ?&lt;/strong&gt;&lt;/p&gt;
                &lt;ol&gt;
                  &lt;li&gt;Connectez-vous à votre tableau de bord&lt;/li&gt;
                  &lt;li&gt;Cliquez sur "Gérer ma localisation" dans les actions rapides&lt;/li&gt;
                  &lt;li&gt;Utilisez la détection automatique ou saisissez manuellement votre localisation&lt;/li&gt;
                &lt;/ol&gt;
                
                &lt;div style="text-align: center; margin: 30px 0;"&gt;
                  &lt;a href="https://gthnwj.readdy.co/dashboard" 
                     style="background: #14B8A6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;"&gt;
                    Mettre à jour ma localisation
                  &lt;/a&gt;
                &lt;/div&gt;
                
                &lt;p style="color: #6B7280; font-size: 14px;"&gt;
                  L'équipe DjibGo
                &lt;/p&gt;
              &lt;/div&gt;
            `
          }
        });
      } catch (emailError) {
        console.error(`Erreur envoi email à ${prof.profiles.email}:`, emailError);
        // Continue même si l'email échoue
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Rappels envoyés à ${professionals.length} professionnel(s)`,
        count: professionals.length,
        professionals: professionals.map(p => ({
          id: p.id,
          name: p.profiles.full_name || p.business_name,
          email: p.profiles.email
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
