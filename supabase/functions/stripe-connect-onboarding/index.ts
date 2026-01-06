import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Non autorisé');
    }

    const { action, accountId } = await req.json();

    // Créer un compte Stripe Connect
    if (action === 'create_account') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      // Utiliser FR (France) comme pays par défaut car DJ n'est pas supporté par Stripe Connect
      // Les professionnels djiboutiens peuvent utiliser un compte français
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR', // France - pays supporté par Stripe Connect
        email: profile?.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          mcc: '7299', // Services professionnels
          url: 'https://djibgo.com',
        },
      });

      // Sauvegarder l'ID du compte Stripe
      const { data: wallet } = await supabaseClient
        .from('professional_wallets')
        .select('id')
        .eq('professional_id', user.id)
        .single();

      if (wallet) {
        await supabaseClient
          .from('professional_wallets')
          .update({
            stripe_account_id: account.id,
            stripe_account_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', wallet.id);
      } else {
        await supabaseClient
          .from('professional_wallets')
          .insert({
            professional_id: user.id,
            stripe_account_id: account.id,
            stripe_account_status: 'pending',
          });
      }

      // Créer un lien d'onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${req.headers.get('origin')}/dashboard?stripe_refresh=true`,
        return_url: `${req.headers.get('origin')}/dashboard?stripe_success=true`,
        type: 'account_onboarding',
      });

      return new Response(
        JSON.stringify({
          success: true,
          accountId: account.id,
          onboardingUrl: accountLink.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le statut du compte
    if (action === 'check_status' && accountId) {
      const account = await stripe.accounts.retrieve(accountId);

      const status = account.charges_enabled && account.payouts_enabled
        ? 'active'
        : account.details_submitted
        ? 'pending'
        : 'incomplete';

      // Mettre à jour le statut
      await supabaseClient
        .from('professional_wallets')
        .update({
          stripe_account_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('professional_id', user.id);

      return new Response(
        JSON.stringify({
          success: true,
          status,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un nouveau lien d'onboarding
    if (action === 'create_onboarding_link' && accountId) {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${req.headers.get('origin')}/dashboard?stripe_refresh=true`,
        return_url: `${req.headers.get('origin')}/dashboard?stripe_success=true`,
        type: 'account_onboarding',
      });

      return new Response(
        JSON.stringify({
          success: true,
          onboardingUrl: accountLink.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Action non valide');

  } catch (error) {
    console.error('Erreur Stripe Connect:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});