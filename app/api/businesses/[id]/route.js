import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBlob } from '@/lib/blob-local';

/**
 * GET /api/businesses/[id]
 * 
 * Cette route reconstitue l'objet "Business" complet :
 * 1. Lit les colonnes "Index" depuis PostgreSQL (rapide, léger).
 * 2. Lit le reste des données (description, images, etc.) depuis le JSON local.
 * 3. Fusionne les deux pour renvoyer l'objet final au client.
 */
export async function GET(request, { params }) {
  const { id } = params;

  // 1. Lecture de la mini-ligne PostgreSQL
  // On ne sélectionne QUE les colonnes conservées en base
  const bizPG = await prisma.businesses.findUnique({
    where: { id },
    select: {
      id: true,
      owner_user_id: true,
      status: true,
      trial_ends_at: true,
      // is_active: true (si existait)
    }
  });

  // Si l'ID n'existe pas en base, 404 direct
  if (!bizPG) {
    return NextResponse.json({ error: 'Business not found (PG)' }, { status: 404 });
  }

  // 2. Lecture du fichier JSON local
  const blobData = await getBlob('entities/businesses', `${id}.json`);

  // Si le JSON est introuvable, c'est une incohérence de données -> 404 ou 500
  if (!blobData) {
    return NextResponse.json({ error: 'Business blob data missing' }, { status: 404 });
  }

  // 3. Fusion des deux objets
  // L'objet final contient les clés de PG + les clés du JSON
  const mergedBusiness = {
    ...bizPG,     // id, status...
    ...blobData   // public_name, description, locations...
  };

  // Renvoie le JSON fusionné
  return NextResponse.json(mergedBusiness);
}
