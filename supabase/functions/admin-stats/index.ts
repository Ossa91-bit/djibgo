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

    const { action, user_id } = await req.json()

    if (action === 'check_admin') {
      const { data: adminData, error: adminError } = await supabaseClient
        .from('admins')
        .select('role, is_active')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .maybeSingle()

      if (adminError) {
        console.error('Erreur admin check:', adminError)
        return new Response(
          JSON.stringify({ is_admin: false }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }

      return new Response(
        JSON.stringify({ is_admin: !!adminData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // Statistiques générales du dashboard
    const [
      { count: usersCount },
      { count: professionalsCount },
      { count: bookingsCount },
      { count: activeBookingsCount }
    ] = await Promise.all([
      supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseClient.from('professional_profiles').select('*', { count: 'exact', head: true }),
      supabaseClient.from('bookings').select('*', { count: 'exact', head: true }),
      supabaseClient.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending', 'confirmed'])
    ])

    // 🔍 DEBUG: Récupérer TOUTES les réservations pour voir leur statut et prix
    const { data: allBookings, error: allBookingsError } = await supabaseClient
      .from('bookings')
      .select('id, status, total_amount, commission_amount, payment_status')

    console.log('📊 TOUTES LES RÉSERVATIONS:', JSON.stringify(allBookings, null, 2))
    if (allBookingsError) {
      console.error('❌ Erreur récupération réservations:', allBookingsError)
    }

    // Calcul des revenus réels basés sur les réservations confirmées et complétées
    const { data: completedBookings, error: revenueError } = await supabaseClient
      .from('bookings')
      .select('total_amount, commission_amount, status')
      .in('status', ['confirmed', 'completed'])

    console.log('✅ RÉSERVATIONS CONFIRMÉES/COMPLÉTÉES:', JSON.stringify(completedBookings, null, 2))
    if (revenueError) {
      console.error('❌ Erreur revenus:', revenueError)
    }

    let monthlyRevenue = 0
    let totalCommission = 0
    
    if (!revenueError && completedBookings) {
      monthlyRevenue = completedBookings.reduce((total, booking) => {
        const amount = Number(booking.total_amount) || 0
        console.log(`💰 Ajout de ${amount} DJF au total (statut: ${booking.status})`)
        return total + amount
      }, 0)
      
      // Utiliser les commissions déjà calculées dans la base de données
      totalCommission = completedBookings.reduce((total, booking) => {
        const commission = Number(booking.commission_amount) || 0
        return total + commission
      }, 0)
      
      console.log(`💵 REVENUS TOTAUX: ${monthlyRevenue} DJF`)
      console.log(`💸 COMMISSIONS TOTALES: ${totalCommission} DJF`)
    }

    // Données pour les graphiques - revenus des 7 derniers jours
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const { data: recentBookings } = await supabaseClient
      .from('bookings')
      .select('total_amount, created_at')
      .in('status', ['confirmed', 'completed'])
      .gte('created_at', sevenDaysAgo.toISOString())

    // Grouper les revenus par jour
    const revenueByDay: { [key: string]: number } = {}
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const dateKey = date.toISOString().split('T')[0]
      revenueByDay[dateKey] = 0
    }

    if (recentBookings) {
      recentBookings.forEach(booking => {
        const dateKey = booking.created_at.split('T')[0]
        if (revenueByDay[dateKey] !== undefined) {
          revenueByDay[dateKey] += Number(booking.total_amount) || 0
        }
      })
    }

    const revenueData = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
      revenue
    }))

    // Statistiques par service
    const { data: serviceStats } = await supabaseClient
      .from('bookings')
      .select('service_id, services(title)')
      .in('status', ['confirmed', 'completed', 'pending'])

    const serviceBookings: { [key: string]: number } = {}
    if (serviceStats) {
      serviceStats.forEach(booking => {
        const serviceName = (booking.services as any)?.title || 'Autre'
        serviceBookings[serviceName] = (serviceBookings[serviceName] || 0) + 1
      })
    }

    const serviceData = Object.entries(serviceBookings)
      .map(([name, bookings]) => ({ name, bookings }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5)

    const stats = {
      totalUsers: usersCount || 0,
      totalProfessionals: professionalsCount || 0,
      totalBookings: bookingsCount || 0,
      activeBookings: activeBookingsCount || 0,
      monthlyRevenue,
      totalCommission,
      revenueData,
      serviceData
    }

    console.log('📈 STATISTIQUES FINALES:', JSON.stringify(stats, null, 2))

    return new Response(
      JSON.stringify(stats),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Erreur dans admin-stats:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur serveur' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})