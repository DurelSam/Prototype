require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Communication = require('../src/models/Communication');
const User = require('../src/models/User');
const Tenant = require('../src/models/Tenant');

const SUBJECTS = [
  "Demande de devis pour le projet Alpha", "Confirmation de rendez-vous demain", "Question sur la facture #4521",
  "Disponibilité pour un appel rapide ?", "Merci pour votre intervention", "Problème de connexion au portail",
  "Invitation au webinaire Q1", "Mise à jour des coordonnées bancaires", "Retard de livraison - Commande 8899",
  "Félicitations pour le nouveau lancement", "Besoin d'assistance technique urgent", "Renouvellement de contrat annuel",
  "Proposition de partenariat", "Feedback sur la dernière version", "Annulation de la réunion de lundi",
  "Demande de documentation API", "Erreur 404 sur la page login", "Intégration Slack possible ?",
  "Rappel : Paiement en attente", "Nouveaux tarifs 2026", "Candidature spontanée - Développeur",
  "Question sur la politique de confidentialité", "Accès bloqué pour l'utilisateur admin", "Suggestion d'amélioration UX",
  "Bonne année 2026 !"
];

const SENDERS = [
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

const CONTENTS = [
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

const SUGGESTED = [
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

const run = async () => {
  try {
    await connectDB();

    const email = "durelzanfack@gmail.com";
    const user = await User.findOne({ email }).populate('tenant_id');
    if (!user) {
      console.error("❌ Utilisateur non trouvé:", email);
      process.exit(1);
    }
    if (!user.tenant_id || user.tenant_id.companyName !== "Di") {
      console.error("❌ Tenant invalide pour l'utilisateur. Attendu: 'Di', Reçu:", user.tenant_id?.companyName);
      process.exit(1);
    }

    const tenantId = user.tenant_id._id;
    const userId = user._id;

    const docs = [];
    for (let i = 0; i < 25; i++) {
      const sender = SENDERS[Math.floor(Math.random() * SENDERS.length)];
      const subject = SUBJECTS[i];
      const content = CONTENTS[i];
      const suggestedResponse = SUGGESTED[i];

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const urgency = Math.random() > 0.5 ? "Low" : "Medium";

      docs.push({
        tenant_id: tenantId,
        userId: userId,
        source: Math.random() > 0.5 ? "outlook" : "gmail",
        externalId: `seed-existing-di-${Date.now()}-${i}`,
        isRead: false,
        sender: { name: sender.name, email: sender.email },
        recipient: { email },
        subject,
        content,
        snippet: content.substring(0, 120),
        status: "To Validate",
        hasAutoResponse: false,
        hasBeenReplied: false,
        autoActivation: 'auto',
        ai_analysis: {
          summary: `Résumé : ${content}`,
          sentiment: Math.random() > 0.5 ? "Positive" : "Neutral",
          urgency,
          requiresResponse: true,
          suggestedResponse,
          processedAt: new Date(),
        },
        receivedAt: date,
        slaDueDate: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    await Communication.insertMany(docs);
    console.log(`✅ ${docs.length} emails injectés pour 'Di' / ${email}`);
    console.log("👉 Vérifiez l'onglet 'Réponses Auto'.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur d'injection:", err);
    process.exit(1);
  }
};

run();
