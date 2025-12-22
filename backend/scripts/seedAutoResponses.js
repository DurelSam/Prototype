const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const Communication = require("../src/models/Communication");
const User = require("../src/models/User");
const Tenant = require("../src/models/Tenant");

// --- DONNÉES FICTIVES POUR LE SEEDING ---
const mockSubjects = [
  "Demande de devis pour le projet Alpha",
  "Confirmation de rendez-vous demain",
  "Question sur la facture #4521",
  "Disponibilité pour un appel rapide ?",
  "Merci pour votre intervention",
  "Problème de connexion au portail",
  "Invitation au webinaire Q1",
  "Mise à jour des coordonnées bancaires",
  "Retard de livraison - Commande 8899",
  "Félicitations pour le nouveau lancement",
  "Besoin d'assistance technique urgent",
  "Renouvellement de contrat annuel",
  "Proposition de partenariat",
  "Feedback sur la dernière version",
  "Annulation de la réunion de lundi",
  "Demande de documentation API",
  "Erreur 404 sur la page login",
  "Intégration Slack possible ?",
  "Rappel : Paiement en attente",
  "Nouveaux tarifs 2026",
  "Candidature spontanée - Développeur",
  "Question sur la politique de confidentialité",
  "Accès bloqué pour l'utilisateur admin",
  "Suggestion d'amélioration UX",
  "Bonne année 2026 !"
];

const mockSenders = [
  { name: "Jean Dupont", email: "jean.dupont@example.com" },
  { name: "Marie Curie", email: "marie.curie@science.org" },
  { name: "Paul Martin", email: "p.martin@entreprise-fictive.fr" },
  { name: "Support Client", email: "client.support@grandgroupe.com" },
  { name: "Alice Wonderland", email: "alice@wonderland.net" },
  { name: "Bob Builder", email: "bob@builder.co.uk" },
  { name: "Charlie Chaplin", email: "charlie@cinema.hollywood" },
  { name: "David Bowie", email: "david@music.star" },
  { name: "Elon Musk", email: "elon@mars.space" },
  { name: "Freddie Mercury", email: "freddie@queen.band" }
];

const mockContents = [
  "Bonjour, je souhaiterais obtenir un devis pour le projet mentionné en objet. Merci.",
  "Est-ce que 14h vous convient pour notre point de demain ?",
  "Je ne comprends pas la ligne 3 de la facture reçue ce matin.",
  "Avez-vous 5 minutes pour discuter de la stratégie ?",
  "Super boulot de l'équipe hier, tout fonctionne à merveille.",
  "Impossible de me connecter ce matin, message d'erreur 'Token Invalid'.",
  "Nous organisons un webinaire sur les tendances 2026, inscrivez-vous !",
  "Voici notre nouveau RIB en pièce jointe pour les prochains virements.",
  "La commande n'est toujours pas arrivée, pouvez-vous vérifier ?",
  "Bravo pour la mise en ligne, le site est magnifique.",
  "Le serveur de prod est lent, pouvez-vous jeter un œil ?",
  "Notre contrat expire le mois prochain, quelles sont les options ?",
  "Nous aimerions discuter d'une collaboration potentielle.",
  "J'ai remarqué un petit bug sur le bouton 'Envoyer'.",
  "Désolé, je dois reporter notre call à la semaine prochaine.",
  "Où puis-je trouver la doc pour l'endpoint /users ?",
  "La page de login renvoie une 404 depuis ce matin.",
  "Est-il prévu d'ajouter une intégration avec Slack ?",
  "Sauf erreur de notre part, la facture de novembre est impayée.",
  "Veuillez noter que nos tarifs augmenteront de 2% au 1er janvier.",
  "Je vous envoie mon CV pour le poste de Fullstack JS.",
  "Comment sont traitées mes données personnelles ?",
  "Mon compte semble verrouillé après 3 tentatives.",
  "Ce serait bien d'avoir un mode sombre sur l'app mobile.",
  "Meilleurs vœux à toute l'équipe pour cette nouvelle année !"
];

