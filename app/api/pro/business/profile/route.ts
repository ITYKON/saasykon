import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserFromCookies } from '@/lib/auth';
import { getAuthContext } from '@/lib/authorization';

export async function GET() {
  try {
    // Auth: accepter owner OU utilisateur assigné (PRO/PROFESSIONNEL)
    const user = await getAuthUserFromCookies();
    const ctx = await getAuthContext().catch(() => null);
    if (!user && !ctx) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let businessId: string | null = null;
    if (ctx && ctx.assignments && ctx.assignments.length > 0) {
      businessId = ctx.assignments[0]?.business_id || null;
    }

    // Trouver l'entreprise de l'utilisateur (par businessId si assigné, sinon par owner_user_id)
    const business = await prisma.businesses.findFirst({
      where: businessId ? { id: businessId } : { owner_user_id: user!.id },
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

    // Formater la localisation primaire pour exposer city_name et country_name attendus par le front
    const primary = business.business_locations?.[0] || null as any;
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date | string | null) => {
      if (!d) return ''
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return ''
      // Use UTC parts to avoid local timezone offset (+1h)
      return `${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}`
    }
    // Mapper les horaires pour fournir un tableau complet 0..6 avec is_open
    const base: Array<{ weekday: number; start_time: string; end_time: string; is_open: boolean }> = [
      { weekday: 0, start_time: '', end_time: '', is_open: false }, // Dimanche
      { weekday: 1, start_time: '', end_time: '', is_open: false }, // Lundi
      { weekday: 2, start_time: '', end_time: '', is_open: false }, // Mardi
      { weekday: 3, start_time: '', end_time: '', is_open: false }, // Mercredi
      { weekday: 4, start_time: '', end_time: '', is_open: false }, // Jeudi
      { weekday: 5, start_time: '', end_time: '', is_open: false }, // Vendredi
      { weekday: 6, start_time: '', end_time: '', is_open: false }, // Samedi
    ]
    for (const wh of (business.working_hours || [])) {
      const idx = base.findIndex((d) => d.weekday === wh.weekday)
      if (idx >= 0) {
        base[idx] = {
          weekday: wh.weekday,
          start_time: fmt(wh.start_time),
          end_time: fmt(wh.end_time),
          is_open: true,
        }
      }
    }
    const mappedWorkingHours = base

    const formatted = {
      ...business,
      business_locations: primary ? [{
        ...primary,
        city_name: primary?.cities?.name || null,
        country_name: primary?.countries?.name || null,
      }] : [],
      working_hours: mappedWorkingHours,
    } as any;

    return NextResponse.json({ business: formatted });
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

    // Récupérer le contexte d'auth et déterminer le business ciblé
    const ctx = await getAuthContext().catch(() => null);
    let business: any = null;
    if (ctx && ctx.assignments && ctx.assignments.length > 0) {
      const bizId = ctx.assignments[0]?.business_id;
      if (bizId) {
        business = await prisma.businesses.findUnique({ where: { id: bizId } });
      }
    }
    if (!business) {
      // fallback: propriétaire
      business = await prisma.businesses.findFirst({ where: { owner_user_id: user.id } });
    }

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

      // 2. Résoudre la ville selon notation des wilayas (Algérie)
      //    - Si la valeur fournie est un code wilaya (ex: "06"), on résout via wilaya_number
      //    - Sinon on résout via le nom de ville normalisé (slug)
      const norm = (s: string) => s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim();

      const rawCity = String(address.city || '').trim();
      const numericWilayaMatch = rawCity.match(/^\d{1,2}$/); // ex: "06", "6"
      let city = null as any;

      if (numericWilayaMatch) {
        const wilayaNum = parseInt(rawCity, 10);
        // contrainte simple: 1..58
        if (!Number.isFinite(wilayaNum) || wilayaNum < 1 || wilayaNum > 58) {
          console.warn(`Code wilaya invalide: ${rawCity}, utilisation de la ville par défaut`);
          // Au lieu de retourner une erreur, on utilise une ville par défaut
          city = await prisma.cities.findFirst({
            where: { country_code: country.code },
            orderBy: { name: 'asc' },
          });
        } else {
          city = await prisma.cities.findFirst({
            where: { country_code: country.code, wilaya_number: wilayaNum },
          });
        }
      } 
      
      // Si pas de ville trouvée ou pas de correspondance, on essaie avec le nom de la ville
      if (!city && rawCity) {
        // Recherche par nom normalisé (fallback exact puis approx.)
        city = await prisma.cities.findFirst({
          where: { country_code: country.code, name: rawCity },
        });
        if (!city) {
          const allCities = await prisma.cities.findMany({ where: { country_code: country.code } });
          const targetSlug = norm(rawCity);
          city = allCities.find((c: any) => norm(c.name) === targetSlug) || null;
        }
      }
      
      // Si toujours pas de ville, on prend la première ville du pays
      if (!city) {
        console.warn('Aucune ville valide fournie, utilisation de la première ville du pays');
        city = await prisma.cities.findFirst({
          where: { country_code: country.code },
          orderBy: { name: 'asc' },
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
        const workingHoursData = Object.entries(workingHours).flatMap(([day, hours]: [string, any]) => {
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
            
            try {
              // Créer une date avec l'heure spécifiée
              const [hours, minutes] = timeStr.split(':').map(Number);
              // Créer une date en UTC pour éviter les problèmes de fuseau horaire
              const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
              return date;
            } catch (error) {
              console.error(`Erreur de format d'heure: ${timeStr}`, error);
              return new Date('1970-01-01T00:00:00.000Z');
            }
          };
          
          const dayLower = day.toLowerCase();
          const weekday = dayMap[dayLower];
          if (weekday === undefined) {
            console.warn(`Jour non reconnu: ${day}`);
            return [];
          }
          
          // Si le jour n'est pas marqué comme ouvert, on ne crée pas d'entrée
          if (!hours || hours.ouvert === false || hours.ouvert === 'false') {
            console.log(`Jour non ouvert: ${day}`);
            return [];
          }
          
          // S'assurer que les heures sont définies
          const startTime = hours.debut ? formatTimeToDb(hours.debut) : new Date('1970-01-01T09:00:00.000Z');
          const endTime = hours.fin ? formatTimeToDb(hours.fin) : new Date('1970-01-01T18:00:00.000Z');
          
          console.log(`Création des horaires pour le jour ${weekday} (${day}): ${startTime.toISOString()} - ${endTime.toISOString()}`);
          
          return [{
            business_id: updatedBusiness.id,
            weekday,
            start_time: startTime,
            end_time: endTime
          }];
        }); // Utilisation de flatMap pour éliminer les tableaux vides

        // Ajouter les horaires un par un pour éviter les problèmes de types
        console.log(`${workingHoursData.length} jours d'ouverture à enregistrer`);
        
        if (workingHoursData.length > 0) {
          await prisma.working_hours.createMany({
            data: workingHoursData,
            skipDuplicates: true,
          });
          console.log(`Horaires enregistrés pour ${workingHoursData.length} jours`);
        } else {
          console.log('Aucun horaire à enregistrer');
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
    console.log('Traitement des photos:', JSON.stringify(photos, null, 2));
    if (photos && Array.isArray(photos)) {
      try {
        // Vérifier s'il y a des photos à supprimer
        const existingPhotos = await prisma.business_media.findMany({
          where: { business_id: updatedBusiness.id },
        });
        
        if (existingPhotos.length > 0) {
          console.log(`Suppression de ${existingPhotos.length} anciennes photos`);
          await prisma.business_media.deleteMany({
            where: { business_id: updatedBusiness.id },
          });
        } else {
          console.log('Aucune ancienne photo à supprimer');
        }

        // Ajouter les nouvelles photos
        console.log(`Ajout de ${photos.length} nouvelles photos`);
        
        const createdPhotos = [];
        for (let i = 0; i < photos.length; i++) {
          const url = photos[i];
          if (!url) {
            console.warn(`URL de photo manquante à la position ${i}, ignorée`);
            continue;
          }
          
          console.log(`Enregistrement de la photo ${i + 1}/${photos.length}:`, url);
          
          try {
            const createdPhoto = await prisma.business_media.create({
              data: {
                business_id: updatedBusiness.id,
                url: url.trim(), // Nettoyer l'URL des espaces inutiles
                // Ne pas définir le type pour utiliser la valeur par défaut de la base de données
                position: i,
              },
            });
            createdPhotos.push(createdPhoto);
            console.log(`Photo ${i + 1} enregistrée avec l'ID:`, createdPhoto.id);
          } catch (error) {
            console.error(`Erreur lors de l'enregistrement de la photo ${i + 1}:`, error);
            throw new Error(`Échec de l'enregistrement de la photo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
          }
        }
        
        console.log(`${createdPhotos.length} photos enregistrées avec succès`);
        
      } catch (error) {
        console.error('=== ERREUR LORS DE LA MISE À JOUR DES PHOTOS ===');
        console.error('Détails de l\'erreur:', error);
        // On propage l'erreur avec un message clair
        throw new Error(`Échec de la mise à jour des photos: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
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
