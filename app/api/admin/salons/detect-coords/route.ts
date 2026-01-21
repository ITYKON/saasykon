import { NextResponse } from "next/server";
import { requireAdminOrPermission } from "@/lib/authorization";

async function expandShortUrl(url: string): Promise<string> {
  if (!url) return url;
  // If it's already a full maps.google or google.com/maps link, no need to expand much, 
  // but we still follow redirects just in case of short maps.app.goo.gl links
  if (!url.includes("goo.gl") && !url.includes("maps.app.goo.gl") && !url.includes("g.page") && !url.includes("bit.ly") && !url.includes("t.co")) {
    return url;
  }
  
  try {
    const response = await fetch(url, { 
      method: "GET", 
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    return response.url;
  } catch (error) {
    console.warn("Failed to expand short URL:", url, error);
    return url;
  }
}

function extractCoordinatesFromUrl(url: string): { latitude: string, longitude: string } | null {
  if (!url) return null;
  
  // Decode the URL if it's encoded
  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    // Ignore decoding errors
  }

  console.log("Attempting to extract coordinates from:", decodedUrl);

  // Format 1: @lat,lng (most common in browser URL)
  // Pattern: @36.8167305,5.771494
  const atMatch = decodedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { latitude: atMatch[1], longitude: atMatch[2] };
  }
  
  // Format 2: !3dlat!4dlng (common in Place URLs)
  // Pattern: !3d36.8167305!4d5.771494
  const dMatch = decodedUrl.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/) || decodedUrl.match(/!4d(-?\d+\.\d+).*?!3d(-?\d+\.\d+)/);
  if (dMatch) {
    // If we matched the second pattern, dMatch[1] is longitude and dMatch[2] is latitude
    const isReverse = decodedUrl.indexOf("!4d") < decodedUrl.indexOf("!3d");
    return { 
      latitude: isReverse ? dMatch[2] : dMatch[1], 
      longitude: isReverse ? dMatch[1] : dMatch[2] 
    };
  }

  // Format 3: query parameters (q=lat,lng or ll=lat,lng)
  const qMatch = decodedUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { latitude: qMatch[1], longitude: qMatch[2] };
  }

  // Format 4: search results or other nested data
  // Pattern: 12.345,67.890 (standalone coordinates in data string)
  const nestedMatch = decodedUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (nestedMatch) {
    const lat = parseFloat(nestedMatch[1]);
    const lng = parseFloat(nestedMatch[2]);
    // Basic verification: Algeria bounds approx Lat 18-38, Lng -9-12
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

    if (!url) {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    }

    console.log("[DetectCoords] Input URL:", url);

    const expandedUrl = await expandShortUrl(url);
    console.log("[DetectCoords] Expanded URL:", expandedUrl);

    const coords = extractCoordinatesFromUrl(expandedUrl);

    if (coords) {
      console.log("[DetectCoords] Success:", coords);
      return NextResponse.json({ 
        success: true, 
        latitude: coords.latitude, 
        longitude: coords.longitude,
        source: expandedUrl === url ? "direct" : "expanded"
      });
    } else {
      console.warn("[DetectCoords] Extraction failed for:", expandedUrl);
      return NextResponse.json({ 
        success: false, 
        error: "Impossible d'extraire les coordonnées de ce lien. Assurez-vous d'utiliser un lien de partage ou d'attendre que la page Google Maps soit totalement chargée (le lien doit contenir le symbole '@' ou des coordonnées).",
        debugUrl: expandedUrl.substring(0, 100) + "..."
      }, { status: 404 });
    }
  } catch (error) {
    console.error("[DetectCoords] Server error:", error);
    return NextResponse.json({ 
      error: "Erreur serveur lors de la détection", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
