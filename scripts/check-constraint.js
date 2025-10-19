const { PrismaClient } = require("../lib/generated/prisma");

const prisma = new PrismaClient();

async function checkConstraint() {
  try {
    // Vérifier la contrainte sur billing_interval
    const result = await prisma.$queryRaw`
      SELECT 
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'plans'
      AND con.conname LIKE '%billing_interval%';
    `;
    
    console.log("📋 Contrainte sur billing_interval:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConstraint();
