import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users from Authentication
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Error fetching users from Authentication' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${users.length} users in Authentication`);

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Error fetching existing profiles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || []);
    console.log(`Found ${existingProfileIds.size} existing profiles`);

    // Find users without profiles
    const usersWithoutProfiles = users.filter(user => !existingProfileIds.has(user.id));
    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    const results = {
      total_auth_users: users.length,
      existing_profiles: existingProfileIds.size,
      missing_profiles: usersWithoutProfiles.length,
      created_profiles: [],
      errors: []
    };

    // Create missing profiles
    for (const authUser of usersWithoutProfiles) {
      try {
        const userType = authUser.user_metadata?.user_type || 'client';
        
        const profileData = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || 
                     authUser.user_metadata?.name || 
                     authUser.email?.split('@')[0] || 
                     'User',
          phone: authUser.user_metadata?.phone || authUser.phone || null,
          user_type: userType,
          is_verified: userType === 'professional' ? false : true,
          avatar_url: authUser.user_metadata?.avatar_url || 
                      authUser.user_metadata?.picture || 
                      null,
          address: authUser.user_metadata?.address || null,
          city: authUser.user_metadata?.city || null,
          created_at: authUser.created_at,
          total_bookings: 0,
          completed_bookings: 0,
          total_reviews: 0
        };

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert(profileData);

        if (profileError) {
          console.error(`Error creating profile for ${authUser.email}:`, profileError);
          results.errors.push({
            user_id: authUser.id,
            email: authUser.email,
            error: profileError.message
          });
          continue;
        }

        console.log(`Created profile for ${authUser.email}`);

        // If professional, create professional profile
        if (userType === 'professional') {
          const { error: professionalError } = await supabaseAdmin
            .from('professional_profiles')
            .insert({
              id: authUser.id,
              service_category: authUser.user_metadata?.service_category || '',
              experience_years: authUser.user_metadata?.experience_years || 0,
              hourly_rate: authUser.user_metadata?.hourly_rate || 0,
              description: authUser.user_metadata?.description || '',
              rating: 0,
              total_reviews: 0,
              is_premium: false,
              is_suspended: false,
              verification_status: 'pending',
              verification_documents: [],
              commission_rate: 15
            });

          if (professionalError) {
            console.error(`Error creating professional profile for ${authUser.email}:`, professionalError);
            results.errors.push({
              user_id: authUser.id,
              email: authUser.email,
              error: `Professional profile: ${professionalError.message}`
            });
          } else {
            console.log(`Created professional profile for ${authUser.email}`);
          }
        }

        // Create welcome notification
        await supabaseAdmin.from('notifications').insert({
          user_id: authUser.id,
          title: 'Welcome to DjibGo',
          message: 'Your profile has been created successfully. You can now use all our services.',
          type: 'info',
          created_at: new Date().toISOString()
        });

        results.created_profiles.push({
          user_id: authUser.id,
          email: authUser.email,
          user_type: userType,
          full_name: profileData.full_name
        });

      } catch (error) {
        console.error(`Error processing user ${authUser.email}:`, error);
        results.errors.push({
          user_id: authUser.id,
          email: authUser.email,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sync completed. Created ${results.created_profiles.length} profiles.`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});