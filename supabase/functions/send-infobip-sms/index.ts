import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  type?: string;
  bookingId?: string;
  userId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const infobipApiKey = Deno.env.get('INFOBIP_API_KEY');
    const infobipBaseUrl = Deno.env.get('INFOBIP_BASE_URL');

    console.log('📱 Infobip Config:', {
      hasApiKey: !!infobipApiKey,
      hasBaseUrl: !!infobipBaseUrl,
      baseUrl: infobipBaseUrl
    });

    if (!infobipApiKey || !infobipBaseUrl) {
      throw new Error('Infobip credentials not configured');
    }

    const { to, message, type = 'general', bookingId, userId }: SMSRequest = await req.json();

    console.log('📤 SMS Request:', { to, type, bookingId, messageLength: message?.length });

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number (remove spaces, add + if missing)
    let formattedPhone = to.replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log('📞 Formatted phone:', formattedPhone);

    // Send SMS via Infobip
    const infobipUrl = `https://${infobipBaseUrl}/sms/2/text/advanced`;
    console.log('🌐 Infobip URL:', infobipUrl);

    const infobipResponse = await fetch(infobipUrl, {
      method: 'POST',
      headers: {
        'Authorization': `App ${infobipApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            destinations: [{ to: formattedPhone }],
            from: 'DjibGo',
            text: message,
          },
        ],
      }),
    });

    const infobipData = await infobipResponse.json();
    console.log('📨 Infobip Response:', { 
      ok: infobipResponse.ok, 
      status: infobipResponse.status,
      data: infobipData 
    });

    // Determine status
    const smsStatus = infobipResponse.ok ? 'sent' : 'failed';
    const errorMessage = !infobipResponse.ok ? JSON.stringify(infobipData) : null;

    // Log SMS in database
    const smsLog = {
      recipient_phone: formattedPhone,
      message,
      status: smsStatus,
      error_message: errorMessage,
      type,
      booking_id: bookingId || null,
      user_id: userId || null,
      provider: 'infobip',
      provider_response: infobipData,
      sent_at: new Date().toISOString(),
    };

    console.log('💾 Saving SMS log:', { 
      phone: formattedPhone, 
      status: smsStatus,
      type,
      bookingId 
    });

    const { error: logError } = await supabase
      .from('sms_logs')
      .insert(smsLog);

    if (logError) {
      console.error('❌ Error logging SMS:', logError);
    } else {
      console.log('✅ SMS log saved successfully');
    }

    if (!infobipResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send SMS', 
          details: infobipData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: infobipData.messages?.[0]?.messageId,
        status: infobipData.messages?.[0]?.status?.groupName,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in send-infobip-sms function:', error);
    
    // Try to log the error in database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('sms_logs').insert({
        recipient_phone: 'ERROR',
        message: 'Error occurred',
        status: 'failed',
        error_message: error.message,
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});