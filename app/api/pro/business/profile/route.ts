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
    console.log('=== DÉBUT DU TRAITEMENT DE LA REQUÊTE ===');
    
    // Récupérer l'utilisateur à partir des cookies
    const user = await getAuthUserFromCookies().catch(error => {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw new Error('Erreur d\'authentification');
    });
    
    if (!user) {
      console.error('Aucun utilisateur trouvé dans les cookies');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    console.log(`Utilisateur connecté: ${user.id} (${user.email})`);
    
    // Vérifier que le corps de la requête est valide
    let data;
    try {
      data = await request.json();
      console.log('Données reçues:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erreur lors de l\'analyse du corps de la requête:', error);
      return NextResponse.json(
        { error: 'Format de requête invalide' },
        { status: 400 }
      );
    }
    
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
    console.log('Mise à jour des informations de l\'entreprise...');
    let updatedBusiness;
    try {
      updatedBusiness = await prisma.businesses.update({
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
      console.log('Informations de l\'entreprise mises à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de l\'entreprise:', error);
      throw new Error(`Échec de la mise à jour de l'entreprise: ${error?.message || 'Erreur inconnue'}`);
    }

    // Mettre à jour l'adresse principale
    if (address) {
      console.log('Traitement de l\'adresse:', JSON.stringify(address, null, 2));
      
      // 1. Vérifier si le pays existe, sinon le créer
      let country = await prisma.countries.findFirst({
        where: { 
          OR: [
            { name: address.country },
            { code: address.country }
          ]
        }
      });

      if (!country) {
        console.log(`Création du pays: ${address.country}`);
        // Créer un code de pays à partir du nom (ex: 'algerie' -> 'DZ')
        const countryCode = address.country.substring(0, 2).toUpperCase() || 'DZ';
        country = await prisma.countries.create({
          data: {
            code: countryCode,
            name: address.country,
          },
        });
      }

      // 2. Vérifier si la ville existe, sinon la créer
      let city = await prisma.cities.findFirst({
        where: { 
          name: address.city,
          country_code: country.code
        }
      });

      if (!city) {
        console.log(`Création de la ville: ${address.city}, ${country.name}`);
        city = await prisma.cities.create({
          data: {
            name: address.city,
            country_code: country.code,
            // Le champ wilaya_number est optionnel dans le schéma
            wilaya_number: 6, // Valeur par défaut, à adapter selon vos besoins
          },
        });
      }
      
      // 3. Vérifier si une adresse principale existe déjà
      const existingLocation = await prisma.business_locations.findFirst({
        where: { business_id: updatedBusiness.id, is_primary: true },
      });
      
      console.log('Adresse existante trouvée:', existingLocation ? 'Oui' : 'Non');

      if (existingLocation) {
        // Mettre à jour l'adresse existante
        await prisma.business_locations.update({
          where: { id: existingLocation.id },
          data: {
            address_line1: address.line1,
            address_line2: address.line2 || null,
            postal_code: address.postalCode || null,
            city_id: city.id,
            country_code: country.code,
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
            city_id: city.id,
            country_code: country.code,
            latitude: address.latitude ? parseFloat(address.latitude) : null,
            longitude: address.longitude ? parseFloat(address.longitude) : null,
            timezone: 'Africa/Algiers',
            is_primary: true,
            // Les champs created_at et updated_at sont gérés automatiquement par la base de données
          },
        });
      }
    }

    // Mettre à jour les horaires d'ouverture
    console.log('Traitement des horaires:', JSON.stringify(workingHours, null, 2));
    
    if (workingHours && typeof workingHours === 'object') {
      try {
        // Supprimer les anciens horaires
        const deleteCount = await prisma.working_hours.deleteMany({
          where: { business_id: updatedBusiness.id },
        });
        console.log(`Anciens horaires supprimés: ${deleteCount.count}`);

        // Vérifier que workingHours est bien un objet
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
          
          // Convertir l'heure en format compatible avec la base de données
          const formatTimeToDb = (timeStr: string): Date => {
            if (!timeStr) return new Date('1970-01-01T00:00:00.000Z');
            
            // Si le temps n'a pas de deux-points, on suppose le format HHMM
            if (!timeStr.includes(':')) {
              timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
            }
            
            // Créer une date avec l'heure spécifiée
            const [hours, minutes] = timeStr.split(':').map(Number);
            // Créer une date en UTC pour éviter les problèmes de fuseau horaire
            const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
            return date;
          };
          
          const dayLower = day.toLowerCase();
          const weekday = dayMap[dayLower];
          if (weekday === undefined) {
            console.warn(`Jour non reconnu: ${day}`);
            return null;
          }
          
          // Si le jour n'est pas ouvert, on ne crée pas d'entrée
          if (!hours.ouvert) {
            return null;
          }
          
          // S'assurer que les heures sont définies
          const startTime = hours.debut ? formatTimeToDb(hours.debut) : new Date('1970-01-01T00:00:00.000Z');
          const endTime = hours.fin ? formatTimeToDb(hours.fin) : new Date('1970-01-01T00:00:00.000Z');
          
          console.log(`Création des horaires pour le jour ${weekday}: ${startTime.toISOString()} - ${endTime.toISOString()}`);
          
          return {
            business_id: updatedBusiness.id,
            weekday,
            start_time: startTime,
            end_time: endTime,
          };
        }).filter(Boolean); // Filtrer les entrées invalides

        // Ajouter les horaires un par un pour éviter les problèmes de types
        console.log(`${workingHoursData.length} jours d'ouverture à enregistrer`);
        for (const wh of workingHoursData) {
          if (wh) { // Vérification de type pour TypeScript
            try {
              await prisma.working_hours.create({
                data: {
                  business_id: wh.business_id,
                  weekday: wh.weekday,
                  start_time: wh.start_time,
                  end_time: wh.end_time,
                },
              });
              console.log(`Horaires enregistrés pour le jour ${wh.weekday}`);
            } catch (error) {
              console.error(`Erreur lors de l'enregistrement des horaires pour le jour ${wh.weekday}:`, error);
              throw error; // Propager l'erreur pour qu'elle soit gérée par le bloc catch principal
            }
          }
        }
      } catch (error) {
        console.error('=== ERREUR LORS DE LA MISE À JOUR DES HORAIRES ===');
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('Détails de l\'erreur:', error);
        // On propage l'erreur pour qu'elle soit gérée par le bloc catch principal
        // avec un message plus explicite
        throw new Error(`Échec de la mise à jour des horaires: ${errorMessage}`);
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

    // Récupérer les données mises à jour pour les renvoyer
    console.log('Récupération des données mises à jour...');
    const updatedBusinessWithRelations = await prisma.businesses.findUnique({
      where: { id: updatedBusiness.id },
      include: {
        business_locations: {
          where: { is_primary: true },
          include: {
            cities: true,
            countries: true,
          },
          take: 1,
        },
        working_hours: {
          orderBy: { weekday: 'asc' },
        },
        business_media: {
          orderBy: { position: 'asc' },
        },
      },
    });

    console.log('Données mises à jour récupérées:', {
      business: updatedBusinessWithRelations ? {
        ...updatedBusinessWithRelations,
        business_locations: updatedBusinessWithRelations.business_locations,
        working_hours: updatedBusinessWithRelations.working_hours,
        business_media: updatedBusinessWithRelations.business_media,
      } : null
    });

    // Formater les données pour le frontend
    const formattedBusiness = {
      ...updatedBusinessWithRelations,
      // Formater les horaires d'ouverture pour le frontend
      working_hours: updatedBusinessWithRelations?.working_hours?.reduce((acc, wh) => {
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const dayName = dayNames[wh.weekday] || 'inconnu';
        
        // Formater l'heure au format HH:MM
        const formatTime = (date: Date | string) => {
          if (!date) return '';
          const d = new Date(date);
          if (isNaN(d.getTime())) return ''; // Vérifier si la date est valide
          return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };
        
        acc[dayName] = {
          ouvert: true, // Si l'entrée existe, c'est que le jour est ouvert
          debut: formatTime(wh.start_time as Date),
          fin: formatTime(wh.end_time as Date),
        };
        
        return acc;
      }, {} as Record<string, { ouvert: boolean; debut: string; fin: string }>) || {}
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Profil mis à jour avec succès',
      business: formattedBusiness 
    });
  } catch (error: unknown) {
    console.error('=== ERREUR LORS DE LA MISE À JOUR DU PROFIL ===');
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorName = error instanceof Error ? error.constructor.name : 'UnknownError';
    const errorStack = error instanceof Error ? error.stack : 'Aucune stack trace';
    
    console.error('Type d\'erreur:', errorName);
    console.error('Message d\'erreur:', errorMessage);
    console.error('Stack trace:', errorStack);
    
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la mise à jour du profil',
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          name: errorName,
          stack: errorStack
        } : undefined
      },
      { status: 500 }
    );
  } finally {
    console.log('=== FIN DU TRAITEMENT DE LA REQUÊTE ===');
  }
}
