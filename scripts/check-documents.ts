#!/usr/bin/env node

/**
 * Script pour vérifier les documents en attente et envoyer des rappels
 * À exécuter quotidiennement via un CRON
 */

import { prisma } from '../lib/prisma';
import { sendDocumentReminders, checkAndBlockExpiredAccounts } from '../lib/reminderService';
import { logger } from '../lib/logger';

async function main() {
  try {
    logger.info('Début de la vérification des documents en attente...');
    
    // 1. Envoyer des rappels pour les documents manquants
    const reminderResult = await sendDocumentReminders();
    logger.info(`Rappels envoyés : ${reminderResult.count} entreprises notifiées`);
    
    // 2. Vérifier et bloquer les comptes expirés
    const blockResult = await checkAndBlockExpiredAccounts();
    logger.info(`Comptes bloqués : ${blockResult.blockedCount || 0} comptes`);
    
    logger.info('Vérification des documents terminée avec succès');
    process.exit(0);
  } catch (error) {
    logger.error('Erreur lors de la vérification des documents:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  main();
}
