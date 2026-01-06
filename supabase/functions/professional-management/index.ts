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
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, professional_id, profile_data, filters } = await req.json()

    // CREATE PROFESSIONAL PROFILE
    if (action === 'create_profile') {
      // Update user profile to professional
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ user_type: 'professional' })
        .eq('id', user.id)

      if (profileError) {
        return new Response(
          JSON.stringify({ error: profileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create professional profile
      const { data: professionalProfile, error: professionalError } = await supabaseClient
        .from('professional_profiles')
        .insert({
          user_id: user.id,
          business_name: profile_data.business_name,
          service_category: profile_data.service_category,
          experience_years: profile_data.experience_years || 0,
          hourly_rate: profile_data.hourly_rate,
          description: profile_data.description,
          is_verified: false,
          rating: 0,
          total_reviews: 0,
          commission_rate: 15,
          is_premium: false
        })
        .select()
        .single()

      if (professionalError) {
        return new Response(
          JSON.stringify({ error: professionalError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, profile: professionalProfile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE PROFESSIONAL PROFILE
    if (action === 'update_profile') {
      const { error: updateError } = await supabaseClient
        .from('professional_profiles')
        .update({
          business_name: profile_data.business_name,
          service_category: profile_data.service_category,
          experience_years: profile_data.experience_years,
          hourly_rate: profile_data.hourly_rate,
          description: profile_data.description,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PROFESSIONAL PROFILE
    if (action === 'get_profile') {
      const targetId = professional_id || user.id

      const { data: profile, error: profileError } = await supabaseClient
        .from('professional_profiles')
        .select(`
          *,
          profile:profiles!professional_profiles_user_id_fkey(
            full_name,
            phone,
            avatar_url,
            city,
            is_verified
          )
        `)
        .eq('user_id', targetId)
        .single()

      if (profileError) {
        return new Response(
          JSON.stringify({ error: 'Profil non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get reviews
      const { data: reviews } = await supabaseClient
        .from('reviews')
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(full_name, avatar_url)
        `)
        .eq('professional_id', targetId)
        .order('created_at', { ascending: false })
        .limit(10)

      return new Response(
        JSON.stringify({ profile, reviews: reviews || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SEARCH PROFESSIONALS
    if (action === 'search') {
      let query = supabaseClient
        .from('professional_profiles')
        .select(`
          *,
          profile:profiles!professional_profiles_user_id_fkey(
            full_name,
            phone,
            avatar_url,
            city,
            is_verified
          )
        `)

      if (filters?.category) {
        query = query.eq('service_category', filters.category)
      }

      if (filters?.city) {
        query = query.eq('profile.city', filters.city)
      }

      if (filters?.min_rating) {
        query = query.gte('rating', filters.min_rating)
      }

      if (filters?.is_verified) {
        query = query.eq('profile.is_verified', true)
      }

      query = query.order('rating', { ascending: false })

      const { data: professionals, error: searchError } = await query

      if (searchError) {
        return new Response(
          JSON.stringify({ error: searchError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ professionals }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET STATISTICS
    if (action === 'get_stats') {
      const { data: professionalProfile } = await supabaseClient
        .from('professional_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!professionalProfile) {
        return new Response(
          JSON.stringify({ error: 'Profil professionnel non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const [
        { count: totalBookings },
        { count: pendingBookings },
        { count: completedBookings },
        { data: recentBookings }
      ] = await Promise.all([
        supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('professional_id', user.id),
        supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('professional_id', user.id).eq('status', 'pending'),
        supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).eq('professional_id', user.id).eq('status', 'completed'),
        supabaseClient.from('bookings').select('total_price, booking_date').eq('professional_id', user.id).eq('status', 'completed').order('booking_date', { ascending: false }).limit(30)
      ])

      const totalRevenue = recentBookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0

      return new Response(
        JSON.stringify({
          totalBookings: totalBookings || 0,
          pendingBookings: pendingBookings || 0,
          completedBookings: completedBookings || 0,
          totalRevenue
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