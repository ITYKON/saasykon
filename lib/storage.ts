import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'business-verification');

/**
 * Téléverse un fichier dans le dossier public/uploads/business-verification/
 * @param buffer Le contenu du fichier à téléverser
 * @param filename Le nom du fichier (sans le chemin)
 * @returns L'URL publique du fichier téléversé
 */
export async function uploadFile(buffer: ArrayBuffer, filename: string): Promise<string> {
  try {
    // Créer le répertoire s'il n'existe pas
    await mkdir(UPLOADS_DIR, { recursive: true });

    // Générer un nom de fichier unique
    const ext = filename.split('.').pop()?.toLowerCase() || 'bin';
    const safeExt = ext.substring(0, 6).replace(/[^a-z0-9]/g, '');
    const uniqueFilename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt || 'bin'}`;
    const fullPath = path.join(UPLOADS_DIR, uniqueFilename);

    // Écrire le fichier
    await writeFile(fullPath, Buffer.from(buffer));

    // Retourner l'URL relative au dossier public
    return `/uploads/business-verification/${uniqueFilename}`;
  } catch (error) {
    console.error("Erreur lors du téléversement du fichier:", error);
    throw new Error("Échec du téléversement du fichier");
  }
}

/**
 * Fonction de compatibilité qui retourne simplement l'URL du fichier
 * (non nécessaire en stockage local, mais conservée pour la compatibilité)
 */
export async function getSignedFileUrl(fileUrl: string): Promise<string> {
  return fileUrl; // En local, on retourne simplement l'URL directe
}
