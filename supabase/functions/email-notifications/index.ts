import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Configuration email (utilise Resend ou SendGrid)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = 'noreply@votre-domaine.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { action, booking_id, payment_data, user_email, user_name } = await req.json()

    // SEND PAYMENT CONFIRMATION EMAIL
    if (action === 'send_payment_confirmation') {
      const { 
        amount, 
        service_name, 
        professional_name, 
        scheduled_date,
        payment_method,
        transaction_id,
        commission_amount,
        booking_reference
      } = payment_data

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .amount { font-size: 32px; font-weight: bold; color: #14B8A6; text-align: center; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: 600; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .button { background: #14B8A6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Paiement Confirmé</h1>
              <p>Votre réservation est confirmée</p>
            </div>
            <div class="content">
              <p>Bonjour ${user_name},</p>
              <p>Nous avons bien reçu votre paiement. Voici les détails de votre transaction :</p>
              
              <div class="card">
                <div class="success-badge">✓ Paiement réussi</div>
                <div class="amount">${amount} DJF</div>
                
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Professionnel</span>
                  <span class="detail-value">${professional_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date prévue</span>
                  <span class="detail-value">${new Date(scheduled_date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Référence</span>
                  <span class="detail-value">#${booking_reference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Méthode de paiement</span>
                  <span class="detail-value">${payment_method || 'Carte bancaire'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">ID Transaction</span>
                  <span class="detail-value">${transaction_id}</span>
                </div>
              </div>

              <div class="card">
                <h3>📋 Prochaines étapes</h3>
                <ul>
                  <li>Le professionnel a été notifié de votre réservation</li>
                  <li>Vous recevrez une confirmation par SMS</li>
                  <li>Le professionnel vous contactera avant la date prévue</li>
                  <li>Vous pouvez suivre votre réservation dans votre tableau de bord</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL')}/dashboard" class="button">Voir ma réservation</a>
              </div>

              <div class="card" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
                <h4 style="margin-top: 0;">💡 Politique d'annulation</h4>
                <p style="margin-bottom: 0; font-size: 14px;">
                  • Plus de 24h avant : Remboursement complet (100%)<br>
                  • Entre 12h et 24h : Remboursement partiel (50%)<br>
                  • Moins de 12h : Aucun remboursement
                </p>
              </div>

              <p>Merci de votre confiance !</p>
              <p>L'équipe Readdy Services</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>Pour toute question, contactez notre support : support@votre-domaine.com</p>
              <p>&copy; ${new Date().getFullYear()} Readdy Services. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `

      // Envoi via Resend API
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user_email,
          subject: `✅ Paiement confirmé - ${service_name} - ${amount} DJF`,
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
        JSON.stringify({ success: true, emailId: emailResult.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SEND PAYMENT RECEIPT TO PROFESSIONAL
    if (action === 'send_professional_notification') {
      const { 
        amount, 
        service_name, 
        client_name, 
        scheduled_date,
        commission_amount,
        net_amount,
        booking_reference
      } = payment_data

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .amount { font-size: 32px; font-weight: bold; color: #14B8A6; text-align: center; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-label { color: #6b7280; }
            .detail-value { font-weight: 600; }
            .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .button { background: #14B8A6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💰 Nouveau Paiement Reçu</h1>
              <p>Une nouvelle réservation a été payée</p>
            </div>
            <div class="content">
              <p>Bonjour ${user_name},</p>
              <p>Bonne nouvelle ! Un client a payé pour votre service. Voici les détails :</p>
              
              <div class="card">
                <div class="success-badge">✓ Paiement reçu</div>
                <div class="amount">${net_amount} DJF</div>
                <p style="text-align: center; color: #6b7280; font-size: 14px;">Votre gain net (après commission de 10%)</p>
                
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Client</span>
                  <span class="detail-value">${client_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date prévue</span>
                  <span class="detail-value">${new Date(scheduled_date).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Référence</span>
                  <span class="detail-value">#${booking_reference}</span>
                </div>
              </div>

              <div class="card">
                <h3>💵 Détails financiers</h3>
                <div class="detail-row">
                  <span class="detail-label">Montant total</span>
                  <span class="detail-value">${amount} DJF</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Commission plateforme (10%)</span>
                  <span class="detail-value">-${commission_amount} DJF</span>
                </div>
                <div class="detail-row" style="border-bottom: none; font-size: 18px;">
                  <span class="detail-label" style="color: #14B8A6; font-weight: bold;">Votre gain</span>
                  <span class="detail-value" style="color: #14B8A6;">${net_amount} DJF</span>
                </div>
              </div>

              <div class="card">
                <h3>📋 Prochaines étapes</h3>
                <ul>
                  <li>Contactez le client avant la date prévue</li>
                  <li>Préparez le matériel nécessaire</li>
                  <li>Effectuez la prestation à la date convenue</li>
                  <li>Marquez la réservation comme "Terminée" après la prestation</li>
                  <li>Vous recevrez votre paiement sous 7 jours ouvrables après la prestation</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${Deno.env.get('SITE_URL')}/dashboard" class="button">Voir la réservation</a>
              </div>

              <div class="card" style="background: #dbeafe; border-left: 4px solid #3b82f6;">
                <h4 style="margin-top: 0;">ℹ️ Informations importantes</h4>
                <p style="margin-bottom: 0; font-size: 14px;">
                  • Le paiement sera transféré sur votre compte 7 jours après la prestation<br>
                  • Assurez-vous que vos informations bancaires sont à jour<br>
                  • En cas d'annulation, le remboursement sera géré automatiquement
                </p>
              </div>

              <p>Bonne prestation !</p>
              <p>L'équipe Readdy Services</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>Pour toute question, contactez notre support : support@votre-domaine.com</p>
              <p>&copy; ${new Date().getFullYear()} Readdy Services. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: user_email,
          subject: `💰 Nouveau paiement reçu - ${service_name} - ${net_amount} DJF`,
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
        JSON.stringify({ success: true, emailId: emailResult.id }),
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