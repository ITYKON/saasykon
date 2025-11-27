import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/auth';
import type { DashboardStatistics } from '@/types/statistics';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('Début de la récupération des statistiques');
  try {
    // Vérification de l'authentification
    const user = await getAuthUserFromCookies();
    console.log('Utilisateur récupéré:', user?.id);
    if (!user?.id) {
      console.error('Erreur: Utilisateur non authentifié');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupération des entreprises de l'utilisateur
    console.log('Récupération des entreprises pour l\'utilisateur:', user.id);
    const userBusinesses = await prisma.user_roles.findMany({
      where: { user_id: user.id },
      include: {
        businesses: {
          include: {
            business_locations: true
          }
        }
      }
    });

    console.log('Entreprises récupérées:', JSON.stringify(userBusinesses, null, 2));

    if (userBusinesses.length === 0) {
      console.error('Erreur: Aucune entreprise trouvée pour cet utilisateur');
      return NextResponse.json({ error: 'Aucun salon trouvé pour cet utilisateur' }, { status: 404 });
    }

    // Prendre la première entreprise de l'utilisateur
    const business = userBusinesses[0]?.businesses;
    console.log('Entreprise sélectionnée:', business);
    
    if (!business) {
      console.error('Erreur: Aucune entreprise valide trouvée');
      return NextResponse.json({ error: 'Aucune entreprise valide trouvée' }, { status: 404 });
    }
    
    const businessLocationId = business.business_locations?.[0]?.id;
    console.log('ID de l\'emplacement du salon:', businessLocationId);

    if (!businessLocationId) {
      console.error('Erreur: Aucun emplacement de salon trouvé');
      return NextResponse.json({ error: 'Aucun emplacement de salon trouvé' }, { status: 404 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Récupération des réservations des 30 derniers jours
    console.log('Récupération des réservations pour l\'emplacement:', businessLocationId);
    console.log('Période:', thirtyDaysAgo, 'à', now);
    
    const reservations = await prisma.reservations.findMany({
      where: {
        location_id: businessLocationId,
        starts_at: {
          gte: thirtyDaysAgo,
          lte: now
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        reservation_items: {
          include: {
            services: true
          }
        },
        clients: true,
        employees: true
      },
      orderBy: {
        starts_at: 'asc'
      }
    });

    console.log(`Nombre de réservations trouvées: ${reservations.length}`);

    // Calcul des statistiques
    const stats = calculateStatistics(reservations, thirtyDaysAgo, now);
    
    console.log('Statistiques calculées:', JSON.stringify({
      overview: stats.overview,
      dailyStatsCount: stats.dailyStats.length,
      serviceStatsCount: stats.serviceStats.length,
      employeeStatsCount: stats.employeeStats.length,
      recentAppointmentsCount: stats.recentAppointments.length
    }, null, 2));

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace disponible');
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération des statistiques',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

function calculateStatistics(reservations: any[], startDate: Date, endDate: Date): DashboardStatistics {
  // Statistiques générales
  const totalAppointments = reservations.length;
  const completedAppointments = reservations.filter(r => r.status === 'COMPLETED').length;
  const cancelledAppointments = reservations.filter(r => r.status === 'CANCELLED').length;
  const noShowAppointments = reservations.filter(r => r.status === 'NO_SHOW').length;
  
  // Calcul du revenu total
  const totalRevenue = reservations
    .filter(r => r.status === 'COMPLETED')
    .reduce((sum, res) => {
      const serviceRevenue = res.reservation_items.reduce(
        (s: number, rs: any) => s + (rs.services?.price_cents || 0) / 100, 
        0
      );
      return sum + serviceRevenue;
    }, 0);

  // Statistiques par jour
  const dailyStats: Record<string, { date: string; count: number; revenue: number }> = {};
  const currentDate = new Date(startDate);
  
  // Initialiser tous les jours avec 0
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    dailyStats[dateStr] = {
      date: currentDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      count: 0,
      revenue: 0
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Compter les rendez-vous et le revenu par jour
  reservations.forEach(res => {
    if (res.status !== 'COMPLETED') return;
    
    const dateStr = new Date(res.starts_at).toISOString().split('T')[0];
    if (dailyStats[dateStr]) {
      dailyStats[dateStr].count += 1;
      dailyStats[dateStr].revenue += res.reservation_items.reduce(
        (sum: number, rs: any) => sum + (rs.services?.price_cents || 0) / 100, 
        0
      );
    }
  });

  // Statistiques par service
  const serviceStats: Record<string, { name: string; count: number; revenue: number }> = {};
  reservations.forEach(res => {
    res.reservation_items.forEach((rs: any) => {
      const service = rs.services;
      if (!service) return;
      
      if (!serviceStats[service.id]) {
        serviceStats[service.id] = {
          name: service.name || 'Service inconnu',
          count: 0,
          revenue: 0
        };
      }
      serviceStats[service.id].count += 1;
      serviceStats[service.id].revenue += (service.price_cents || 0) / 100;
    });
  });

  // Statistiques par employé
  const employeeStats: Record<string, { name: string; count: number; revenue: number }> = {};
  reservations.forEach(res => {
    if (!res.employees) return;
    
    const employee = res.employees;
    if (!employee) return;
    
    if (!employeeStats[employee.id]) {
      employeeStats[employee.id] = {
        name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employé inconnu',
        count: 0,
        revenue: 0
      };
    }
    
    employeeStats[employee.id].count += 1;
    employeeStats[employee.id].revenue += res.reservation_items.reduce(
      (sum: number, rs: any) => sum + (rs.services?.price_cents || 0) / 100, 
      0
    );
  });

  return {
    overview: {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      totalRevenue,
      averageRevenuePerAppointment: completedAppointments > 0 ? totalRevenue / completedAppointments : 0
    },
    dailyStats: Object.values(dailyStats),
    serviceStats: Object.values(serviceStats),
    employeeStats: Object.values(employeeStats),
    recentAppointments: reservations
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      .slice(0, 5)
      .map(res => ({
        id: res.id,
        customerName: res.clients 
          ? `${res.clients.first_name || ''} ${res.clients.last_name || ''}`.trim() 
          : 'Client inconnu',
        date: new Date(res.starts_at).toLocaleDateString('fr-FR'),
        time: new Date(res.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        services: res.reservation_items
          .map((rs: any) => rs.services?.name || 'Service inconnu')
          .filter(Boolean)
          .join(', '),
        status: res.status,
        total: res.reservation_items.reduce(
          (sum: number, rs: any) => sum + (rs.services?.price_cents || 0) / 100, 
          0
        )
      }))
  };
}
