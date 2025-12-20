/**
 * Service d'Analyse IA avec Grok (xAI)
 *
 * Analyse les communications (emails, messages) pour extraire:
 * - Sentiment (Positive, Negative, Neutral)
 * - Urgence (Low, Medium, High, Critical)
 * - Résumé exécutif
 * - Points clés
 * - Actions items
 * - Entités détectées
 */

const { OpenAI } = require("openai");

class GrokService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: process.env.GROK_API_URL || "https://api.x.ai/v1",
    });
    this.model = "grok-4-fast-non-reasoning"; // Utilise grok-beta ou grok-4 selon disponibilité
  }

  /**
   * Analyse une communication (email/message)
   * @param {Object} communication - Objet contenant subject, content, sender
   * @returns {Object} Résultat d'analyse IA
   */
  async analyzeCommunication(communication) {
    console.log("🔶 [GrokService] analyzeCommunication APPELÉE");
    console.log("🔶 [GrokService] Communication reçue:", {
      subject: communication.subject?.substring(0, 30),
      contentLength: communication.content?.length,
      senderEmail: communication.sender?.email,
    });

    try {
      const { subject, content, sender } = communication;

      console.log("🔶 [GrokService] Données extraites:", {
        subject: subject?.substring(0, 30),
        contentLength: content?.length,
        sender: sender,
      });

      // Construire le prompt pour Grok
      const prompt = this.buildAnalysisPrompt(subject, content, sender);
      console.log(
        "🔶 [GrokService] Prompt construit, longueur:",
        prompt.length
      );

      console.log("🤖 Envoi de la communication à Grok pour analyse...");
      console.log("🔑 [GrokService] API Key présente:", !!this.client.apiKey);
      console.log("🔑 [GrokService] Model:", this.model);

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are an expert business communication analyst. Analyze emails and messages to extract key insights, sentiment, urgency level, and actionable items. Always respond in valid JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3, // Basse température pour des réponses plus cohérentes
      });

      const responseText = completion.choices[0].message.content;
      console.log("✅ Analyse Grok reçue");
      console.log(
        "📝 [GrokService] Réponse brute (premiers 200 chars):",
        responseText?.substring(0, 200)
      );

      // Parser la réponse JSON de Grok
      console.log("🔧 [GrokService] Parsing de la réponse...");
      const analysis = this.parseGrokResponse(responseText);
      console.log("✅ [GrokService] Analyse parsée:", {
        hasSummary: !!analysis.summary,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency,
      });

      return {
        summary: analysis.summary || "No summary available",
        sentiment: analysis.sentiment || "Neutral",
        urgency: analysis.urgency || "Medium",
        requiresResponse: analysis.requiresResponse !== undefined ? analysis.requiresResponse : false,
        responseReason: analysis.responseReason || "",
        keyPoints: analysis.keyPoints || [],
        actionItems: analysis.actionItems || [],
        entities: analysis.entities || [],
        processedAt: new Date(),
      };
    } catch (error) {
      console.error("❌ [GrokService] Erreur lors de l'analyse Grok");
      console.error("❌ [GrokService] Message:", error.message);
      console.error("❌ [GrokService] Type:", error.constructor.name);
      console.error(
        "❌ [GrokService] Stack:",
        error.stack?.split("\n").slice(0, 3).join("\n")
      );
      if (error.response) {
        console.error("❌ [GrokService] Réponse API:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }

      // Retourner une analyse par défaut en cas d'erreur
      return {
        summary: "Analysis failed - manual review required",
        sentiment: "Neutral",
        urgency: "Medium",
        requiresResponse: false, // En cas d'erreur, ne pas répondre automatiquement
        responseReason: "Analysis failed - cannot determine if response is needed",
        keyPoints: [],
        actionItems: [],
        entities: [],
        processedAt: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * Construit le prompt pour l'analyse
   */
  buildAnalysisPrompt(subject, content, sender) {
    return `Analyze the following business communication and provide a structured analysis in JSON format.

**Email Details:**
- From: ${sender?.email || sender?.name || "Unknown"}
- Subject: ${subject || "No subject"}
- Content: ${content || "No content"}

**Required Analysis (respond ONLY with valid JSON):**
{
  "summary": "A concise executive summary (2-3 sentences) of the communication",
  "sentiment": "Positive, Negative, or Neutral",
  "urgency": "Low, Medium, High, or Critical",
  "requiresResponse": true or false,
  "responseReason": "Brief explanation of why response is/isn't needed",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "actionItems": ["action item 1", "action item 2"],
  "entities": ["entity1", "entity2"]
}

**Instructions:**
- summary: Brief executive summary highlighting the main purpose
- sentiment: Overall emotional tone (Positive/Negative/Neutral)
- urgency: How urgent is this communication (Low/Medium/High/Critical)
- requiresResponse: CRITICAL - Determine if this email expects a reply:
  * TRUE if: Direct questions, requests for information/action, business inquiries, customer support requests, meeting requests, proposals, complaints
  * FALSE if: Newsletters, automated notifications, marketing emails, confirmations, receipts, FYI messages, thank you notes without questions, spam
- responseReason: Brief explanation (1 sentence) why response is or isn't needed
- keyPoints: 3-5 most important points from the message
- actionItems: Any tasks or actions required (empty array if none)
- entities: Important names, companies, products, dates mentioned (use hashtag format like #CompanyName)

Respond ONLY with the JSON object, no additional text.`;
  }

  /**
   * Parse la réponse de Grok (peut être du texte ou JSON)
   */
  parseGrokResponse(responseText) {
    try {
      // Essayer de parser directement comme JSON
      return JSON.parse(responseText);
    } catch (e) {
      // Si ce n'est pas du JSON pur, essayer d'extraire le JSON du texte
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.warn("⚠️ Impossible de parser la réponse JSON de Grok");
        }
      }

      // Fallback: retourner une structure par défaut
      return {
        summary: responseText.substring(0, 200) || "Unable to parse analysis",
        sentiment: "Neutral",
        urgency: "Medium",
        keyPoints: [],
        actionItems: [],
        entities: [],
      };
    }
  }

  /**
   * Analyse par lot (batch) - pour analyser plusieurs communications
   * @param {Array} communications - Liste de communications
   * @returns {Array} Résultats d'analyse
   */
  async analyzeBatch(communications) {
    const results = [];

    for (const comm of communications) {
      try {
        const analysis = await this.analyzeCommunication(comm);
        results.push({
          communicationId: comm._id || comm.id,
          analysis,
          success: true,
        });

        // Délai pour éviter de dépasser les limites de rate
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          communicationId: comm._id || comm.id,
          error: error.message,
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Génère une réponse automatique pour les emails Low/Medium
   * @param {Object} communication - Communication à répondre
   * @param {Object} analysis - Analyse IA de la communication
   * @param {Object} user - Utilisateur propriétaire
   * @returns {String} Contenu de la réponse générée
   */
  async generateAutoResponse(communication, analysis, user) {
    console.log("🤖 Génération de réponse automatique pour:", communication.subject);

    try {
      const prompt = this.buildAutoResponsePrompt(
        communication.subject,
        communication.content,
        communication.sender,
        analysis,
        user
      );

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a professional email assistant. Generate polite, helpful, and contextually appropriate email responses. Keep responses concise and professional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const responseContent = completion.choices[0].message.content.trim();
      console.log("✅ Réponse automatique générée");

      return responseContent;
    } catch (error) {
      console.error("❌ Erreur génération réponse auto:", error.message);

      // Réponse par défaut en cas d'erreur
      return `Dear ${communication.sender.name || "Valued Contact"},

Thank you for your message. We have received your email and will review it shortly.

If your matter is urgent, please don't hesitate to contact us directly.

Best regards,
${user.firstName} ${user.lastName}`;
    }
  }

  /**
   * Construit le prompt pour la réponse automatique
   */
  buildAutoResponsePrompt(subject, content, sender, analysis, user) {
    return `Generate a professional email response for the following:

**Original Email:**
- From: ${sender?.name || sender?.email || "Unknown"}
- Subject: ${subject || "No subject"}
- Content: ${content?.substring(0, 500) || "No content"}

**AI Analysis:**
- Summary: ${analysis.summary}
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}

**Respond on behalf of:**
- Name: ${user.firstName} ${user.lastName}
- Role: ${user.role}

**Instructions:**
1. Acknowledge receipt of their email
2. Provide a helpful response based on the content and analysis
3. If specific information is requested, provide a general helpful response or indicate next steps
4. Keep the tone professional and friendly
5. Sign off with the user's name
6. DO NOT include subject line, just the email body
7. Keep it concise (3-5 sentences max)

Generate ONLY the email body text, no additional formatting or explanations.`;
  }

  /**
   * Test de connexion à Grok
   */
  async testConnection() {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "user",
            content: 'Hello, respond with "OK" if you can hear me.',
          },
        ],
        max_tokens: 10,
      });

      const response = completion.choices[0].message.content;
      console.log("✅ Connexion Grok réussie:", response);
      return true;
    } catch (error) {
      console.error("❌ Échec de connexion Grok:", error.message);
      return false;
    }
  }
}

module.exports = new GrokService();
