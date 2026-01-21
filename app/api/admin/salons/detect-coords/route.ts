import { NextResponse } from "next/server";
import { requireAdminOrPermission } from "@/lib/authorization";

async function getFinalUrlAndBody(url: string): Promise<{ finalUrl: string, body: string }> {
  if (!url) return { finalUrl: url, body: "" };
  
  // If we suspect it needs expansion or is a place page, we fetch it
  const needsFetch = url.includes("goo.gl") || 
                    url.includes("maps.app.goo.gl") || 
                    url.includes("g.page") || 
                    url.includes("bit.ly") || 
                    url.includes("t.co") ||
                    url.includes("/place/") ||
                    !url.includes("@");
  
  if (!needsFetch) return { finalUrl: url, body: "" };
  
  try {
    const response = await fetch(url, { 
      method: "GET", 
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,webp,image/apng,*/*;q=0.8"
      }
    });
    
    const finalUrl = response.url;
    const body = await response.text();
    
    return { finalUrl, body };
  } catch (error) {
    console.warn("Failed to fetch/expand URL:", url, error);
    return { finalUrl: url, body: "" };
  }
}

function extractCoordinatesFromUrlOrBody(url: string, body: string): { latitude: string, longitude: string } | null {
  // 1. Try URL-based extraction first (most accurate)
  let decodedUrl = url;
  try { decodedUrl = decodeURIComponent(url); } catch (e) {}

  // Format @lat,lng
  const atMatch = decodedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { latitude: atMatch[1], longitude: atMatch[2] };
  
  // Format !3dlat!4dlng
  const dMatch = decodedUrl.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/) || decodedUrl.match(/!4d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (dMatch) {
    const isReverse = decodedUrl.indexOf("!4d") < decodedUrl.indexOf("!3d");
    return { latitude: isReverse ? dMatch[2] : dMatch[1], longitude: isReverse ? dMatch[1] : dMatch[2] };
  }

  // Format q=lat,lng
  const qMatch = decodedUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { latitude: qMatch[1], longitude: qMatch[2] };

  // 2. Try Body-based extraction (for /place/ links without coords in URL)
  if (body) {
    // Look for static map image (og:image) which usually has center coords
    const ogImageMatch = body.match(/property="og:image"\s+content="[^"]*?center=(-?\d+\.\d+)%2C(-?\d+\.\d+)/);
    if (ogImageMatch) return { latitude: ogImageMatch[1], longitude: ogImageMatch[2] };

    // Look for APP_INITIALIZATION_STATE or similar data blocks
    // Format: [[lat,lng],...]
    const initMatch = body.match(/\[\[(-?\d+\.\d+),(-?\d+\.\d+)\]/);
    if (initMatch) return { latitude: initMatch[1], longitude: initMatch[2] };
    
    // Fallback: look for common patterns in HTML metadata
    const metaMatch = body.match(/&amp;ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (metaMatch) return { latitude: metaMatch[1], longitude: metaMatch[2] };
  }

  // 3. Last resort: Any valid-looking coordinate pair in URL
  const nestedMatch = decodedUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (nestedMatch) {
    const lat = parseFloat(nestedMatch[1]);
    const lng = parseFloat(nestedMatch[2]);
    if (lat > 18 && lat < 38 && lng > -9 && lng < 15) {
      return { latitude: nestedMatch[1], longitude: nestedMatch[2] };
    }
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const authCheck = await requireAdminOrPermission("salons");
    if (authCheck instanceof NextResponse) return authCheck;

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    console.log("[DetectCoords] Input URL:", url);

    const { finalUrl, body } = await getFinalUrlAndBody(url);
    console.log("[DetectCoords] Final URL reached:", finalUrl);

    const coords = extractCoordinatesFromUrlOrBody(finalUrl, body);

    if (coords) {
      console.log("[DetectCoords] Found:", coords);
      return NextResponse.json({ 
        success: true, 
        ...coords,
        source: finalUrl !== url ? "expanded" : (body ? "scanned" : "direct")
      });
    } else {
      console.warn("[DetectCoords] No coordinates found in URL or body");
      return NextResponse.json({ 
        success: false, 
        error: "Impossible d'extraire les coordonnées. Vérifiez que la page Google Maps est chargée ou utilisez le bouton 'Partager'." 
      }, { status: 404 });
    }
  } catch (error) {
    console.error("[DetectCoords] Server error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la détection" }, { status: 500 });
  }
}
