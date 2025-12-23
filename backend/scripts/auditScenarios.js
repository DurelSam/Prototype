
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');

const auditScenarios = async () => {
  try {
    await connectDB();
    console.log('✅ Connecté à MongoDB');

    // 1. Récupérer l'utilisateur
    const email = 'durelzanfack@gmail.com';
    const user = await User.findOne({ email });
    if (!user) process.exit(1);

    const filter = { tenant_id: user.tenant_id, source: { $ne: 'whatsapp' } }; // Uniquement Emails

    // 2. TOTAL SYNC
    const totalSync = await Communication.countDocuments(filter);
    console.log(`📊 TOTAL EMAILS SYNC: ${totalSync}`);

    // --- ANALYSE DES CATÉGORIES (Mutuellement Exclusives) ---

    // 1. DÉJÀ TRAITÉS (Fini)
    // Statut n'est pas "To Validate" OU a été répondu
    const processedCount = await Communication.countDocuments({
        ...filter,
        $or: [
            { status: { $ne: 'To Validate' } },
            { hasBeenReplied: true }
        ]
    });

    // 2. EN ATTENTE (Reste à faire)
    // Statut "To Validate" ET Pas encore répondu
    const pendingFilter = {
        ...filter,
        status: 'To Validate',
        hasBeenReplied: false
    };
    const pendingCount = await Communication.countDocuments(pendingFilter);

    console.log(`\n--- RÉPARTITION GLOBALE ---`);
    console.log(`✅ TRAITÉS (Processed): ${processedCount}`);
    console.log(`⏳ EN ATTENTE (Pending):  ${pendingCount}`);
    console.log(`-----------------------`);
    console.log(`SOMME (Traités + En Attente): ${processedCount + pendingCount}`);
    console.log(`ÉCART: ${totalSync - (processedCount + pendingCount)}`);

    // --- DÉTAIL DES "EN ATTENTE" (Scénario A vs B) ---
    // On divise les "Pending" selon l'urgence ou la complexité
    
    // Scénario B (Complexe/Urgent) : High/Critical
    const scenarioB_Count = await Communication.countDocuments({
        ...pendingFilter,
        'ai_analysis.urgency': { $in: ['High', 'Critical'] }
    });

    // Scénario A (Standard/Auto) : Low/Medium
    // Ou ceux qui n'ont pas d'urgence définie (par défaut Medium souvent)
    const scenarioA_Count = await Communication.countDocuments({
        ...pendingFilter,
        'ai_analysis.urgency': { $nin: ['High', 'Critical'] } // Le reste
    });

    console.log(`\n--- DÉTAIL DES "EN ATTENTE" ---`);
    console.log(`🔴 SCÉNARIO B (Complexe/Urgent - High/Critical): ${scenarioB_Count}`);
    console.log(`🟢 SCÉNARIO A (Standard - Low/Medium):           ${scenarioA_Count}`);
    console.log(`-----------------------`);
    console.log(`SOMME (A + B): ${scenarioA_Count + scenarioB_Count}`);
    console.log(`Check vs Pending: ${pendingCount === (scenarioA_Count + scenarioB_Count) ? 'OK' : 'ERREUR'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

auditScenarios();
