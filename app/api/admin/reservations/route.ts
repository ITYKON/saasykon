import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Liste toutes les réservations avec infos client, service, salon
export async function GET() {
	try {
		const reservations = await prisma.reservations.findMany({
			orderBy: { starts_at: "desc" },
			include: {
				clients: true,
				businesses: true,
				reservation_items: {
					include: {
						services: true,
						employees: true,
					},
				},
			},
		});
		// Formatage pour l'affichage admin (nom, service, salon, date, statut, prix)
			const formatted = reservations.map(r => {
				const item = r.reservation_items[0];
				return {
					id: r.id,
					client: r.clients ? `${r.clients.first_name || ''} ${r.clients.last_name || ''}`.trim() : '',
					service: item?.services?.name ? String(item.services.name) : '',
					salon: r.businesses?.public_name ? String(r.businesses.public_name) : '',
					date: r.starts_at ? String(r.starts_at) : '',
					status: r.status ? String(r.status) : '',
					price: item?.price_cents ? Number(item.price_cents) / 100 : null,
				};
			});
		return NextResponse.json({ reservations: formatted });
	} catch (e) {
		console.error("[GET /api/admin/reservations] Erreur:", e);
		return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
	}
}

// POST: Crée une réservation de test
export async function POST() {
			try {
				// Test spécifique demandé : salon RARE BEAUTYY GOMEZ, client fayza20@gmail.com
				const salon = await prisma.businesses.findFirst({ where: { public_name: "RARE BEAUTYY GOMEZ" } });
				if (!salon) return NextResponse.json({ error: "Salon RARE BEAUTYY GOMEZ introuvable" }, { status: 404 });

				const user = await prisma.users.findFirst({ where: { email: "fayza20@gmail.com" } });
				if (!user) return NextResponse.json({ error: "Utilisateur fayza20@gmail.com introuvable" }, { status: 404 });

				const client = await prisma.clients.findFirst({ where: { user_id: user.id } });
				if (!client) return NextResponse.json({ error: "Client lié à fayza20@gmail.com introuvable" }, { status: 404 });

				const service = await prisma.services.findFirst({ where: { business_id: salon.id } });
				if (!service) return NextResponse.json({ error: "Aucun service trouvé pour le salon RARE BEAUTYY GOMEZ" }, { status: 404 });

				// Création réservation de test
				const starts_at = new Date("2025-09-22T14:00:00Z");
				const ends_at = new Date("2025-09-22T14:30:00Z");
				const reservation = await prisma.reservations.create({
					data: {
						business_id: salon.id,
						client_id: client.id,
						starts_at,
						ends_at,
						status: "CONFIRMED",
						reservation_items: {
							create: [{
								service_id: service.id,
								price_cents: 1800 * 100,
								currency: "DZD",
								duration_minutes: 30,
							}],
						},
					},
					include: {
						clients: true,
						businesses: true,
						reservation_items: { include: { services: true } },
					},
				});
				return NextResponse.json({ reservation });
			} catch (e) {
				console.error("[POST /api/admin/reservations] Erreur:", e);
				return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
			}
}
