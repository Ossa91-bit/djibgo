import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, booking_id, payment_method, phone_number, transaction_reference } = await req.json()

    // INITIATE LOCAL PAYMENT (WaafiPay or D-Money)
    if (action === 'initiate_local_payment') {
      console.log('🔍 Initiating local payment for booking:', booking_id)
      console.log('👤 User ID:', user.id)
      console.log('💳 Payment method:', payment_method)
      console.log('📱 Phone number:', phone_number)

      // Get booking details - First check if booking exists
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*, service:services(title), professional:profiles!bookings_professional_id_fkey(full_name, phone), client:profiles!bookings_client_id_fkey(full_name, email)')
        .eq('id', booking_id)
        .single()

      if (bookingError) {
        console.error('❌ Booking lookup error:', bookingError)
        return new Response(
          JSON.stringify({ error: 'Réservation introuvable', details: bookingError.message }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!booking) {
        console.error('❌ Booking not found with ID:', booking_id)
        return new Response(
          JSON.stringify({ error: 'Réservation introuvable' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify the booking belongs to the current user
      if (booking.client_id !== user.id) {
        console.error('❌ Booking does not belong to user. Booking client_id:', booking.client_id, 'User ID:', user.id)
        return new Response(
          JSON.stringify({ error: 'Non autorisé: Cette réservation ne vous appartient pas' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Booking found:', booking.id)

      // Calculate amounts
      const totalAmount = booking.total_amount
      const commissionAmount = totalAmount * 0.10
      const professionalAmount = totalAmount - commissionAmount

      // Generate unique transaction reference
      const transactionRef = `DJIBGO-${Date.now()}-${booking_id.substring(0, 8)}`

      console.log('💰 Amount breakdown:', { totalAmount, commissionAmount, professionalAmount })
      console.log('🔖 Transaction reference:', transactionRef)

      // Store payment initiation
      const { data: paymentRecord, error: paymentError } = await supabaseClient
        .from('local_payments')
        .insert({
          booking_id: booking_id,
          user_id: user.id,
          payment_method: payment_method,
          phone_number: phone_number,
          amount: totalAmount,
          commission_amount: commissionAmount,
          professional_amount: professionalAmount,
          transaction_reference: transactionRef,
          status: 'pending',
          initiated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (paymentError) {
        console.error('❌ Payment record error:', paymentError)
        return new Response(
          JSON.stringify({ error: 'Échec de la création de l\'enregistrement de paiement', details: paymentError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('✅ Payment record created:', paymentRecord.id)

      // Update booking with payment info
      await supabaseClient
        .from('bookings')
        .update({
          payment_method: payment_method,
          payment_reference: transactionRef,
          payment_status: 'pending'
        })
        .eq('id', booking_id)

      console.log('✅ Booking updated with payment info')

      // Send notification to client
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'payment_initiated',
          title: 'Paiement initié',
          message: `Votre paiement ${payment_method} de ${totalAmount} DJF a été initié. Veuillez compléter le paiement sur votre téléphone.`,
          related_id: booking_id
        })

      console.log('✅ Notification sent to client')

      return new Response(
        JSON.stringify({
          success: true,
          transaction_reference: transactionRef,
          payment_method: payment_method,
          amount: totalAmount,
          phone_number: phone_number,
          instructions: payment_method === 'waafipay' 
            ? `1. Ouvrez l'application WaafiPay\n2. Entrez le code marchand: DJIBGO\n3. Entrez le montant: ${totalAmount} DJF\n4. Entrez la référence: ${transactionRef}\n5. Confirmez le paiement`
            : `1. Composez *770#\n2. Sélectionnez "Payer"\n3. Entrez le code marchand: DJIBGO\n4. Entrez le montant: ${totalAmount} DJF\n5. Entrez la référence: ${transactionRef}\n6. Confirmez avec votre PIN`,
          payment_id: paymentRecord.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // VERIFY LOCAL PAYMENT
    if (action === 'verify_local_payment') {
      const { payment_id } = await req.json()

      // Get payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*)')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: 'Paiement introuvable' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // In production, you would integrate with WaafiPay/D-Money API here
      // For now, we'll allow manual verification by admin or auto-verify after timeout

      return new Response(
        JSON.stringify({
          status: payment.status,
          transaction_reference: payment.transaction_reference,
          amount: payment.amount,
          payment_method: payment.payment_method
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CONFIRM LOCAL PAYMENT (Admin or automatic verification)
    if (action === 'confirm_local_payment') {
      const { payment_id, verified_by } = await req.json()

      // Get payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*, service:services(title), professional:profiles!bookings_professional_id_fkey(full_name, phone), client:profiles!bookings_client_id_fkey(full_name, email))')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: 'Paiement introuvable' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update payment status
      await supabaseClient
        .from('local_payments')
        .update({
          status: 'completed',
          verified_by: verified_by || 'system',
          verified_at: new Date().toISOString()
        })
        .eq('id', payment_id)

      // Update booking status
      await supabaseClient
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', payment.booking_id)

      // Send notifications
      await supabaseClient
        .from('notifications')
        .insert([
          {
            user_id: payment.booking.professional_id,
            type: 'payment_received',
            title: 'Paiement reçu',
            message: `Paiement de ${payment.amount} DJF reçu via ${payment.payment_method}. Vous recevrez votre paiement dans les 7 jours après la fin du service.`,
            related_id: payment.booking_id
          },
          {
            user_id: payment.booking.client_id,
            type: 'payment_confirmed',
            title: 'Paiement confirmé',
            message: `Votre paiement ${payment.payment_method} de ${payment.amount} DJF a été confirmé. La réservation est maintenant confirmée !`,
            related_id: payment.booking_id
          }
        ])

      // Send SMS to professional
      if (payment.booking.professional?.phone) {
        try {
          const smsMessage = `DjibGo: Paiement confirmé! ${payment.booking.client?.full_name} a payé ${payment.amount} DJF via ${payment.payment_method}. Service: ${payment.booking.service?.title}. Connectez-vous pour les détails.`
          
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone_number: payment.booking.professional.phone,
              message: smsMessage,
              booking_id: payment.booking_id
            })
          })
        } catch (smsError) {
          console.error('SMS error:', smsError)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: 'completed',
          booking_id: payment.booking_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PAYMENT STATUS
    if (action === 'get_payment_status') {
      const { payment_id } = await req.json()

      const { data: payment, error: paymentError } = await supabaseClient
        .from('local_payments')
        .select('*')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: 'Paiement introuvable' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          status: payment.status,
          transaction_reference: payment.transaction_reference,
          amount: payment.amount,
          payment_method: payment.payment_method,
          initiated_at: payment.initiated_at,
          verified_at: payment.verified_at
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET USER'S LOCAL PAYMENTS
    if (action === 'get_user_payments') {
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*, service:services(title), professional:profiles!bookings_professional_id_fkey(full_name))')
        .eq('user_id', user.id)
        .order('initiated_at', { ascending: false })

      if (paymentsError) {
        return new Response(
          JSON.stringify({ error: paymentsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ payments: payments || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action invalide' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})