const mockSuggestedResponses = [
  "Bonjour,\n\nMerci pour votre demande. Je transmets votre dossier à notre équipe commerciale qui vous enverra un devis sous 24h.\n\nCordialement,",
  "Bonjour,\n\nC'est noté pour 14h demain. Je vous envoie l'invitation Teams dans la foulée.\n\nÀ demain,",
  "Bonjour,\n\nJe vais vérifier cela avec la comptabilité et je reviens vers vous rapidement avec une explication.\n\nBien à vous,",
  "Bonjour,\n\nJe suis disponible à 15h30 si cela vous convient. Dites-moi si c'est bon pour vous.\n\nCordialement,",
  "Bonjour,\n\nMerci beaucoup pour votre retour positif ! Je transmettrai à toute l'équipe.\n\nBonne journée,",
  "Bonjour,\n\nJe suis désolé pour ce désagrément. Je viens de réinitialiser votre session, pouvez-vous réessayer ?\n\nCordialement,",
  "Bonjour,\n\nMerci pour l'invitation, je me suis inscrit.\n\nCordialement,",
  "Bonjour,\n\nBien reçu, nous avons mis à jour vos coordonnées bancaires dans notre système.\n\nCordialement,",
  "Bonjour,\n\nJe suis navré pour ce retard. Je contacte le transporteur immédiatement pour avoir un statut précis.\n\nBien à vous,",
  "Bonjour,\n\nMerci beaucoup ! C'est le résultat de mois de travail acharné.\n\nCordialement,",
  "Bonjour,\n\nNos équipes techniques sont dessus. Nous vous tenons informé dès que la latence est résolue.\n\nCordialement,",
  "Bonjour,\n\nJe vous propose un point téléphonique jeudi pour discuter du renouvellement et des nouvelles offres.\n\nBien à vous,",
  "Bonjour,\n\nMerci de votre intérêt. Pouvez-vous nous envoyer une présentation plus détaillée de votre offre ?\n\nCordialement,",
  "Bonjour,\n\nMerci pour ce feedback. J'ai créé un ticket pour l'équipe de développement.\n\nCordialement,",
  "Bonjour,\n\nPas de problème, c'est noté. Proposez-moi de nouveaux créneaux quand vous pourrez.\n\nÀ bientôt,",
  "Bonjour,\n\nLa documentation API est disponible sur https://docs.example.com/api.\n\nBonne lecture,",
  "Bonjour,\n\nMerci du signalement. Le problème est identifié et le correctif est en cours de déploiement.\n\nCordialement,",
  "Bonjour,\n\nOui, l'intégration Slack est prévue pour la roadmap Q2 2026.\n\nCordialement,",
  "Bonjour,\n\nJe vérifie avec la compta, le virement a dû partir hier. Je vous tiens au courant.\n\nBien à vous,",
  "Bonjour,\n\nC'est bien noté pour la mise à jour tarifaire.\n\nCordialement,",
  "Bonjour,\n\nMerci pour votre candidature. Nous l'étudions et reviendrons vers vous si votre profil correspond.\n\nCordialement,",
  "Bonjour,\n\nVous trouverez tous les détails sur notre politique GDPR ici : https://example.com/privacy.\n\nCordialement,",
  "Bonjour,\n\nJe viens de débloquer votre compte. Vous devriez recevoir un email de réinitialisation de mot de passe.\n\nCordialement,",
  "Bonjour,\n\nExcellente idée ! C'est une fonctionnalité très demandée que nous allons prioriser.\n\nMerci,",
  "Bonjour,\n\nMerci beaucoup ! Très bonne année 2026 à vous aussi, pleine de réussite.\n\nCordialement,"
];

// --- FONCTION DE SEEDING ---
const seedAutoResponses = async () => {
  try {
    // 1. Connexion DB
    await connectDB();

    // 2. Récupérer un utilisateur Admin pour lier les données
    // On cherche spécifiquement durelzanfack@gmail.com ou un UpperAdmin
    const adminUser = await User.findOne({ 
      $or: [
        { email: "durelzanfack@gmail.com" },
        { role: { $in: ["UpperAdmin", "Admin"] } }
      ]
    });

    if (!adminUser) {
      console.error("❌ Aucun utilisateur Admin trouvé. Veuillez d'abord créer un utilisateur.");
      process.exit(1);
    }

    const tenantId = adminUser.tenant_id;
    const userId = adminUser._id;

    console.log(`👤 Utilisateur trouvé: ${adminUser.email} (Tenant: ${tenantId})`);

    // 3. Créer 25 communications
    const communications = [];

    for (let i = 0; i < 25; i++) {
      const sender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
      const subject = mockSubjects[i];
      const content = mockContents[i];
      const suggestedResponse = mockSuggestedResponses[i];
      
      // Date aléatoire dans les 7 derniers jours
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      // Priorité Low ou Medium (pour être éligible Auto Response)
      const urgency = Math.random() > 0.5 ? "Low" : "Medium";

      communications.push({
        tenant_id: tenantId,
        userId: userId,
        source: Math.random() > 0.3 ? "outlook" : "gmail", // Varier un peu les sources
        externalId: `mock-auto-${Date.now()}-${i}`,
        isRead: false,
        sender: {
          name: sender.name,
          email: sender.email,
        },
        recipient: {
          email: adminUser.email,
        },
        subject: subject,
        content: content,
        snippet: content.substring(0, 100),
        status: "To Validate",
        hasAutoResponse: false, // CRUCIAL : Pas encore répondu
        hasBeenReplied: false,  // CRUCIAL
        autoActivation: 'auto',
        ai_analysis: {
          summary: `Résumé IA : ${content}`,
          sentiment: Math.random() > 0.5 ? "Positive" : "Neutral",
          urgency: urgency,
          requiresResponse: true,
          suggestedResponse: suggestedResponse, // CRUCIAL : La suggestion est là
          processedAt: new Date(),
        },
        receivedAt: date,
        slaDueDate: new Date(date.getTime() + 24 * 60 * 60 * 1000), // J+1
      });
    }

    // 4. Insérer en masse
    await Communication.insertMany(communications);

    console.log(`✅ ${communications.length} emails injectés avec succès pour le test Auto Response !`);
    console.log("👉 Allez dans l'onglet 'Réponses Auto' pour les voir.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding :", error);
    process.exit(1);
  }
};

// Exécuter le script
seedAutoResponses();
