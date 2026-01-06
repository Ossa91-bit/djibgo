import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to update client profile statistics
async function updateClientStats(supabaseClient: any, clientId: string) {
  try {
    // Get all bookings for this client
    const { data: bookings } = await supabaseClient
      .from('bookings')
      .select('status, total_amount')
      .eq('client_id', clientId)

    const totalBookings = bookings?.length || 0
    const completedBookings = bookings?.filter((b: any) => b.status === 'completed').length || 0
    const totalSpent = bookings
      ?.filter((b: any) => b.status === 'completed')
      ?.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || '0'), 0) || 0

    // Update profile statistics
    await supabaseClient
      .from('profiles')
      .update({
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        total_spent: totalSpent
      })
      .eq('id', clientId)

    console.log(`✅ Updated stats for client ${clientId}: ${totalBookings} bookings, ${completedBookings} completed`)
  } catch (error) {
    console.error('Error updating client stats:', error)
  }
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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const requestBody = await req.json()
    const { action, booking_id, booking_data, status, filters, bookingId, refundPercentage } = requestBody

    // CREATE BOOKING
    if (action === 'create') {
      const { error: bookingError, data: booking } = await supabaseClient
        .from('bookings')
        .insert({
          client_id: user.id,
          professional_id: booking_data.professional_id,
          service_id: booking_data.service_id,
          booking_date: booking_data.booking_date,
          booking_time: booking_data.booking_time,
          duration_hours: booking_data.duration_hours || 1,
          total_price: booking_data.total_price,
          address: booking_data.address,
          city: booking_data.city,
          description: booking_data.description,
          status: 'pending'
        })
        .select()
        .single()

      if (bookingError) {
        return new Response(
          JSON.stringify({ error: bookingError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update client statistics
      await updateClientStats(supabaseClient, user.id)

      // Create notification for professional
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking_data.professional_id,
          type: 'new_booking',
          title: 'Nouvelle réservation',
          message: `Vous avez reçu une nouvelle demande de réservation`,
          related_id: booking.id
        })

      return new Response(
        JSON.stringify({ success: true, booking }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE BOOKING STATUS
    if (action === 'update_status') {
      // Verify user is authorized (client or professional)
      const { data: bookingCheck } = await supabaseClient
        .from('bookings')
        .select('client_id, professional_id')
        .eq('id', booking_id)
        .single()

      if (!bookingCheck || (bookingCheck.client_id !== user.id && bookingCheck.professional_id !== user.id)) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', booking_id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update client statistics (especially important when status changes to 'completed')
      await updateClientStats(supabaseClient, bookingCheck.client_id)

      // Create notification
      const notificationUserId = bookingCheck.professional_id === user.id 
        ? bookingCheck.client_id 
        : bookingCheck.professional_id

      let notificationMessage = ''
      if (status === 'confirmed') notificationMessage = 'Votre réservation a été confirmée'
      else if (status === 'cancelled') notificationMessage = 'Votre réservation a été annulée'
      else if (status === 'completed') notificationMessage = 'Votre réservation est terminée'

      await supabaseClient
        .from('notifications')
        .insert({
          user_id: notificationUserId,
          type: 'booking_update',
          title: 'Mise à jour de réservation',
          message: notificationMessage,
          related_id: booking_id
        })

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET USER BOOKINGS
    if (action === 'get_user_bookings') {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      let query = supabaseClient
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, phone, avatar_url),
          professional:profiles!bookings_professional_id_fkey(full_name, phone, avatar_url),
          service:services(name, category)
        `)

      if (profile?.user_type === 'professional') {
        query = query.eq('professional_id', user.id)
      } else {
        query = query.eq('client_id', user.id)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      query = query.order('created_at', { ascending: false })

      const { data: bookings, error: bookingsError } = await query

      if (bookingsError) {
        return new Response(
          JSON.stringify({ error: bookingsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ bookings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET BOOKING DETAILS
    if (action === 'get_booking') {
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select(`
          *,
          client:profiles!bookings_client_id_fkey(full_name, phone, avatar_url, address, city),
          professional:profiles!bookings_professional_id_fkey(full_name, phone, avatar_url),
          service:services(name, category, description)
        `)
        .eq('id', booking_id)
        .single()

      if (bookingError || !booking) {
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify authorization
      if (booking.client_id !== user.id && booking.professional_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ booking }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // CANCEL BOOKING WITH REFUND
    if (action === 'cancel_booking') {
      const targetBookingId = bookingId || booking_id
      
      // Get booking details
      const { data: booking, error: bookingError } = await supabaseClient
        .from('bookings')
        .select('*, client:profiles!bookings_client_id_fkey(full_name), professional:profiles!bookings_professional_id_fkey(full_name)')
        .eq('id', targetBookingId)
        .single()

      if (bookingError || !booking) {
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify authorization (only client can cancel)
      if (booking.client_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if booking can be cancelled
      if (booking.status === 'cancelled') {
        return new Response(
          JSON.stringify({ error: 'Cette réservation est déjà annulée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (booking.status === 'completed') {
        return new Response(
          JSON.stringify({ error: 'Impossible d\'annuler une réservation terminée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate refund amount
      const refundAmount = parseFloat(booking.total_price) * (refundPercentage / 100)

      // Update booking status
      const { error: updateError } = await supabaseClient
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetBookingId)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Erreur lors de la mise à jour de la réservation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Process refund if applicable
      if (refundPercentage > 0 && booking.payment_status === 'paid') {
        // Add refund to client wallet
        await supabaseClient
          .from('wallet_transactions')
          .insert({
            user_id: booking.client_id,
            type: 'refund',
            amount: refundAmount,
            description: `Remboursement ${refundPercentage}% - Réservation #${targetBookingId.slice(0, 8)}`,
            status: 'completed',
            related_booking_id: targetBookingId
          })

        // Update client wallet balance
        const { data: clientWallet } = await supabaseClient
          .from('professional_wallets')
          .select('available_balance')
          .eq('user_id', booking.client_id)
          .single()

        if (clientWallet) {
          await supabaseClient
            .from('professional_wallets')
            .update({
              available_balance: parseFloat(clientWallet.available_balance) + refundAmount
            })
            .eq('user_id', booking.client_id)
        } else {
          // Create wallet if doesn't exist
          await supabaseClient
            .from('professional_wallets')
            .insert({
              user_id: booking.client_id,
              available_balance: refundAmount,
              pending_balance: 0,
              total_earned: 0
            })
        }
      }

      // Update client statistics
      await updateClientStats(supabaseClient, booking.client_id)

      // Send notifications
      await supabaseClient
        .from('notifications')
        .insert([
          {
            user_id: booking.client_id,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: refundPercentage > 0 
              ? `Votre réservation a été annulée. Remboursement de ${refundPercentage}% (${refundAmount.toFixed(2)} DJF) crédité sur votre portefeuille.`
              : 'Votre réservation a été annulée.',
            related_id: targetBookingId
          },
          {
            user_id: booking.professional_id,
            type: 'booking_cancelled',
            title: 'Réservation annulée',
            message: `La réservation avec ${booking.client.full_name} a été annulée par le client.`,
            related_id: targetBookingId
          }
        ])

      return new Response(
        JSON.stringify({ 
          success: true, 
          refundAmount,
          refundPercentage 
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