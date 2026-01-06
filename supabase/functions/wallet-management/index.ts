import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MINIMUM_WITHDRAWAL = 1000; // 1000 DJF minimum

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

    const { action, amount, payoutMethod, payoutDetails } = await req.json();

    // Récupérer le portefeuille
    const { data: wallet, error: walletError } = await supabaseClient
      .from('professional_wallets')
      .select('*')
      .eq('professional_id', user.id)
      .single();

    if (walletError || !wallet) {
      throw new Error('Portefeuille introuvable');
    }

    // Demande de retrait
    if (action === 'request_withdrawal') {
      if (amount < MINIMUM_WITHDRAWAL) {
        throw new Error(`Le montant minimum de retrait est ${MINIMUM_WITHDRAWAL} DJF`);
      }

      if (amount > parseFloat(wallet.balance)) {
        throw new Error('Solde insuffisant');
      }

      // Créer la demande de retrait
      const { data: withdrawal, error: withdrawalError } = await supabaseClient
        .from('withdrawal_requests')
        .insert({
          wallet_id: wallet.id,
          professional_id: user.id,
          amount: amount,
          payout_method: payoutMethod,
          payout_details: payoutDetails,
          status: 'pending',
        })
        .select()
        .single();

      if (withdrawalError) {
        throw new Error('Erreur lors de la création de la demande');
      }

      // Déduire du solde disponible et ajouter au solde en attente
      await supabaseClient
        .from('professional_wallets')
        .update({
          balance: parseFloat(wallet.balance) - amount,
          pending_balance: parseFloat(wallet.pending_balance) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', wallet.id);

      // Créer la transaction
      await supabaseClient
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'withdrawal',
          amount: -amount,
          balance_before: parseFloat(wallet.balance),
          balance_after: parseFloat(wallet.balance) - amount,
          status: 'pending',
          payment_method: payoutMethod,
          description: `Demande de retrait via ${payoutMethod}`,
        });

      // Notifier les admins
      const { data: admins } = await supabaseClient
        .from('admins')
        .select('user_id');

      if (admins) {
        for (const admin of admins) {
          await supabaseClient
            .from('notifications')
            .insert({
              user_id: admin.user_id,
              title: 'Nouvelle demande de retrait',
              message: `Un professionnel a demandé un retrait de ${amount} DJF`,
              type: 'admin',
              data: { withdrawal_id: withdrawal.id },
            });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          withdrawal,
          message: 'Demande de retrait créée avec succès',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mettre à jour les informations de paiement
    if (action === 'update_payout_info') {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      if (payoutMethod) updates.preferred_payout_method = payoutMethod;
      if (payoutDetails?.waafi_phone) updates.waafi_phone = payoutDetails.waafi_phone;
      if (payoutDetails?.dmoney_phone) updates.dmoney_phone = payoutDetails.dmoney_phone;
      if (payoutDetails?.bank_account_name) updates.bank_account_name = payoutDetails.bank_account_name;
      if (payoutDetails?.bank_account_number) updates.bank_account_number = payoutDetails.bank_account_number;
      if (payoutDetails?.bank_name) updates.bank_name = payoutDetails.bank_name;

      await supabaseClient
        .from('professional_wallets')
        .update(updates)
        .eq('id', wallet.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Informations de paiement mises à jour',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtenir l'historique des transactions
    if (action === 'get_transactions') {
      const { data: transactions } = await supabaseClient
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({
          success: true,
          transactions,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtenir les demandes de retrait
    if (action === 'get_withdrawals') {
      const { data: withdrawals } = await supabaseClient
        .from('withdrawal_requests')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({
          success: true,
          withdrawals,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Action non valide');

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});