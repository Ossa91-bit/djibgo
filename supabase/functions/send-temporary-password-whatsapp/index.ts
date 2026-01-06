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
    const { email, phone } = await req.json()

    console.log('📥 Requête reçue:', { email, phone })

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Numéro de téléphone requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer l'utilisateur par email depuis auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Erreur auth:', authError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la recherche de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authUser = authUsers.users.find(u => u.email === email)

    if (!authUser) {
      console.log('❌ Utilisateur non trouvé pour:', email)
      return new Response(
        JSON.stringify({ error: 'Aucun compte trouvé avec cette adresse email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Utilisateur trouvé:', authUser.id)

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, full_name, phone')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Erreur profil:', profileError)
      return new Response(
        JSON.stringify({ error: 'Profil utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Profil trouvé:', profile)

    // Formater les numéros de téléphone pour comparaison
    const normalizePhone = (phoneNumber: string) => {
      return phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')
    }

    const inputPhone = normalizePhone(phone)
    const profilePhone = profile.phone ? normalizePhone(profile.phone) : ''

    // Vérifier que le téléphone correspond (si un téléphone est enregistré)
    if (profilePhone && inputPhone !== profilePhone && !inputPhone.endsWith(profilePhone) && !profilePhone.endsWith(inputPhone)) {
      console.log('❌ Téléphone ne correspond pas:', { inputPhone, profilePhone })
      return new Response(
        JSON.stringify({ error: 'Le numéro de téléphone ne correspond pas à celui enregistré pour ce compte' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer un mot de passe temporaire (6 chiffres)
    const temporaryPassword = Math.floor(100000 + Math.random() * 900000).toString()

    console.log('🔐 Mot de passe temporaire généré:', temporaryPassword)

    // ÉTAPE CRITIQUE: Mettre à jour le mot de passe avec toutes les confirmations nécessaires
    const { data: updateData, error: updateError } = await supabaseClient.auth.admin.updateUserById(
      authUser.id,
      { 
        password: temporaryPassword,
        email_confirm: true, // Confirmer l'email
        phone_confirm: true, // Confirmer le téléphone
        ban_duration: 'none' // S'assurer que l'utilisateur n'est pas banni
      }
    )

    if (updateError) {
      console.error('❌ Erreur mise à jour mot de passe:', updateError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la génération du mot de passe temporaire' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Mot de passe mis à jour dans auth.users')

    // IMPORTANT: Attendre un peu pour que la mise à jour soit propagée
    await new Promise(resolve => setTimeout(resolve, 500))

    // Vérifier que la mise à jour a bien été effectuée
    const { data: verifyUser, error: verifyError } = await supabaseClient.auth.admin.getUserById(authUser.id)
    
    if (verifyError) {
      console.error('⚠️ Erreur vérification utilisateur:', verifyError)
    } else {
      console.log('✅ Vérification utilisateur après mise à jour:', {
        id: verifyUser.user.id,
        email: verifyUser.user.email,
        email_confirmed_at: verifyUser.user.email_confirmed_at,
        phone_confirmed_at: verifyUser.user.phone_confirmed_at,
        updated_at: verifyUser.user.updated_at,
        banned_until: verifyUser.user.banned_until
      })
    }

    // Test de connexion pour vérifier que le mot de passe fonctionne
    console.log('🧪 Test de connexion avec le nouveau mot de passe...')
    const { data: testLogin, error: testLoginError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: temporaryPassword
    })

    if (testLoginError) {
      console.error('❌ ERREUR: Le mot de passe ne fonctionne pas immédiatement:', testLoginError)
      // On continue quand même, car parfois il faut un délai
    } else {
      console.log('✅ Test de connexion réussi! Le mot de passe fonctionne')
      // Déconnecter la session de test
      await supabaseClient.auth.signOut()
    }

    // Enregistrer la date d'expiration (24h)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({ 
        temporary_password_expires_at: expiresAt.toISOString(),
        temporary_password_sent_at: new Date().toISOString()
      })
      .eq('id', authUser.id)

    if (updateProfileError) {
      console.error('⚠️ Erreur mise à jour profil (non bloquant):', updateProfileError)
    }

    // Formater le numéro de téléphone pour WhatsApp
    let phoneNumber = phone.replace(/\s+/g, '')
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+253' + phoneNumber.replace(/^0+/, '')
    }

    console.log('📱 Numéro formaté:', phoneNumber)

    // Créer le message WhatsApp
    const userName = profile.full_name || 'Utilisateur'
    const message = `🔐 *Mot de passe temporaire - DjibGo*

Bonjour ${userName},

Votre mot de passe temporaire est :

*${temporaryPassword}*

⚠️ *Important :*
• Ce mot de passe est valide pendant 24 heures
• Utilisez-le IMMÉDIATEMENT pour vous connecter
• Changez-le après connexion dans votre profil
• Ne partagez jamais ce code

Pour vous connecter :
1. Retournez sur la page de connexion
2. Entrez votre email : ${email}
3. Entrez ce mot de passe : ${temporaryPassword}
4. Cliquez sur "Se connecter"

🛡️ Si vous n'avez pas demandé ce mot de passe, contactez-nous immédiatement.

_DjibGo Service - Votre plateforme de confiance_`

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

    // Log de l'envoi
    await supabaseClient
      .from('sms_logs')
      .insert({
        phone_number: phoneNumber,
        message: `Mot de passe temporaire envoyé: ${temporaryPassword}`,
        status: 'sent',
        provider: 'whatsapp',
        user_id: authUser.id
      })

    console.log('✅ Succès complet - WhatsApp URL généré')
    console.log('🔑 IMPORTANT: Le mot de passe temporaire est:', temporaryPassword)
    console.log('📧 Email:', email)
    console.log('🆔 User ID:', authUser.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mot de passe temporaire généré avec succès. Utilisez-le immédiatement pour vous connecter.',
        whatsappUrl: whatsappUrl,
        phone: phoneNumber,
        expiresAt: expiresAt.toISOString(),
        // Pour le débogage (à retirer en production)
        debug: {
          userId: authUser.id,
          email: email,
          temporaryPassword: temporaryPassword,
          emailConfirmed: true,
          phoneConfirmed: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Erreur globale:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})