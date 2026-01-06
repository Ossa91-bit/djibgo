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

    // Récupérer toutes les notifications de rappel WhatsApp à envoyer
    const now = new Date().toISOString()
    
    const { data: notifications, error: notifError } = await supabaseClient
      .from('notifications')
      .select('*, profiles!inner(full_name, phone)')
      .eq('whatsapp_reminder', true)
      .lte('scheduled_for', now)
      .is('sent_at', null)

    if (notifError) {
      console.error('Erreur récupération notifications:', notifError)
      return new Response(
        JSON.stringify({ error: notifError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucune notification à envoyer' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const results = []

    for (const notification of notifications) {
      try {
        const profile = notification.profiles
        const userName = profile.full_name || 'Utilisateur'
        let phoneNumber = notification.whatsapp_phone || profile.phone

        if (!phoneNumber) {
          console.log(`Pas de numéro pour l'utilisateur ${notification.user_id}`)
          continue
        }

        // Formater le numéro
        phoneNumber = phoneNumber.replace(/\s+/g, '')
        if (!phoneNumber.startsWith('+')) {
          phoneNumber = '+253' + phoneNumber.replace(/^0+/, '')
        }

        // Message de rappel
        const message = `⏰ *Rappel Important - DjibGo*

Bonjour ${userName},

🔐 Votre mot de passe temporaire expire dans *1 heure* !

Pour sécuriser votre compte, veuillez :

1. Vous connecter à votre compte
2. Aller dans "Mon Profil"
3. Changer votre mot de passe

⚠️ *Après expiration, vous devrez demander un nouveau mot de passe temporaire.*

🛡️ La sécurité de votre compte est notre priorité.

_DjibGo Service - Votre plateforme de confiance_`

        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

        // Marquer la notification comme envoyée
        await supabaseClient
          .from('notifications')
          .update({ 
            sent_at: new Date().toISOString(),
            whatsapp_url: whatsappUrl
          })
          .eq('id', notification.id)

        // Log
        await supabaseClient
          .from('sms_logs')
          .insert({
            phone_number: phoneNumber,
            message: 'Rappel changement mot de passe par WhatsApp',
            status: 'sent',
            provider: 'whatsapp',
            user_id: notification.user_id
          })

        results.push({
          userId: notification.user_id,
          phone: phoneNumber,
          status: 'sent',
          whatsappUrl: whatsappUrl
        })

      } catch (error) {
        console.error(`Erreur pour notification ${notification.id}:`, error)
        results.push({
          userId: notification.user_id,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${results.length} rappels traités`,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})