import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/authorization";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {

      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer toutes les catégories sans filtre business_id
    const categories = await prisma.service_categories.findMany({
      orderBy: { name: "asc" },
      select: { 
        id: true, 
        code: true, 
        name: true 
      }
    });


    return NextResponse.json({ categories });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json({ 
      error: "Une erreur est survenue lors de la récupération des catégories",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  
  try {
    // Vérification de l'authentification
    const ctx = await getAuthContext();
    if (!ctx) {

      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = ctx.roles.some(role => 
      ["ADMIN", "PRO", "PROFESSIONNEL"].includes(role)
    );
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupération du corps de la requête
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error('Erreur de parsing JSON:', error);
      return NextResponse.json({ error: "Format JSON invalide" }, { status: 400 });
    }

    // Validation des données
    const { code, name } = body || {};
    
    if (!name || typeof name !== "string") {
      console.error('Nom de catégorie manquant ou invalide');
      return NextResponse.json({ 
        error: "Le nom de la catégorie est requis et doit être une chaîne de caractères" 
      }, { status: 400 });
    }

    // Récupération de l'ID de l'entreprise
    const cookieStore = cookies();
    const url = new URL(req.url);
    const businessId = url.searchParams.get("business_id") || 
                      cookieStore.get("business_id")?.value || 
                      ctx.assignments[0]?.business_id;
    
    if (!businessId) {
      console.error('Aucun ID d\'entreprise trouvé');
      return NextResponse.json({ 
        error: "Impossible de déterminer l'entreprise" 
      }, { status: 400 });
    }

    // Création d'un code unique
    const slug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const baseCode = slug((code && typeof code === "string" ? code : name) || "cat");
    
    // Tentative de création avec gestion des doublons
    for (let i = 0; i < 5; i++) {
      const suffix = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const codeCandidate = `${baseCode}-${suffix}`;
      const nameCandidate = i === 0 ? name : `${name} (${i + 1})`;
      
      try {
        // Création de la catégorie avec uniquement les champs requis
        const created = await prisma.service_categories.create({
          data: {
            name: nameCandidate,
            code: codeCandidate,
          },
          select: { id: true, code: true, name: true }
        });
        return NextResponse.json(created, { status: 201 });
        
      } catch (e: any) {
        console.error(`Erreur lors de la tentative ${i + 1}:`, e);
        
        // Si c'est une erreur de doublon, on réessaye avec un nouveau code
        if (e?.code === "P2002") {
          continue;
        }
        
        // Pour les autres erreurs, on renvoie immédiatement
        return NextResponse.json({ 
          error: "Échec de la création de la catégorie",
          details: e.message,
          code: e.code || "UNKNOWN"
        }, { 
          status: 500 
        });
      }
    }
    
    // Si on arrive ici, c'est qu'on a épuisé les tentatives
    console.error('Échec après 5 tentatives de création de catégorie');
    return NextResponse.json({ 
      error: "Impossible de créer la catégorie après plusieurs tentatives" 
    }, { status: 500 });
    
  } catch (error) {
    console.error('Erreur inattendue:', error);
    return NextResponse.json({ 
      error: "Une erreur inattendue est survenue",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
