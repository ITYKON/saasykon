import { MetadataRoute } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Types pour les données métier
interface BusinessSitemapEntry {
  id: string
  updated_at: Date
}

interface CitySitemapEntry {
  city: string
  updated_at: Date
}

interface BusinessLocationWithCity {
  cities: {
    id: number
    name: string
  } | null
  updated_at: Date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Utilisez votre domaine de production ici
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Pages statiques
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/a-propos/qui-sommes-nous`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/a-propos/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/a-propos/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/institut-de-beaute`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/offres`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]

  // Récupérer les salons dynamiques
  let businesses: BusinessSitemapEntry[] = [];
  try {
    const activeBusinesses = await prisma.businesses.findMany({
      where: {
        status: 'active',
        verification_status: 'verified',
        deleted_at: null, // Ne pas inclure les salons supprimés
      },
      select: {
        id: true,
        public_name: true,
        updated_at: true,
      },
    });
    businesses = activeBusinesses;
  } catch (error) {
    console.error('Erreur lors de la récupération des salons:', error);
  }

  // Pages dynamiques des salons
  const businessPages = businesses.map((business) => ({
    url: `${baseUrl}/institut-de-beaute/${business.id}`, // Utilisation de l'ID comme identifiant
    lastModified: business.updated_at,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Récupérer les villes pour les pages de villes
  let cities: CitySitemapEntry[] = [];
  try {
    const locations = await prisma.business_locations.findMany({
      where: {
        businesses: {
          status: 'active',
          verification_status: 'verified',
          deleted_at: null,
        },
        city_id: { not: null }
      },
      include: {
        cities: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      distinct: ['city_id']
    });
    
    // Transformer les données pour correspondre au format attendu
    cities = locations
      .filter(loc => loc.cities?.name)
      .map(loc => ({
        city: loc.cities!.name,
        updated_at: loc.updated_at
      }));
  } catch (error) {
    console.error('Erreur lors de la récupération des villes:', error);
  }

  // Pages de villes
  const cityPages = cities.map((city) => ({
    url: `${baseUrl}/institut-de-beaute/ville/${encodeURIComponent(city.city.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: city.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Filtrer les entrées invalides
  const validBusinessPages = businessPages.filter((page: { url: string }) => 
    page.url && !page.url.includes('null') && !page.url.includes('undefined')
  );
  
  const validCityPages = cityPages.filter((page: { url: string }) => 
    page.url && !page.url.includes('null') && !page.url.includes('undefined')
  );
  
  return [...staticPages, ...validBusinessPages, ...validCityPages]
}
