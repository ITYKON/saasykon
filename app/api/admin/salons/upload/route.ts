import { NextResponse } from "next/server";
// import { writeFile } from "fs/promises"; // Plus utilisé
import path from "path";
import { requireAdminOrPermission } from "@/lib/authorization";
// On importe le helper (attention c'est du JS/CommonJS, dans un projet TS Next.js ça passe généralement via require ou si on a typé. 
// Le fichier est en .js, on peut l'importer comme module si allowJs est true dans tsconfig.
// Sinon `const { putFile } = require("@/lib/blob-local");`
const { putFile } = require("@/lib/blob-local");

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const authCheck = await requireAdminOrPermission("salons");
  if (authCheck instanceof NextResponse) return authCheck;

  // Gestion upload image (logo/couverture)
  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
  }

  // Idéalement on devrait récupérer l'ID du business pour faire un dossier propre : institut-photos/<UUID>/...
  // Mais la route upload est générique et appelée AVANT de sauvegarder le formulaire parfois.
  // On va utiliser un dossier temporaire "temp" ou juste utiliser le timestamp comme ID pour le moment si on n'a pas l'ID business.
  // Ou on demande au front d'envoyer l'ID business ?
  // Pour l'instant, on garde la logique "timestamp" mais on range dans 'institut-photos/temp' ou 'institut-photos/uploads'
  
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name);
  const fileName = `${Date.now()}${ext}`; // ex: 1729384.jpg
  
  // On stocke dans : local-blob/institut-photos/uploads/1729384.jpg
  // Container : "institut-photos/uploads"
  const container = "institut-photos/uploads";
  
  try {
    console.log(`[API Upload] Calling putFile... container=${container}, fileName=${fileName}`);
    const publicUrl = await putFile(container, fileName, buffer);
    console.log(`[API Upload] putFile returned: ${publicUrl}`);
    // Retour: /api/institut-photos/uploads/1729384.jpg
    
    return NextResponse.json({ url: publicUrl });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
