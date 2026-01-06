import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to update client review statistics
async function updateClientReviewStats(supabaseClient: any, clientId: string) {
  try {
    // Get all reviews by this client
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('id')
      .eq('client_id', clientId)

    const totalReviews = reviews?.length || 0

    // Update profile statistics
    await supabaseClient
      .from('profiles')
      .update({
        total_reviews: totalReviews
      })
      .eq('id', clientId)

    console.log(`✅ Updated review stats for client ${clientId}: ${totalReviews} reviews`)
  } catch (error) {
    console.error('Error updating client review stats:', error)
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, review_data, professional_id, booking_id } = await req.json()

    // CREATE REVIEW
    if (action === 'create') {
      // Verify booking exists and is completed
      const { data: booking } = await supabaseClient
        .from('bookings')
        .select('id, client_id, professional_id, status')
        .eq('id', booking_id)
        .eq('client_id', user.id)
        .eq('status', 'completed')
        .single()

      if (!booking) {
        return new Response(
          JSON.stringify({ error: 'Réservation non trouvée ou non terminée' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Check if review already exists
      const { data: existingReview } = await supabaseClient
        .from('reviews')
        .select('id')
        .eq('booking_id', booking_id)
        .maybeSingle()

      if (existingReview) {
        return new Response(
          JSON.stringify({ error: 'Vous avez déjà laissé un avis pour cette réservation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create review
      const { data: review, error: reviewError } = await supabaseClient
        .from('reviews')
        .insert({
          professional_id: booking.professional_id,
          client_id: user.id,
          booking_id: booking_id,
          rating: review_data.rating,
          comment: review_data.comment
        })
        .select()
        .single()

      if (reviewError) {
        return new Response(
          JSON.stringify({ error: reviewError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update client review statistics
      await updateClientReviewStats(supabaseClient, user.id)

      // Update professional rating
      const { data: allReviews } = await supabaseClient
        .from('reviews')
        .select('rating')
        .eq('professional_id', booking.professional_id)

      if (allReviews && allReviews.length > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        
        await supabaseClient
          .from('professional_profiles')
          .update({
            rating: Math.round(avgRating * 10) / 10,
            total_reviews: allReviews.length
          })
          .eq('user_id', booking.professional_id)
      }

      // Create notification
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: booking.professional_id,
          type: 'new_review',
          title: 'Nouvel avis',
          message: `Vous avez reçu un nouvel avis avec ${review_data.rating} étoiles`,
          related_id: review.id
        })

      return new Response(
        JSON.stringify({ success: true, review }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PROFESSIONAL REVIEWS
    if (action === 'get_reviews') {
      const { data: reviews, error: reviewsError } = await supabaseClient
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(full_name, avatar_url),
          booking:bookings(service_id)
        `)
        .eq('professional_id', professional_id)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        return new Response(
          JSON.stringify({ error: reviewsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate rating distribution
      const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      reviews?.forEach(review => {
        distribution[review.rating] = (distribution[review.rating] || 0) + 1
      })

      return new Response(
        JSON.stringify({ reviews, distribution }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET USER REVIEWS (reviews written by user)
    if (action === 'get_user_reviews') {
      const { data: reviews, error: reviewsError } = await supabaseClient
        .from('reviews')
        .select(`
          *,
          professional:profiles!reviews_professional_id_fkey(full_name, avatar_url),
          booking:bookings(service_id)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (reviewsError) {
        return new Response(
          JSON.stringify({ error: reviewsError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ reviews }),
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