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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔄 Starting profile statistics synchronization...')

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, phone')

    if (profilesError) {
      throw new Error(`Error fetching profiles: ${profilesError.message}`)
    }

    console.log(`📊 Found ${profiles?.length || 0} profiles to update`)

    let updatedCount = 0
    let errorCount = 0

    // Update each profile
    for (const profile of profiles || []) {
      try {
        // Calculate booking statistics
        const { data: bookings } = await supabaseClient
          .from('bookings')
          .select('status, total_amount')
          .eq('client_id', profile.id)

        const totalBookings = bookings?.length || 0
        const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
        const totalSpent = bookings
          ?.filter(b => b.status === 'completed')
          ?.reduce((sum, b) => sum + parseFloat(b.total_amount || '0'), 0) || 0

        // Calculate review statistics
        const { data: reviews } = await supabaseClient
          .from('reviews')
          .select('id')
          .eq('client_id', profile.id)

        const totalReviews = reviews?.length || 0

        // Update profile with calculated statistics
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            total_bookings: totalBookings,
            completed_bookings: completedBookings,
            total_spent: totalSpent,
            total_reviews: totalReviews
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`❌ Error updating profile ${profile.id}:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ Updated profile ${profile.id}: ${totalBookings} bookings, ${completedBookings} completed, ${totalReviews} reviews`)
          updatedCount++
        }

        // Sync phone number to Auth metadata if exists
        if (profile.phone) {
          try {
            const { error: authUpdateError } = await supabaseClient.auth.admin.updateUserById(
              profile.id,
              {
                phone: profile.phone,
                user_metadata: {
                  phone: profile.phone
                }
              }
            )

            if (authUpdateError) {
              console.log(`⚠️ Could not sync phone for ${profile.id}: ${authUpdateError.message}`)
            } else {
              console.log(`📱 Synced phone number for ${profile.id}`)
            }
          } catch (phoneError) {
            console.log(`⚠️ Phone sync skipped for ${profile.id}`)
          }
        }

      } catch (error) {
        console.error(`❌ Error processing profile ${profile.id}:`, error.message)
        errorCount++
      }
    }

    console.log(`\n✨ Synchronization complete!`)
    console.log(`✅ Successfully updated: ${updatedCount}`)
    console.log(`❌ Errors: ${errorCount}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile statistics synchronized successfully',
        stats: {
          total: profiles?.length || 0,
          updated: updatedCount,
          errors: errorCount
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ Fatal error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})