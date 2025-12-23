
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');

const auditABC = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: 'durelzanfack@gmail.com' });
    const filter = { 
        tenant_id: user.tenant_id, 
        source: { $ne: 'whatsapp' },
        status: 'To Validate', // On regarde uniquement ce qui reste à faire
        hasBeenReplied: false
    };

    // Scénario B : Urgent (High/Critical)
    const countB = await Communication.countDocuments({
        ...filter,
        'ai_analysis.urgency': { $in: ['High', 'Critical'] }
    });

    // Scénario C : Pas de réponse requise (Peu importe l'urgence, si l'IA dit non)
    // Note : On priorise requiresResponse: false sur l'urgence
    const countC = await Communication.countDocuments({
        ...filter,
        'ai_analysis.requiresResponse': false
    });

    // Scénario A : Réponse requise Standard (Low/Medium)
    const countA = await Communication.countDocuments({
        ...filter,
        'ai_analysis.urgency': { $nin: ['High', 'Critical'] },
        'ai_analysis.requiresResponse': true
    });

    console.log(`📊 TOTAL EN ATTENTE: ${await Communication.countDocuments(filter)}`);
    console.log(`🔴 Scénario B (Urgent): ${countB}`);
    console.log(`⚪ Scénario C (Pas de réponse): ${countC}`);
    console.log(`🟢 Scénario A (Standard): ${countA}`);
    
    // Vérif Somme
    // Attention: Il peut y avoir chevauchement si ma logique ci-dessus n'est pas stricte.
    // Si un mail est High ET requiresResponse: false, il est compté dans B et C ?
    // Il faut une logique d'ordre.

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

auditABC();
