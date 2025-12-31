const fs = require('fs/promises');
const path = require('path');

// Dossier racine pour le stockage "local-blob"
const LOCAL_BLOB_ROOT = path.join(process.cwd(), 'local-blob');

/**
 * putBlob: Écrit un fichier JSON dans le stockage local.
 * Utilise JSON.stringify.
 */
async function putBlob(container, name, data) {
  const filePath = path.join(LOCAL_BLOB_ROOT, container, name);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  return `/local-blob/${container}/${name}`; 
}

/**
 * putFile: Écrit un fichier Binaire (Buffer) dans le stockage local.
 * Utilisé pour les images.
 * Retourne l'URL publique (via l'API Next.js).
 */
async function putFile(container, name, buffer) {
  console.log(`[putFile] Write start: container=${container}, name=${name}, size=${buffer.length}`);
  const filePath = path.join(LOCAL_BLOB_ROOT, container, name);
  console.log(`[putFile] Target path: ${filePath}`);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  console.log(`[putFile] Write done.`);
  
  // Si c'est dans institut-photos, on retourne l'URL API
  if (container === 'institut-photos' || container.startsWith('institut-photos/')) {
    // container: "institut-photos/uuid"
    // name: "logo.jpg"
    // URL: /api/institut-photos/uuid/logo.jpg
    // Note: container contient déjà "institut-photos/" ou est "institut-photos"
    // On veut construire /api/<container>/<name>
    // Mais container peut être "institut-photos/UUID"
    return `/api/${container}/${name}`;
  }

  return `/local-blob/${container}/${name}`;
}

/**
 * getBlob: Lit un fichier JSON.
 */
async function getBlob(container, name) {
  try {
    const filePath = path.join(LOCAL_BLOB_ROOT, container, name);
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

module.exports = {
  putBlob,
  putFile,
  getBlob
};