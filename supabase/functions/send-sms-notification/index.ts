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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { phone_number, message, booking_id } = await req.json()

    if (!phone_number || !message) {
      return new Response(
        JSON.stringify({ error: 'Numéro de téléphone et message requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📱 Sending SMS via Twilio to:', phone_number)

    // Get Twilio credentials from environment variables
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.log('⚠️ SMS notification skipped - Twilio not configured')
      
      // Log the notification attempt in database
      await supabaseClient
        .from('sms_logs')
        .insert({
          booking_id,
          phone_number,
          message,
          status: 'skipped',
          provider: 'twilio',
          error: 'Twilio not configured',
          created_at: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Notification enregistrée (SMS désactivé)',
          sms_sent: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format phone number (ensure it starts with +)
    let formattedPhone = phone_number.trim()
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

    const formData = new URLSearchParams()
    formData.append('To', formattedPhone)
    formData.append('From', twilioPhoneNumber)
    formData.append('Body', message)

    console.log('📤 Calling Twilio API...')

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      console.error('❌ Twilio API error:', twilioData)
      
      // Log failed SMS
      await supabaseClient
        .from('sms_logs')
        .insert({
          booking_id,
          phone_number: formattedPhone,
          message,
          status: 'failed',
          provider: 'twilio',
          error: JSON.stringify(twilioData),
          created_at: new Date().toISOString()
        })

      return new Response(
        JSON.stringify({ 
          error: 'Échec de l\'envoi du SMS', 
          details: twilioData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ SMS sent successfully via Twilio:', twilioData.sid)

    // Log successful SMS
    await supabaseClient
      .from('sms_logs')
      .insert({
        booking_id,
        phone_number: formattedPhone,
        message,
        status: twilioData.status || 'sent',
        provider: 'twilio',
        message_id: twilioData.sid,
        response: JSON.stringify(twilioData),
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS envoyé avec succès via Twilio',
        sms_sent: true,
        sid: twilioData.sid,
        status: twilioData.status,
        provider: 'twilio'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in send-sms-notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})