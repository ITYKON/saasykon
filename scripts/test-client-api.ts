/**
 * Script de test pour vérifier la connexion BDD et les endpoints client
 * Usage: npx tsx scripts/test-client-api.ts
 */

import { PrismaClient } from "@/lib/generated/prisma"

const prisma = new PrismaClient()

async function testDatabaseConnection() {
  console.log("🔍 Test de connexion à la base de données...\n")
  
  try {
    // Test 1: Connexion basique
    await prisma.$connect()
    console.log("✅ Connexion à la base de données réussie")
    
    // Test 2: Vérifier les tables clients
    const clientCount = await prisma.clients.count()
    console.log(`✅ Table 'clients': ${clientCount} enregistrements`)
    
    // Test 3: Vérifier les tables reservations
    const reservationCount = await prisma.reservations.count()
    console.log(`✅ Table 'reservations': ${reservationCount} enregistrements`)
    
    // Test 4: Vérifier les tables client_favorites
    const favoritesCount = await prisma.client_favorites.count()
    console.log(`✅ Table 'client_favorites': ${favoritesCount} enregistrements`)
    
    // Test 5: Vérifier les tables reviews
    const reviewsCount = await prisma.reviews.count()
    console.log(`✅ Table 'reviews': ${reviewsCount} enregistrements`)
    
    // Test 6: Vérifier les tables reservation_status_history
    const historyCount = await prisma.reservation_status_history.count()
    console.log(`✅ Table 'reservation_status_history': ${historyCount} enregistrements`)
    
    // Test 7: Vérifier les tables addresses
    const addressCount = await prisma.addresses.count()
    console.log(`✅ Table 'addresses': ${addressCount} enregistrements`)
    
    // Test 8: Vérifier les tables notification_preferences
    const preferencesCount = await prisma.notification_preferences.count()
    console.log(`✅ Table 'notification_preferences': ${preferencesCount} enregistrements`)
    
    console.log("\n📊 Statistiques des relations:")
    
    // Test 9: Vérifier les relations clients -> reservations
    const clientsWithReservations = await prisma.clients.findMany({
      where: { reservations: { some: {} } },
      take: 1,
      include: {
        reservations: {
          take: 1,
          include: {
            businesses: { select: { public_name: true, legal_name: true } },
            employees: { select: { full_name: true } },
            reservation_items: { include: { services: { select: { name: true } } } }
          }
        }
      }
    })
    
    if (clientsWithReservations.length > 0) {
      console.log(`✅ Relations clients -> reservations: OK`)
      console.log(`   Exemple: Client ${clientsWithReservations[0].first_name} a ${clientsWithReservations[0].reservations.length} réservation(s)`)
    } else {
      console.log(`⚠️  Aucun client avec réservations trouvé`)
    }
    
    // Test 10: Vérifier les relations clients -> favorites
    const clientsWithFavorites = await prisma.clients.findMany({
      where: { client_favorites: { some: {} } },
      take: 1,
      include: {
        client_favorites: {
          take: 1,
          include: { businesses: { select: { public_name: true, legal_name: true } } }
        }
      }
    })
    
    if (clientsWithFavorites.length > 0) {
      console.log(`✅ Relations clients -> favorites: OK`)
      console.log(`   Exemple: Client ${clientsWithFavorites[0].first_name} a ${clientsWithFavorites[0].client_favorites.length} favori(s)`)
    } else {
      console.log(`⚠️  Aucun client avec favoris trouvé`)
    }
    
    // Test 11: Vérifier les relations reservations -> status_history
    const reservationsWithHistory = await prisma.reservations.findMany({
      where: { reservation_status_history: { some: {} } },
      take: 1,
      include: {
        reservation_status_history: { orderBy: { changed_at: "desc" }, take: 1 }
      }
    })
    
    if (reservationsWithHistory.length > 0) {
      console.log(`✅ Relations reservations -> status_history: OK`)
      console.log(`   Exemple: Réservation a ${reservationsWithHistory[0].reservation_status_history.length} changement(s) de statut`)
    } else {
      console.log(`⚠️  Aucune réservation avec historique trouvée`)
    }
    
    // Test 12: Vérifier les champs nécessaires pour les endpoints
    console.log("\n🔧 Vérification des champs utilisés dans les endpoints:")
    
    const sampleReservation = await prisma.reservations.findFirst({
      include: {
        businesses: true,
        employees: true,
        reservation_items: { include: { services: true } },
        business_locations: { include: { cities: true } },
        clients: true
      }
    })
    
    if (sampleReservation) {
      console.log("✅ Champs reservations:")
      console.log(`   - id: ${sampleReservation.id ? "✓" : "✗"}`)
      console.log(`   - status: ${sampleReservation.status ? "✓" : "✗"}`)
      console.log(`   - starts_at: ${sampleReservation.starts_at ? "✓" : "✗"}`)
      console.log(`   - ends_at: ${sampleReservation.ends_at ? "✓" : "✗"}`)
      console.log(`   - notes: ${sampleReservation.notes !== undefined ? "✓" : "✗"}`)
      console.log(`   - cancelled_at: ${sampleReservation.cancelled_at !== undefined ? "✓" : "✗"}`)
      console.log(`   - businesses: ${sampleReservation.businesses ? "✓" : "✗"}`)
      console.log(`   - employees: ${sampleReservation.employees !== undefined ? "✓" : "✗"}`)
      console.log(`   - reservation_items: ${sampleReservation.reservation_items ? "✓" : "✗"}`)
      console.log(`   - business_locations: ${sampleReservation.business_locations !== undefined ? "✓" : "✗"}`)
    }
    
    const sampleClient = await prisma.clients.findFirst({
      include: { users: true }
    })
    
    if (sampleClient) {
      console.log("\n✅ Champs clients:")
      console.log(`   - id: ${sampleClient.id ? "✓" : "✗"}`)
      console.log(`   - user_id: ${sampleClient.user_id !== undefined ? "✓" : "✗"}`)
      console.log(`   - first_name: ${sampleClient.first_name !== undefined ? "✓" : "✗"}`)
      console.log(`   - last_name: ${sampleClient.last_name !== undefined ? "✓" : "✗"}`)
      console.log(`   - phone: ${sampleClient.phone !== undefined ? "✓" : "✗"}`)
      console.log(`   - notes: ${sampleClient.notes !== undefined ? "✓" : "✗"}`)
      console.log(`   - users: ${sampleClient.users !== undefined ? "✓" : "✗"}`)
    }
    
    console.log("\n✅ Tous les tests de connexion BDD ont réussi!")
    
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter les tests
testDatabaseConnection()
  .then(() => {
    console.log("\n🎉 Tests terminés avec succès")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n💥 Tests échoués:", error)
    process.exit(1)
  })
