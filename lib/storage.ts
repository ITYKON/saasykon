import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-3",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "yoka-uploads";

export async function uploadFile(buffer: ArrayBuffer, key: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(buffer),
      ACL: "public-read",
    });

    await s3Client.send(command);
    
    // Retourne l'URL complète du fichier
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-3'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Erreur lors du téléversement du fichier:", error);
    throw new Error("Échec du téléversement du fichier");
  }
}

export async function getSignedFileUrl(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL signée:", error);
    throw new Error("Impossible de générer l'URL du fichier");
  }
}
