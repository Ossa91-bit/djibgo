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
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Générer le lien de réinitialisation
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://gthnwj.readdy.co/reset-password'
      }
    })

    if (error) {
      console.error('Erreur génération lien:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer les informations de l'utilisateur
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .single()

    const userName = profile?.full_name || 'Utilisateur'

    // Construire l'email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f97316 0%, #14B8A6 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #ffffff; padding: 40px 30px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { 
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #14B8A6 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .info-box { 
            background: #fef3c7; 
            border-left: 4px solid #f59e0b; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 4px;
          }
          .security-box {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer { 
            background: #f9fafb; 
            text-align: center; 
            color: #6b7280; 
            font-size: 12px; 
            padding: 30px; 
            border-radius: 0 0 10px 10px;
            border: 1px solid #e5e7eb;
          }
          .logo { 
            width: 60px; 
            height: 60px; 
            background: white; 
            border-radius: 50%; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            font-size: 30px; 
            margin-bottom: 15px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐</div>
            <h1>Réinitialisation de mot de passe</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">DjibGo Service</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; margin-bottom: 20px;">Bonjour <strong>${userName}</strong>,</p>
            
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte DjibGo Service.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
            
            <div class="button-container">
              <a href="${data.properties.action_link}" class="button">
                🔑 Réinitialiser mon mot de passe
              </a>
            </div>
            
            <div class="info-box">
              <p style="margin: 0; font-size: 14px;">
                <strong>⏰ Important :</strong> Ce lien est valide pendant <strong>1 heure</strong>. 
                Après ce délai, vous devrez faire une nouvelle demande.
              </p>
            </div>
            
            <div class="security-box">
              <p style="margin: 0 0 10px 0; font-weight: bold; color: #1e40af;">
                🛡️ Sécurité de votre compte
              </p>
              <p style="margin: 0; font-size: 14px; color: #1e40af;">
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. 
                Votre mot de passe actuel reste inchangé et votre compte est sécurisé.
              </p>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
            </p>
            <p style="word-break: break-all; font-size: 12px; color: #6b7280; background: #f3f4f6; padding: 10px; border-radius: 4px;">
              ${data.properties.action_link}
            </p>
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe DjibGo Service</strong>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong>DjibGo Service</strong> - Votre plateforme de services à Djibouti
            </p>
            <p style="margin: 0 0 10px 0;">
              📧 djibgoservice@gmail.com | 🌐 https://gthnwj.readdy.co
            </p>
            <p style="margin: 0; opacity: 0.7;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
            <p style="margin: 10px 0 0 0; opacity: 0.7;">
              &copy; ${new Date().getFullYear()} DjibGo Service. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    // Envoyer l'email via SMTP
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DjibGo Service <djibgoservice@gmail.com>',
        to: email,
        subject: '🔐 Réinitialisation de votre mot de passe - DjibGo Service',
        html: emailHtml,
      }),
    })

    if (!emailResponse.ok) {
      const error = await emailResponse.text()
      console.error('Erreur envoi email:', error)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de l\'envoi de l\'email', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de réinitialisation envoyé avec succès',
        emailId: emailResult.id 
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
