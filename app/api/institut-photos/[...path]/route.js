import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/institut-photos/[...path]
 * 
 * Sert des fichiers statiques (images) depuis le dossier local-blob/institut-photos.
 * Exemple : /api/institut-photos/uuid/logo.jpg -> lit local-blob/institut-photos/uuid/logo.jpg
 */
export async function GET(request, { params }) {
  // params.path est un tableau (ex: ['uuid', 'logo.jpg'])
  const pathSegments = params.path;
  
  // Sécurité basique : empêcher la remontée de dossier (..)
  if (pathSegments.some(segment => segment.includes('..'))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'local-blob', 'institut-photos', ...pathSegments);

  try {
    // Lecture du fichier
    const fileBuffer = await fs.readFile(filePath);
    
    // Détection basique du mime type
    const ext = path.extname(filePath).toLowerCase();
    let mime = 'application/octet-stream';
    if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
    else if (ext === '.png') mime = 'image/png';
    else if (ext === '.gif') mime = 'image/gif';
    else if (ext === '.svg') mime = 'image/svg+xml';
    else if (ext === '.webp') mime = 'image/webp';

    // Retourne la réponse avec le bon Content-Type
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=3600' // Cache 1h
      }
    });

  } catch (error) {
    // Si fichier non trouvé
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
