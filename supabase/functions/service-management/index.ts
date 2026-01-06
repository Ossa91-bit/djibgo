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

    const { action, service_id, service_data, filters } = await req.json()

    // CREATE SERVICE
    if (action === 'create') {
      // Verify user is a professional
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single()

      if (profile?.user_type !== 'professional') {
        return new Response(
          JSON.stringify({ error: 'Seuls les professionnels peuvent créer des services' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: service, error: serviceError } = await supabaseClient
        .from('services')
        .insert({
          professional_id: user.id,
          name: service_data.name,
          category: service_data.category,
          description: service_data.description,
          base_price: service_data.base_price,
          duration_hours: service_data.duration_hours || 1,
          is_active: true
        })
        .select()
        .single()

      if (serviceError) {
        return new Response(
          JSON.stringify({ error: serviceError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, service }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // UPDATE SERVICE
    if (action === 'update') {
      // Verify ownership
      const { data: service } = await supabaseClient
        .from('services')
        .select('professional_id')
        .eq('id', service_id)
        .single()

      if (!service || service.professional_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: updateError } = await supabaseClient
        .from('services')
        .update({
          name: service_data.name,
          category: service_data.category,
          description: service_data.description,
          base_price: service_data.base_price,
          duration_hours: service_data.duration_hours,
          is_active: service_data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', service_id)

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

    // DELETE SERVICE
    if (action === 'delete') {
      // Verify ownership
      const { data: service } = await supabaseClient
        .from('services')
        .select('professional_id')
        .eq('id', service_id)
        .single()

      if (!service || service.professional_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Non autorisé' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Soft delete by setting is_active to false
      const { error: deleteError } = await supabaseClient
        .from('services')
        .update({ is_active: false })
        .eq('id', service_id)

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET PROFESSIONAL SERVICES
    if (action === 'get_professional_services') {
      const { data: services, error: servicesError } = await supabaseClient
        .from('services')
        .select('*')
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })

      if (servicesError) {
        return new Response(
          JSON.stringify({ error: servicesError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ services }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SEARCH SERVICES
    if (action === 'search') {
      let query = supabaseClient
        .from('services')
        .select(`
          *,
          professional:profiles!services_professional_id_fkey(
            full_name,
            avatar_url,
            city
          ),
          professional_profile:professional_profiles!services_professional_id_fkey(
            rating,
            total_reviews,
            is_verified
          )
        `)
        .eq('is_active', true)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.min_price) {
        query = query.gte('base_price', filters.min_price)
      }

      if (filters?.max_price) {
        query = query.lte('base_price', filters.max_price)
      }

      if (filters?.city) {
        query = query.eq('professional.city', filters.city)
      }

      query = query.order('created_at', { ascending: false })

      const { data: services, error: searchError } = await query

      if (searchError) {
        return new Response(
          JSON.stringify({ error: searchError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ services }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET SERVICE DETAILS
    if (action === 'get_service') {
      const { data: service, error: serviceError } = await supabaseClient
        .from('services')
        .select(`
          *,
          professional:profiles!services_professional_id_fkey(
            full_name,
            phone,
            avatar_url,
            city
          ),
          professional_profile:professional_profiles!services_professional_id_fkey(
            rating,
            total_reviews,
            experience_years,
            is_verified
          )
        `)
        .eq('id', service_id)
        .single()

      if (serviceError) {
        return new Response(
          JSON.stringify({ error: 'Service non trouvé' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ service }),
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