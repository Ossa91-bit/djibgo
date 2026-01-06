import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WaafiPay API Configuration
const WAAFIPAY_API_URL = Deno.env.get('WAAFIPAY_API_URL') || 'https://api.waafipay.net'
const WAAFIPAY_MERCHANT_ID = Deno.env.get('WAAFIPAY_MERCHANT_ID') || ''
const WAAFIPAY_API_KEY = Deno.env.get('WAAFIPAY_API_KEY') || ''
const WAAFIPAY_API_USER_ID = Deno.env.get('WAAFIPAY_API_USER_ID') || ''

// Test mode configuration
const TEST_MODE = Deno.env.get('WAAFIPAY_TEST_MODE') === 'true'
const TEST_PHONE = '253771111111'
const TEST_PIN = '1212'

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
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, booking_id, phone_number, amount, test_mode } = await req.json()

    // INITIATE WAAFIPAY PAYMENT
    if (action === 'initiate_payment') {
      // Get booking details
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*, service:services(title), professional:profiles!bookings_professional_id_fkey(full_name, phone), client:profiles!bookings_client_id_fkey(full_name, email)')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .single()

      if (bookingError || !booking) {
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const totalAmount = amount || booking.total_amount
      const commissionAmount = totalAmount * 0.10
      const professionalAmount = totalAmount - commissionAmount

      // Generate unique transaction reference
      const transactionRef = `DJIBGO-${Date.now()}-${booking_id.substring(0, 8)}`

      // Format phone number (remove +253 if present)
      const formattedPhone = phone_number.replace(/^\+?253/, '')

      // Store payment initiation in database
      const { data: paymentRecord, error: paymentError } = await supabaseClient
        .from('local_payments')
        .insert({
          booking_id: booking_id,
          user_id: user.id,
          payment_method: 'waafipay',
          phone_number: formattedPhone,
          amount: totalAmount,
          commission_amount: commissionAmount,
          professional_amount: professionalAmount,
          transaction_reference: transactionRef,
          status: 'pending',
          initiated_at: new Date().toISOString(),
          metadata: {
            test_mode: test_mode || TEST_MODE,
            service_name: booking.service?.title,
            professional_name: booking.professional?.full_name
          }
        })
        .select()
        .single()

      if (paymentError) {
        console.error('Payment record error:', paymentError)
        return new Response(
          JSON.stringify({ error: 'Échec de création du paiement' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update booking with payment info
      await supabaseClient
        .from('bookings')
        .update({
          payment_method: 'waafipay',
          payment_reference: transactionRef,
          payment_status: 'pending',
          commission_amount: commissionAmount
        })
        .eq('id', booking_id)

      let waafiPayResponse = null
      let paymentStatus = 'pending'

      // Call WaafiPay API (or simulate in test mode)
      if (test_mode || TEST_MODE) {
        // Test mode - simulate successful payment
        console.log('TEST MODE: Simulating WaafiPay payment')
        waafiPayResponse = {
          responseCode: '2001',
          responseMsg: 'Transaction successful',
          transactionId: `TEST-${transactionRef}`,
          referenceNumber: transactionRef,
          state: 'APPROVED',
          timestamp: new Date().toISOString()
        }
        paymentStatus = 'completed'

        // Auto-confirm in test mode after 60 seconds
        setTimeout(async () => {
          await supabaseClient
            .from('local_payments')
            .update({
              status: 'completed',
              verified_at: new Date().toISOString(),
              verified_by: 'test_mode_auto',
              waafipay_transaction_id: waafiPayResponse.transactionId
            })
            .eq('id', paymentRecord.id)

          await supabaseClient
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              payment_date: new Date().toISOString()
            })
            .eq('id', booking_id)

          // Send notifications
          await supabaseClient.from('notifications').insert([
            {
              user_id: booking.professional_id,
              type: 'payment_received',
              title: 'Paiement reçu (TEST)',
              message: `Paiement test de ${totalAmount} DJF reçu via WaafiPay. Vous recevrez ${professionalAmount} DJF (90%) sous 7 jours après la prestation.`,
              related_id: booking_id
            },
            {
              user_id: booking.client_id,
              type: 'payment_confirmed',
              title: 'Paiement confirmé (TEST)',
              message: `Votre paiement test de ${totalAmount} DJF via WaafiPay a été confirmé. Réservation confirmée !`,
              related_id: booking_id
            }
          ])
        }, 60000)
      } else {
        // Production mode - call real WaafiPay API
        try {
          const waafiPayRequest = {
            schemaVersion: '1.0',
            requestId: transactionRef,
            timestamp: new Date().toISOString(),
            channelName: 'WEB',
            serviceName: 'API_PURCHASE',
            serviceParams: {
              merchantUid: WAAFIPAY_MERCHANT_ID,
              apiUserId: WAAFIPAY_API_USER_ID,
              apiKey: WAAFIPAY_API_KEY,
              paymentMethod: 'MWALLET_ACCOUNT',
              payerInfo: {
                accountNo: formattedPhone
              },
              transactionInfo: {
                referenceId: transactionRef,
                invoiceId: booking_id,
                amount: totalAmount,
                currency: 'USD', // WaafiPay uses USD
                description: `DjibGo - ${booking.service?.title || 'Service'}`,
                merchantNote: `Booking ${booking_id}`
              }
            }
          }

          const waafiPayApiResponse = await fetch(`${WAAFIPAY_API_URL}/asm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(waafiPayRequest)
          })

          waafiPayResponse = await waafiPayApiResponse.json()

          // Check if payment was successful
          if (waafiPayResponse.responseCode === '2001' && waafiPayResponse.state === 'APPROVED') {
            paymentStatus = 'completed'

            // Update payment record
            await supabaseClient
              .from('local_payments')
              .update({
                status: 'completed',
                verified_at: new Date().toISOString(),
                verified_by: 'waafipay_api',
                waafipay_transaction_id: waafiPayResponse.transactionId
              })
              .eq('id', paymentRecord.id)

            // Update booking
            await supabaseClient
              .from('bookings')
              .update({
                status: 'confirmed',
                payment_status: 'paid',
                payment_date: new Date().toISOString()
              })
              .eq('id', booking_id)

            // Send notifications
            await supabaseClient.from('notifications').insert([
              {
                user_id: booking.professional_id,
                type: 'payment_received',
                title: 'Paiement reçu',
                message: `Paiement de ${totalAmount} DJF reçu via WaafiPay. Vous recevrez ${professionalAmount} DJF (90%) sous 7 jours après la prestation.`,
                related_id: booking_id
              },
              {
                user_id: booking.client_id,
                type: 'payment_confirmed',
                title: 'Paiement confirmé',
                message: `Votre paiement de ${totalAmount} DJF via WaafiPay a été confirmé. Réservation confirmée !`,
                related_id: booking_id
              }
            ])

            // Send SMS to professional
            if (booking.professional?.phone) {
              try {
                await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms-notification`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phone_number: booking.professional.phone,
                    message: `DjibGo: Paiement confirmé ! ${booking.client?.full_name} a payé ${totalAmount} DJF via WaafiPay. Service: ${booking.service?.title}. Connectez-vous pour les détails.`,
                    booking_id: booking_id
                  })
                })
              } catch (smsError) {
                console.error('SMS error:', smsError)
              }
            }
          } else {
            paymentStatus = 'failed'
            await supabaseClient
              .from('local_payments')
              .update({
                status: 'failed',
                error_message: waafiPayResponse.responseMsg || 'Payment failed'
              })
              .eq('id', paymentRecord.id)
          }
        } catch (apiError) {
          console.error('WaafiPay API error:', apiError)
          paymentStatus = 'failed'
          await supabaseClient
            .from('local_payments')
            .update({
              status: 'failed',
              error_message: apiError.message
            })
            .eq('id', paymentRecord.id)
        }
      }

      // Send initial notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'payment_initiated',
          title: 'Paiement initié',
          message: `Votre paiement WaafiPay de ${totalAmount} DJF a été initié. ${test_mode || TEST_MODE ? '(MODE TEST)' : 'Veuillez compléter le paiement sur votre téléphone.'}`,
          related_id: booking_id
        })

      return new Response(
        JSON.stringify({
          success: paymentStatus === 'completed' || paymentStatus === 'pending',
          payment_id: paymentRecord.id,
          transaction_reference: transactionRef,
          payment_method: 'waafipay',
          amount: totalAmount,
          commission_amount: commissionAmount,
          professional_amount: professionalAmount,
          phone_number: formattedPhone,
          status: paymentStatus,
          test_mode: test_mode || TEST_MODE,
          waafipay_response: waafiPayResponse,
          instructions: test_mode || TEST_MODE 
            ? `MODE TEST ACTIVÉ\n\nNuméro test: ${TEST_PHONE}\nPIN test: ${TEST_PIN}\n\nLe paiement sera automatiquement confirmé dans 60 secondes.`
            : `1. Ouvrez l'application WaafiPay\n2. Entrez le code marchand: DJIBGO\n3. Montant: ${totalAmount} DJF\n4. Référence: ${transactionRef}\n5. Confirmez le paiement`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // VERIFY PAYMENT STATUS
    if (action === 'verify_payment') {
      const { payment_id } = await req.json()

      const { data: payment, error: paymentError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*, service:services(title))')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: 'Paiement non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // In production, you could query WaafiPay API to verify status
      // For now, return stored status

      return new Response(
        JSON.stringify({
          status: payment.status,
          transaction_reference: payment.transaction_reference,
          amount: payment.amount,
          payment_method: payment.payment_method,
          initiated_at: payment.initiated_at,
          verified_at: payment.verified_at,
          waafipay_transaction_id: payment.waafipay_transaction_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PAYMENT HISTORY
    if (action === 'get_payment_history') {
      const { data: payments, error: paymentsError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*, service:services(title), professional:profiles!bookings_professional_id_fkey(full_name))')
        .eq('user_id', user.id)
        .eq('payment_method', 'waafipay')
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

    // REFUND PAYMENT
    if (action === 'refund_payment') {
      const { payment_id, reason } = await req.json()

      const { data: payment, error: paymentError } = await supabaseClient
        .from('local_payments')
        .select('*, booking:bookings(*)')
        .eq('id', payment_id)
        .single()

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: 'Paiement non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (payment.status === 'refunded') {
        return new Response(
          JSON.stringify({ error: 'Ce paiement a déjà été remboursé' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate refund based on cancellation policy
      const scheduledDate = new Date(payment.booking.scheduled_date)
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
            message: 'Les annulations moins de 12h avant ne sont pas remboursables.',
            hoursUntilService: hoursUntilService.toFixed(1)
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const refundAmount = payment.amount * refundPercentage

      // Update payment status
      await supabaseClient
        .from('local_payments')
        .update({
          status: 'refunded',
          refund_amount: refundAmount,
          refund_percentage: refundPercentage * 100,
          refund_reason: refundReason,
          refunded_at: new Date().toISOString()
        })
        .eq('id', payment_id)

      // Update booking
      await supabaseClient
        .from('bookings')
        .update({
          status: 'cancelled',
          payment_status: 'refunded',
          refund_amount: refundAmount,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', payment.booking_id)

      // Send notifications
      await supabaseClient.from('notifications').insert([
        {
          user_id: payment.booking.professional_id,
          type: 'booking_cancelled',
          title: 'Réservation annulée',
          message: `Réservation annulée. Remboursement: ${refundPercentage * 100}%`,
          related_id: payment.booking_id
        },
        {
          user_id: payment.booking.client_id,
          type: 'refund_processed',
          title: 'Remboursement traité',
          message: `Remboursement de ${refundAmount.toFixed(0)} DJF (${refundPercentage * 100}%) traité. ${refundReason}`,
          related_id: payment.booking_id
        }
      ])

      return new Response(
        JSON.stringify({
          success: true,
          refund_amount: refundAmount,
          refund_percentage: refundPercentage * 100,
          reason: refundReason
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Action non reconnue' }),
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