import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, booking_id, amount, currency = 'usd', payment_intent_id } = await req.json()

    // CREATE PAYMENT INTENT
    if (action === 'create_payment_intent') {
      // Simplified query without complex joins
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .single()

      if (bookingError || !booking) {
        console.error('Booking error:', bookingError)
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée', details: bookingError?.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get service details separately
      const { data: service } = await supabaseClient
        .from('services')
        .select('title')
        .eq('id', booking.service_id)
        .single()

      // Get professional details separately
      const { data: professional } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', booking.professional_id)
        .single()

      // Get client details separately
      const { data: client } = await supabaseClient
        .from('profiles')
        .select('full_name, email')
        .eq('id', booking.client_id)
        .single()

      // Calculate commission (10% as per CGU)
      const totalAmount = amount || booking.total_amount
      const commissionAmount = totalAmount * 0.10
      const professionalAmount = totalAmount - commissionAmount

      // Create a test payment method for test mode
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          token: 'tok_visa', // Stripe test token
        },
      })

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: currency,
        payment_method: paymentMethod.id,
        payment_method_types: ['card', 'link', 'amazon_pay'],
        metadata: {
          booking_id: booking_id,
          user_id: user.id,
          professional_id: booking.professional_id,
          service_name: service?.title || 'Service',
          commission_amount: commissionAmount.toFixed(2),
          professional_amount: professionalAmount.toFixed(2)
        },
        description: `Paiement pour ${service?.title || 'Service'} - ${professional?.full_name || 'Professionnel'}`,
        confirm: true
      })

      await supabaseClient
        .from('bookings')
        .update({ 
          commission_amount: commissionAmount,
          payment_intent_id: paymentIntent.id,
          status: paymentIntent.status === 'succeeded' ? 'confirmed' : 'pending',
          payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
          payment_date: paymentIntent.status === 'succeeded' ? new Date().toISOString() : null
        })
        .eq('id', booking_id)

      // If payment succeeded, send notifications and emails
      if (paymentIntent.status === 'succeeded') {
        // Send in-app notifications
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: booking.professional_id,
            type: 'payment_received',
            title: 'Paiement reçu',
            message: `Un client a payé pour votre service "${service?.title}". Vous recevrez votre paiement sous 7 jours ouvrables après la prestation.`,
            related_id: booking_id
          })

        await supabaseClient
          .from('notifications')
          .insert({
            user_id: booking.client_id,
            type: 'payment_confirmed',
            title: 'Paiement confirmé',
            message: `Votre paiement de ${totalAmount} DJF pour "${service?.title}" a été confirmé avec succès.`,
            related_id: booking_id
          })

        // Send email notifications
        try {
          // Email to client
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'send_payment_confirmation',
              user_email: client?.email,
              user_name: client?.full_name,
              payment_data: {
                amount: totalAmount,
                service_name: service?.title,
                professional_name: professional?.full_name,
                scheduled_date: booking.scheduled_date,
                payment_method: 'Carte bancaire',
                transaction_id: paymentIntent.id,
                commission_amount: commissionAmount,
                booking_reference: booking.booking_reference
              }
            })
          })

          // Email to professional
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/email-notifications`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'send_professional_notification',
              user_email: professional?.email,
              user_name: professional?.full_name,
              payment_data: {
                amount: totalAmount,
                service_name: service?.title,
                client_name: client?.full_name,
                scheduled_date: booking.scheduled_date,
                commission_amount: commissionAmount,
                net_amount: professionalAmount,
                booking_reference: booking.booking_reference
              }
            })
          })
        } catch (emailError) {
          console.error('Erreur envoi emails:', emailError)
          // Continue even if email fails
        }
      }

      return new Response(
        JSON.stringify({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          totalAmount: totalAmount,
          commissionAmount: commissionAmount,
          professionalAmount: professionalAmount,
          status: paymentIntent.status,
          success: paymentIntent.status === 'succeeded',
          bookingId: booking_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SIMULATE TEST PAYMENT (for test mode)
    if (action === 'simulate_test_payment') {
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('professional_id, client_id, service_id, total_amount')
        .eq('id', booking_id)
        .single()

      if (!booking) {
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get service details
      const { data: service } = await supabaseClient
        .from('services')
        .select('title')
        .eq('id', booking.service_id)
        .single()

      // Update booking status to confirmed and paid
      await supabaseClient
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', booking_id)

      // Send notifications
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking.professional_id,
          type: 'payment_received',
          title: 'Paiement reçu',
          message: `Un client a payé pour votre service "${service?.title}". Vous recevrez votre paiement sous 7 jours ouvrables après la prestation.`,
          related_id: booking_id
        })

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking.client_id,
          type: 'payment_confirmed',
          title: 'Paiement confirmé',
          message: `Votre paiement de ${booking.total_amount} DJF pour "${service?.title}" a été confirmé avec succès.`,
          related_id: booking_id
        })

      return new Response(
        JSON.stringify({ success: true, status: 'paid' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CONFIRM PAYMENT
    if (action === 'confirm_payment') {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id)

      if (paymentIntent.status === 'succeeded') {
        const bookingId = paymentIntent.metadata.booking_id

        await supabaseClient
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid',
            payment_intent_id: payment_intent_id,
            payment_date: new Date().toISOString()
          })
          .eq('id', bookingId)

        const { data: booking } = await supabaseClient
          .from('bookings')
          .select('professional_id, client_id, service_id')
          .eq('id', bookingId)
          .single()

        if (booking) {
          const { data: service } = await supabaseClient
            .from('services')
            .select('title')
            .eq('id', booking.service_id)
            .single()

          await supabaseClient
            .from('notifications')
            .insert({
              user_id: booking.professional_id,
              type: 'payment_received',
              title: 'Paiement reçu',
              message: `Un client a payé pour votre service "${service?.title}". Vous recevrez votre paiement sous 7 jours ouvrables après la prestation.`,
              related_id: bookingId
            })

          await supabaseClient
            .from('notifications')
            .insert({
              user_id: booking.client_id,
              type: 'payment_confirmed',
              title: 'Paiement confirmé',
              message: `Votre paiement pour "${service?.title}" a été confirmé. Le professionnel a été notifié.`,
              related_id: bookingId
            })
        }

        return new Response(
          JSON.stringify({ success: true, status: 'paid' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: false, status: paymentIntent.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PAYMENT HISTORY
    if (action === 'get_payment_history') {
      const { data: bookings, error: bookingsError } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('client_id', user.id)
        .not('payment_intent_id', 'is', null)
        .order('created_at', { ascending: false })

      if (bookingsError) {
        return new Response(
          JSON.stringify({ error: bookingsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get related data for each booking
      const enrichedBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          const { data: professional } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', booking.professional_id)
            .single()

          const { data: service } = await supabaseClient
            .from('services')
            .select('title')
            .eq('id', booking.service_id)
            .single()

          return {
            ...booking,
            professional,
            service
          }
        })
      )

      return new Response(
        JSON.stringify({ payments: enrichedBookings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // REFUND PAYMENT (Based on CGU cancellation policy)
    if (action === 'refund') {
      const { payment_intent_id, booking_id, reason } = await req.json()

      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('client_id, professional_id, scheduled_date, total_amount, payment_status')
        .eq('id', booking_id)
        .single()

      if (!booking || booking.client_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (booking.payment_status === 'refunded') {
        return new Response(
          JSON.stringify({ error: 'Ce paiement a déjà été remboursé' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate refund based on CGU cancellation policy
      const scheduledDate = new Date(booking.scheduled_date)
      const now = new Date()
      const hoursUntilService = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      let refundPercentage = 0
      let refundReason = ''

      if (hoursUntilService >= 24) {
        refundPercentage = 1.0
        refundReason = 'Annulation plus de 24h avant - Remboursement complet (100%)'
      } else if (hoursUntilService >= 12) {
        refundPercentage = 0.5
        refundReason = 'Annulation entre 12h et 24h avant - Remboursement partiel (50%)'
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Annulation impossible',
            message: 'Selon nos CGU, les annulations moins de 12h avant la prestation ne sont pas remboursables.',
            hoursUntilService: hoursUntilService.toFixed(1)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const refundAmount = Math.round(booking.total_amount * refundPercentage * 100)

      const refund = await stripe.refunds.create({
        payment_intent: payment_intent_id,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        metadata: {
          booking_id: booking_id,
          refund_percentage: (refundPercentage * 100).toString(),
          hours_until_service: hoursUntilService.toFixed(1),
          policy_reason: refundReason
        }
      })

      if (refund.status === 'succeeded') {
        await supabaseClient
          .from('bookings')
          .update({ 
            payment_status: 'refunded',
            status: 'cancelled',
            refund_amount: refundAmount / 100,
            refund_percentage: refundPercentage * 100,
            cancelled_at: new Date().toISOString()
          })
          .eq('id', booking_id)

        await supabaseClient
          .from('notifications')
          .insert({
            user_id: booking.professional_id,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: `Une réservation a été annulée par le client. Remboursement: ${refundPercentage * 100}%`,
            related_id: booking_id
          })

        await supabaseClient
          .from('notifications')
          .insert({
            user_id: booking.client_id,
            type: 'refund_processed',
            title: 'Remboursement traité',
            message: `Votre remboursement de ${(refundAmount / 100).toFixed(0)} DJF (${refundPercentage * 100}%) a été traité. ${refundReason}`,
            related_id: booking_id
          })

        return new Response(
          JSON.stringify({ 
            success: true, 
            refund,
            refundAmount: refundAmount / 100,
            refundPercentage: refundPercentage * 100,
            reason: refundReason
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: false, status: refund.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PROFESSIONAL EARNINGS
    if (action === 'get_professional_earnings') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'professional') {
        return new Response(
          JSON.stringify({ error: 'Accès réservé aux professionnels' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: bookings, error: bookingsError } = await supabaseClient
        .from('bookings')
        .select('*')
        .eq('professional_id', user.id)
        .eq('payment_status', 'paid')
        .order('payment_date', { ascending: false })

      if (bookingsError) {
        return new Response(
          JSON.stringify({ error: bookingsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get related data for each booking
      const enrichedBookings = await Promise.all(
        (bookings || []).map(async (booking) => {
          const { data: client } = await supabaseClient
            .from('profiles')
            .select('full_name')
            .eq('id', booking.client_id)
            .single()

          const { data: service } = await supabaseClient
            .from('services')
            .select('title')
            .eq('id', booking.service_id)
            .single()

          return {
            ...booking,
            client,
            service
          }
        })
      )

      const totalEarnings = enrichedBookings?.reduce((sum, b) => sum + (parseFloat(b.total_amount) - parseFloat(b.commission_amount || '0')), 0) || 0
      const totalCommission = enrichedBookings?.reduce((sum, b) => sum + parseFloat(b.commission_amount || '0'), 0) || 0
      const pendingPayouts = enrichedBookings?.filter(b => b.status === 'completed' && !b.payout_date).length || 0

      return new Response(
        JSON.stringify({ 
          earnings: enrichedBookings,
          summary: {
            totalEarnings,
            totalCommission,
            pendingPayouts,
            completedBookings: enrichedBookings?.length || 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})