import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types simplifiés pour la recherche
type BusinessWithRelations = any;
type BusinessWhereInput = any;
type BusinessOrderByWithRelationInput = any;
type Business = any;
type subscription_status = string;

// Interface pour la réponse de l'API
export interface SearchResponse {
  businesses: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    image: string | null;
    rating: number;
    reviewCount: number;
    address: string;
    city: string;
    postalCode: string;
    services: Array<{
      id: string;
      name: string;
      price: number;
      duration: number;
    }>;
    employeesCount: number;
    isPremium: boolean;
    isNew: boolean;
    isTop: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fonction pour formater les résultats de recherche
function formatBusinessForResponse(business: any) {
  // Implémentation simplifiée
  return business;
}

// Fonction pour effectuer une recherche élargie
async function performBroaderSearch(
  query: string,
  baseWhere: BusinessWhereInput
): Promise<{ businesses: BusinessWithRelations[]; total: number }> {
  // Implémentation simplifiée
  return { businesses: [], total: 0 };
}

// Gestionnaire de route
async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '10'), 50);
    
    // Vérification de l'URL
    if (!req.url) {
      throw new Error('URL non définie');
    }
    
    // Construction de la clause where de manière sécurisée
    const whereClause: any = {};
    
    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { description: { contains: query } }
      ];
    }

    const businesses = await prisma.businesses.findMany({
      take: pageSize,
      skip: (page - 1) * pageSize,
      where: whereClause,
    });

    const total = await prisma.businesses.count({
      where: whereClause,
    });

    return NextResponse.json({
      businesses: businesses.map(formatBusinessForResponse),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la recherche' },
      { status: 500 }
    );
  }
}

export { GET };
