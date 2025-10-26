import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    // Récupérer l'utilisateur à partir des cookies
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Trouver l'entreprise de l'utilisateur avec les relations nécessaires
    const business = await prisma.businesses.findFirst({
      where: {
        owner_user_id: user.id,
      },
      include: {
        business_locations: {
          where: { is_primary: true },
          include: {
            cities: true,
            countries: true,
          },
          take: 1,
        },
        business_media: {
          orderBy: { position: 'asc' },
        },
        working_hours: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Aucun établissement trouvé' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Récupérer l'utilisateur à partir des cookies
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    const {
      publicName,
      description,
      email,
      phone,
      website,
      address,
      workingHours,
      photos,
    } = data;

    // Récupérer l'entreprise de l'utilisateur
    const business = await prisma.businesses.findFirst({
      where: { owner_user_id: user.id },
    });

    if (!business) {
      return NextResponse.json({ error: 'Aucun établissement trouvé' }, { status: 404 });
    }

    // Mettre à jour l'entreprise
    const updatedBusiness = await prisma.businesses.update({
      where: { id: business.id },
      data: {
        public_name: publicName,
        description,
        email,
        phone,
        website,
        updated_at: new Date(),
      },
    });

    // Mettre à jour l'adresse principale
    if (address) {
      // Vérifier si une adresse principale existe déjà
      const existingLocation = await prisma.business_locations.findFirst({
        where: { business_id: updatedBusiness.id, is_primary: true },
      });

      if (existingLocation) {
        // Mettre à jour l'adresse existante
        await prisma.business_locations.update({
          where: { id: existingLocation.id },
          data: {
            address_line1: address.line1,
            address_line2: address.line2 || null,
            postal_code: address.postalCode || null,
            // Note: Dans une vraie application, vous voudrez peut-être gérer la création/mise à jour des villes/pays
            // Pour l'instant, nous utilisons des valeurs factices
            city_id: 1, // Remplacer par l'ID de la ville réelle
            country_code: 'FR', // Remplacer par le code pays réel
            latitude: address.latitude ? parseFloat(address.latitude) : null,
            longitude: address.longitude ? parseFloat(address.longitude) : null,
            updated_at: new Date(),
          },
        });
      } else {
        // Créer une nouvelle adresse principale
        await prisma.business_locations.create({
          data: {
            business_id: updatedBusiness.id,
            address_line1: address.line1,
            address_line2: address.line2 || null,
            postal_code: address.postalCode || null,
            city_id: 1, // Remplacer par l'ID de la ville réelle
            country_code: 'FR', // Remplacer par le code pays réel
            latitude: address.latitude ? parseFloat(address.latitude) : null,
            longitude: address.longitude ? parseFloat(address.longitude) : null,
            timezone: 'Europe/Paris',
            is_primary: true,
          },
        });
      }
    }

    // Mettre à jour les horaires d'ouverture
    if (workingHours) {
      // Supprimer les anciens horaires
      await prisma.working_hours.deleteMany({
        where: { business_id: updatedBusiness.id },
      });

      // Ajouter les nouveaux horaires
      const workingHoursData = Object.entries(workingHours).map(([day, hours]: [string, any]) => {
        // Convertir le jour en format attendu par la base de données
        const dayMap: Record<string, number> = {
          lundi: 1,
          mardi: 2,
          mercredi: 3,
          jeudi: 4,
          vendredi: 5,
          samedi: 6,
          dimanche: 0,
        };
        
        return {
          business_id: updatedBusiness.id,
          weekday: dayMap[day] || 1, // Par défaut à lundi si le jour n'est pas reconnu
          is_open: hours.ouvert,
          start_time: hours.ouvert ? hours.debut : null,
          end_time: hours.ouvert ? hours.fin : null,
        };
      });

      // Ajouter les horaires un par un pour éviter les problèmes de types
      for (const wh of workingHoursData) {
        await prisma.working_hours.create({
          data: wh,
        });
      }
    }

    // Mettre à jour les photos
    if (photos && Array.isArray(photos)) {
      // Supprimer les anciennes photos
      await prisma.business_media.deleteMany({
        where: { business_id: updatedBusiness.id },
      });

      // Ajouter les nouvelles photos
      for (let i = 0; i < photos.length; i++) {
        const url = photos[i];
        await prisma.business_media.create({
          data: {
            business_id: updatedBusiness.id,
            url,
            type: 'image',
            position: i,
          },
        });
      }
    }

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
