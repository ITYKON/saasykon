const { PrismaClient } = require('./lib/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const locations = await prisma.business_locations.findMany({
    take: 10,
    include: { cities: true }
  });
  console.log(JSON.stringify(locations.map(l => ({
    address1: l.address_line1,
    address2: l.address_line2,
    cityName: l.cities?.name,
    wilaya: l.cities?.wilaya_number
  })), null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
