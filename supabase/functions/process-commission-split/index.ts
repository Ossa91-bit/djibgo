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

const PLATFORM_COMMISSION_RATE = 0.10; // 10%

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, paymentIntentId, paymentMethod } = await req.json();

    // Récupérer les détails de la réservation
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .select('*, services(price), professional_profiles(user_id)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error('Réservation introuvable');
    }

    const totalAmount = parseFloat(booking.services.price);
    const platformCommission = totalAmount * PLATFORM_COMMISSION_RATE;
    const professionalAmount = totalAmount - platformCommission;

    // Créer l'enregistrement de split
    const { data: split, error: splitError } = await supabaseClient
      .from('commission_splits')
      .insert({
        booking_id: bookingId,
        total_amount: totalAmount,
        platform_commission: platformCommission,
        professional_amount: professionalAmount,
        payment_method: paymentMethod,
        status: 'processing',
      })
      .select()
      .single();

    if (splitError) {
      throw new Error('Erreur lors de la création du split');
    }

    // Si paiement par carte via Stripe
    if (paymentMethod === 'card' && paymentIntentId) {
      // Récupérer le compte Stripe du professionnel
      const { data: wallet } = await supabaseClient
        .from('professional_wallets')
        .select('stripe_account_id, stripe_account_status')
        .eq('professional_id', booking.professional_profiles.user_id)
        .single();

      if (wallet?.stripe_account_id && wallet.stripe_account_status === 'active') {
        // Créer un transfert vers le compte du professionnel
        const transfer = await stripe.transfers.create({
          amount: Math.round(professionalAmount * 100), // En centimes
          currency: 'djf',
          destination: wallet.stripe_account_id,
          transfer_group: bookingId,
          description: `Paiement pour réservation ${bookingId}`,
          metadata: {
            booking_id: bookingId,
            commission_split_id: split.id,
          },
        });

        // Mettre à jour le split
        await supabaseClient
          .from('commission_splits')
          .update({
            stripe_transfer_id: transfer.id,
            platform_paid: true,
            professional_paid: true,
            platform_payment_date: new Date().toISOString(),
            professional_payment_date: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', split.id);

        // Mettre à jour le portefeuille
        await supabaseClient.rpc('update_wallet_balance', {
          p_professional_id: booking.professional_profiles.user_id,
          p_amount: professionalAmount,
          p_type: 'earning',
        });

      } else {
        // Compte Stripe non configuré, ajouter au portefeuille interne
        await addToInternalWallet(
          supabaseClient,
          booking.professional_profiles.user_id,
          professionalAmount,
          split.id,
          'Compte Stripe non configuré'
        );

        await supabaseClient
          .from('commission_splits')
          .update({
            platform_paid: true,
            platform_payment_date: new Date().toISOString(),
            status: 'completed',
            notes: 'Ajouté au portefeuille interne - Stripe non configuré',
          })
          .eq('id', split.id);
      }
    } else {
      // Paiement mobile (Waafi, D-money, etc.) - Ajouter au portefeuille interne
      await addToInternalWallet(
        supabaseClient,
        booking.professional_profiles.user_id,
        professionalAmount,
        split.id,
        `Paiement mobile ${paymentMethod}`
      );

      await supabaseClient
        .from('commission_splits')
        .update({
          platform_paid: true,
          platform_payment_date: new Date().toISOString(),
          status: 'completed',
          notes: 'Ajouté au portefeuille interne - Paiement mobile',
        })
        .eq('id', split.id);
    }

    // Envoyer une notification au professionnel
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: booking.professional_profiles.user_id,
        title: 'Paiement reçu',
        message: `Vous avez reçu ${professionalAmount.toFixed(2)} DJF pour la réservation #${bookingId.slice(0, 8)}`,
        type: 'payment',
        data: { booking_id: bookingId, amount: professionalAmount },
      });

    return new Response(
      JSON.stringify({
        success: true,
        split: {
          total: totalAmount,
          commission: platformCommission,
          professional: professionalAmount,
        },
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

async function addToInternalWallet(
  supabaseClient: any,
  professionalId: string,
  amount: number,
  commissionSplitId: string,
  description: string
) {
  // Créer ou récupérer le portefeuille
  let { data: wallet } = await supabaseClient
    .from('professional_wallets')
    .select('*')
    .eq('professional_id', professionalId)
    .single();

  if (!wallet) {
    const { data: newWallet } = await supabaseClient
      .from('professional_wallets')
      .insert({
        professional_id: professionalId,
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
      })
      .select()
      .single();
    wallet = newWallet;
  }

  const balanceBefore = parseFloat(wallet.balance);
  const balanceAfter = balanceBefore + amount;

  // Mettre à jour le portefeuille
  await supabaseClient
    .from('professional_wallets')
    .update({
      balance: balanceAfter,
      total_earned: parseFloat(wallet.total_earned) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wallet.id);

  // Créer la transaction
  await supabaseClient
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      commission_split_id: commissionSplitId,
      type: 'earning',
      amount: amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      status: 'completed',
      description: description,
    });
}