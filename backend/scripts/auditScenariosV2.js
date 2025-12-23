
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');

const auditV2 = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'durelzanfack@gmail.com' });
    const baseFilter = { 
        tenant_id: user.tenant_id, 
        source: { $ne: 'whatsapp' },
        status: 'To Validate',
        hasBeenReplied: false
    };

    console.log(`👤 Audit pour: ${user.email}`);
    const totalPending = await Communication.countDocuments(baseFilter);
    console.log(`📊 TOTAL EMAILS EN ATTENTE: ${totalPending}`);

    // --- SCÉNARIO C : PAS DE RÉPONSE ---
    // Toutes priorités, requiresResponse = false
    const countC = await Communication.countDocuments({
        ...baseFilter,
        'ai_analysis.requiresResponse': false
    });

    // --- SCÉNARIO B1 : À RÉPONDRE (MANUEL/URGENT) ---
    // High/Critical, requiresResponse = true
    const countB1 = await Communication.countDocuments({
        ...baseFilter,
        'ai_analysis.requiresResponse': true,
        'ai_analysis.urgency': { $in: ['High', 'Critical'] }
    });

    // --- SCÉNARIO A vs B2 (Low/Medium qui nécessitent réponse) ---
    // On doit distinguer ceux qui sont "Auto" (A) de ceux qui sont "Assistés" (B2)
    
    // Filtre commun pour A et B2
    const lowMediumResponseFilter = {
        ...baseFilter,
        'ai_analysis.requiresResponse': true,
        'ai_analysis.urgency': { $in: ['Low', 'Medium'] }
    };

    // Pour distinguer, on regarde awaitingUserInput ou autoActivation
    // Si awaitingUserInput est true => B2
    // Sinon => A
    
    const countB2 = await Communication.countDocuments({
        ...lowMediumResponseFilter,
        $or: [
            { awaitingUserInput: true },
            { autoActivation: 'assisted' } // Si configuré explicitement comme assisté
        ]
    });

    // Le reste est le Scénario A (Auto)
    // On soustrait B2 du total Low/Medium, ou on fait une requête inverse
    const totalLowMedium = await Communication.countDocuments(lowMediumResponseFilter);
    
    // Calcul plus précis pour A : Low/Medium ET Pas B2
    const countA = await Communication.countDocuments({
        ...lowMediumResponseFilter,
        awaitingUserInput: false,
        autoActivation: { $ne: 'assisted' }
    });

    // Vérification des sommes
    const totalCalculated = countC + countB1 + countB2 + countA;

    console.log(`\n--- RÉSULTATS PAR SCÉNARIO ---`);
    console.log(`⚪ SCÉNARIO C (Pas de réponse - Summaries):    ${countC}`);
    console.log(`🔴 SCÉNARIO B1 (Manuel - À Répondre):         ${countB1}`);
    console.log(`🟣 SCÉNARIO B2 (Assisté - Besoin Contexte):    ${countB2}`);
    console.log(`🔵 SCÉNARIO A (Auto - Réponses Auto):         ${countA}`);
    
    console.log(`\n--- VÉRIFICATION ---`);
    console.log(`Total Calculé: ${totalCalculated}`);
    console.log(`Total Réel:    ${totalPending}`);
    console.log(`Différence:    ${totalPending - totalCalculated}`);

    // Si différence, c'est souvent le chevauchement B2/A.
    // Voyons si autoActivation perturbe.

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

auditV2();
