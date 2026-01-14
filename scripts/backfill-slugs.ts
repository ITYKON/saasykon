import { prisma } from "../lib/prisma";
import { generateUniqueSlug } from "../lib/salon-slug-server";

async function main() {
  console.log("Starting backfill of slugs...");
  
  // 1. Lister les business sans slug
  const businesses = await prisma.businesses.findMany({
    where: { slug: null },
    include: {
        business_locations: {
            where: { is_primary: true },
            include: { cities: true }
        }
    }
  });

  console.log(`Found ${businesses.length} businesses without slug.`);

  for (const business of businesses) {
    const primaryLocation = business.business_locations?.find(loc => loc.is_primary) || business.business_locations?.[0];
    const city = primaryLocation?.cities?.name || primaryLocation?.address_line1 || "";
    const name = business.public_name || business.legal_name || "salon";
    
    console.log(`Processing ${business.id}: ${name} (${city})`);

    try {
        const slug = await generateUniqueSlug(name, city, business.id);
        
        await prisma.businesses.update({
            where: { id: business.id },
            data: { slug }
        });
        
        console.log(`> Updated: ${slug}`);
    } catch (e) {
        console.error(`> Error updating ${business.id}:`, e);
    }
  }

  console.log("Backfill completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
