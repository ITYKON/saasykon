/**
 * Interface simulée pour Azure Blob Storage.
 * Pour l'instant, c'est juste un placeholder qui suit la même signature que blob-local.js.
 */

async function readBlob(container, blobName) {
  console.log(`[Azure] Simulated READ from ${container}/${blobName}`);
  return null;
}

async function writeBlob(container, blobName, data) {
  console.log(`[Azure] Simulated WRITE to ${container}/${blobName}`);
  return `https://fake-azure-url.com/${container}/${blobName}`;
}

module.exports = {
  readBlob,
  writeBlob
};
