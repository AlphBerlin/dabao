import { User } from "../middleware/auth.js";
import { logger, logPerformance } from "../logging/logger.js";
import natural from "natural";
import { z } from "zod";

// Define intent types
export type Intent = {
  name: string;
  response: string;
  actions?: Array<{
    type: string;
    resource_id: string;
    parameters: Record<string, string>;
  }>;
  updatedContext?: Record<string, string>;
  requiresFollowup?: boolean;
};

export type IntentResult = {
  message: string;
  success: boolean;
  data?: any;
};

export type IntentHandler = (
  params: Record<string, any>,
  user: User,
  context?: Record<string, string>
) => Promise<IntentResult>;

// Define schema for campaign creation
const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  scheduledDate: z.string().optional(),
});

// Define schema for sending telegram message
const sendTelegramSchema = z.object({
  chatId: z.string().min(1, "Chat ID is required"),
  message: z.string().min(1, "Message text is required"),
  useMarkdown: z.boolean().optional(),
});

export class IntentRecognizer {
  private tokenizer: natural.WordTokenizer;
  private stemmer: any;
  private classifier: natural.BayesClassifier;
  private intentHandlers: Map<string, IntentHandler>;
  private entityExtractors: Map<string, (text: string) => Record<string, any>>;

  constructor() {
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.classifier = new natural.BayesClassifier();

    // Train the classifier with example phrases
    this.trainClassifier();
    
    // Initialize intent handlers
    this.intentHandlers = new Map();
    this.registerIntentHandlers();
    
    // Initialize entity extractors
    this.entityExtractors = new Map();
    this.registerEntityExtractors();
    
    logger.info("Intent recognition system initialized");
  }

  private trainClassifier(): void {
    // Campaign related intents
    this.classifier.addDocument("create a new campaign", "campaign.create");
    this.classifier.addDocument("make a campaign", "campaign.create");
    this.classifier.addDocument("start new campaign", "campaign.create");
    this.classifier.addDocument("setup campaign", "campaign.create");
    
    this.classifier.addDocument("list campaigns", "campaign.list");
    this.classifier.addDocument("show me all campaigns", "campaign.list");
    this.classifier.addDocument("view campaigns", "campaign.list");
    this.classifier.addDocument("get campaigns", "campaign.list");
    
    this.classifier.addDocument("delete campaign", "campaign.delete");
    this.classifier.addDocument("remove campaign", "campaign.delete");
    
    this.classifier.addDocument("edit campaign", "campaign.update");
    this.classifier.addDocument("update campaign", "campaign.update");
    this.classifier.addDocument("change campaign", "campaign.update");
    
    this.classifier.addDocument("schedule campaign", "campaign.schedule");
    this.classifier.addDocument("set campaign time", "campaign.schedule");
    
    // Telegram related intents
    this.classifier.addDocument("send telegram message", "telegram.send");
    this.classifier.addDocument("send message on telegram", "telegram.send");
    this.classifier.addDocument("post to telegram", "telegram.send");
    
    this.classifier.addDocument("get telegram templates", "telegram.templates");
    this.classifier.addDocument("show message templates", "telegram.templates");
    this.classifier.addDocument("list templates", "telegram.templates");
    
    // Analytics related intents
    this.classifier.addDocument("show analytics", "analytics.overview");
    this.classifier.addDocument("campaign performance", "analytics.campaign");
    this.classifier.addDocument("engagement metrics", "analytics.engagement");
    this.classifier.addDocument("generate report", "analytics.report");
    
    // Help and fallback intents
    this.classifier.addDocument("help", "system.help");
    this.classifier.addDocument("what can you do", "system.help");
    this.classifier.addDocument("show commands", "system.help");
    
    // Train the classifier
    this.classifier.train();
    logger.info("Intent classifier trained");
  }

  private registerIntentHandlers(): void {
    // Campaign handlers
    this.intentHandlers.set("campaign.create", this.handleCreateCampaign.bind(this));
    this.intentHandlers.set("campaign.list", this.handleListCampaigns.bind(this));
    this.intentHandlers.set("campaign.delete", this.handleDeleteCampaign.bind(this));
    this.intentHandlers.set("campaign.update", this.handleUpdateCampaign.bind(this));
    this.intentHandlers.set("campaign.schedule", this.handleScheduleCampaign.bind(this));
    
    // Telegram handlers
    this.intentHandlers.set("telegram.send", this.handleSendTelegramMessage.bind(this));
    this.intentHandlers.set("telegram.templates", this.handleGetTemplates.bind(this));
    
    // Analytics handlers
    this.intentHandlers.set("analytics.overview", this.handleAnalyticsOverview.bind(this));
    this.intentHandlers.set("analytics.campaign", this.handleCampaignAnalytics.bind(this));
    this.intentHandlers.set("analytics.engagement", this.handleEngagementAnalytics.bind(this));
    this.intentHandlers.set("analytics.report", this.handleGenerateReport.bind(this));
    
    // System handlers
    this.intentHandlers.set("system.help", this.handleHelp.bind(this));
    this.intentHandlers.set("system.fallback", this.handleFallback.bind(this));
  }

  private registerEntityExtractors(): void {
    // Campaign entity extractors
    this.entityExtractors.set("campaign.create", this.extractCreateCampaignEntities.bind(this));
    this.entityExtractors.set("telegram.send", this.extractSendMessageEntities.bind(this));
  }

  // Entity extraction functions
  private extractCreateCampaignEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract campaign name (anything in quotes or after "called" or "named")
    const nameRegex = /"([^"]+)"|called\s+(\w+)|named\s+(\w+)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch) {
      entities.name = nameMatch[1] || nameMatch[2] || nameMatch[3];
    }
    
    // Extract description
    const descRegex = /description\s+"([^"]+)"|description\s+(.+?)(?=\s+with|\s+on|\s+at|$)/i;
    const descMatch = text.match(descRegex);
    if (descMatch) {
      entities.description = descMatch[1] || descMatch[2];
    }
    
    // Extract schedule date if present
    const dateRegex = /on\s+(\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}|\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      entities.scheduledDate = dateMatch[1];
    }
    
    return entities;
  }

  private extractSendMessageEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract chat ID/recipient
    const chatRegex = /to\s+@?(\w+)|in\s+chat\s+@?(\w+)|chat\s+@?(\w+)|chat\s+id\s+([a-zA-Z0-9_-]+)/i;
    const chatMatch = text.match(chatRegex);
    if (chatMatch) {
      entities.chatId = chatMatch[1] || chatMatch[2] || chatMatch[3] || chatMatch[4];
    }
    
    // Extract message text (anything in quotes)
    const msgRegex = /"([^"]+)"|'([^']+)'/;
    const msgMatch = text.match(msgRegex);
    if (msgMatch) {
      entities.message = msgMatch[1] || msgMatch[2];
    }
    
    // Check for markdown flag
    entities.useMarkdown = text.toLowerCase().includes("markdown") || text.toLowerCase().includes("formatting");
    
    return entities;
  }

  // Public methods
  public async recognizeIntent(text: string, context: Record<string, string> = {}): Promise<Intent> {
    const start = performance.now();
    try {
      // Preprocess text
      const normalizedText = text.toLowerCase().trim();
      
      // Classify intent
      const classifications = this.classifier.getClassifications(normalizedText);
      const topIntent = classifications[0] || { label: "system.fallback", value: 1.0 };
      
      logger.info(`Intent recognized: ${topIntent.label} (confidence: ${topIntent.value.toFixed(2)})`);
      
      // Extract entities based on the recognized intent
      const entityExtractor = this.entityExtractors.get(topIntent.label);
      const entities = entityExtractor ? entityExtractor(normalizedText) : {};
      
      // Prepare response based on intent
      const intent: Intent = await this.prepareIntentResponse(topIntent.label, entities, context);
      
      return intent;
    } finally {
      const end = performance.now();
      logPerformance("intent_recognition", end - start, { text: text.substring(0, 50) });
    }
  }

  private async prepareIntentResponse(
    intentName: string, 
    entities: Record<string, any>, 
    context: Record<string, string>
  ): Promise<Intent> {
    switch (intentName) {
      case "campaign.create":
        return {
          name: "campaign.create",
          response: entities.name
            ? `I'll create a new campaign called "${entities.name}". Please confirm the details.`
            : "I'll help you create a new campaign. What would you like to name it?",
          actions: entities.name ? [
            {
              type: "form",
              resource_id: "campaign_create",
              parameters: {
                name: entities.name || "",
                description: entities.description || ""
              }
            }
          ] : [],
          updatedContext: { 
            ...context, 
            intent: "campaign.create",
            ...entities
          },
          requiresFollowup: !entities.name
        };
        
      case "campaign.list":
        return {
          name: "campaign.list",
          response: "Here are your campaigns:",
          actions: [
            {
              type: "list",
              resource_id: "campaigns",
              parameters: {}
            }
          ]
        };
      
      case "telegram.send":
        return {
          name: "telegram.send",
          response: entities.message && entities.chatId
            ? `I'll send the message "${entities.message}" to ${entities.chatId}. Please confirm.`
            : "I'll help you send a Telegram message. Which chat would you like to send it to?",
          actions: entities.message && entities.chatId ? [
            {
              type: "confirmation",
              resource_id: "send_telegram",
              parameters: {
                chatId: entities.chatId,
                message: entities.message,
                useMarkdown: entities.useMarkdown ? "true" : "false"
              }
            }
          ] : [],
          updatedContext: { 
            ...context, 
            intent: "telegram.send",
            ...entities
          },
          requiresFollowup: !(entities.message && entities.chatId)
        };
      
      case "system.help":
        return {
          name: "system.help",
          response: "I can help you with campaign management, sending Telegram messages, and analytics. Here are some examples of what you can ask:\n\n" +
            "- Create a new campaign called \"Summer Promotion\"\n" +
            "- List all campaigns\n" +
            "- Send message \"Hello everyone!\" to chat @marketing\n" +
            "- Show analytics for campaign XYZ\n" +
            "- Generate report for last month"
        };
      
      case "system.fallback":
      default:
        return {
          name: "system.fallback",
          response: "I'm not sure I understood that. Could you rephrase? You can say 'help' to see what I can do."
        };
    }
  }

  // Intent handler methods
  public async executeIntent(
    intentName: string,
    params: Record<string, any>,
    user: User,
    context: Record<string, string> = {}
  ): Promise<IntentResult> {
    const handler = this.intentHandlers.get(intentName) || this.intentHandlers.get("system.fallback");
    if (!handler) {
      return {
        message: "Sorry, I don't know how to handle that request.",
        success: false
      };
    }
    
    try {
      return await handler(params, user, context);
    } catch (error: any) {
      logger.error(`Error executing intent ${intentName}: ${error.message}`);
      return {
        message: `An error occurred: ${error.message}`,
        success: false
      };
    }
  }

  // Campaign intent handlers
  private async handleCreateCampaign(
    params: Record<string, any>,
    user: User,
    context?: Record<string, string>
  ): Promise<IntentResult> {
    try {
      // Validate params with schema
      const result = createCampaignSchema.safeParse(params);
      if (!result.success) {
        return {
          message: `Invalid campaign data: ${result.error.errors.map(e => e.message).join(", ")}`,
          success: false
        };
      }
      
      // Here we would call the actual API to create a campaign
      // For now, we just return a mock response
      const campaignId = `campaign_${Date.now()}`;
      
      return {
        message: `Campaign "${params.name}" created successfully`,
        success: true,
        data: {
          id: campaignId,
          name: params.name,
          description: params.description || "",
          createdBy: user.id,
          createdAt: new Date().toISOString()
        }
      };
    } catch (error: any) {
      logger.error(`Error creating campaign: ${error.message}`);
      return {
        message: `Failed to create campaign: ${error.message}`,
        success: false
      };
    }
  }

  private async handleListCampaigns(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    // Mock implementation
    const campaigns = Array.from({ length: 5 }, (_, i) => ({
      id: `campaign_${i + 1}`,
      name: `Test Campaign ${i + 1}`,
      status: ["DRAFT", "SCHEDULED", "ACTIVE", "COMPLETED", "PAUSED"][i]
    }));
    
    return {
      message: `Found ${campaigns.length} campaigns`,
      success: true,
      data: { campaigns }
    };
  }

  private async handleDeleteCampaign(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    if (!params.id) {
      return { 
        message: "Campaign ID is required", 
        success: false 
      };
    }
    
    // Mock implementation
    return {
      message: `Campaign ${params.id} has been deleted`,
      success: true
    };
  }

  private async handleUpdateCampaign(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    if (!params.id) {
      return { 
        message: "Campaign ID is required", 
        success: false 
      };
    }
    
    // Mock implementation
    return {
      message: `Campaign ${params.id} has been updated`,
      success: true,
      data: {
        id: params.id,
        name: params.name || "Updated Campaign",
        updatedAt: new Date().toISOString()
      }
    };
  }

  private async handleScheduleCampaign(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    if (!params.id || !params.scheduledDate) {
      return { 
        message: "Campaign ID and scheduled date are required", 
        success: false 
      };
    }
    
    // Mock implementation
    return {
      message: `Campaign ${params.id} has been scheduled for ${params.scheduledDate}`,
      success: true,
      data: {
        id: params.id,
        scheduledDate: params.scheduledDate
      }
    };
  }

  // Telegram intent handlers
  private async handleSendTelegramMessage(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    try {
      // Validate params with schema
      const result = sendTelegramSchema.safeParse({
        chatId: params.chatId,
        message: params.message,
        useMarkdown: params.useMarkdown === "true" || params.useMarkdown === true
      });
      
      if (!result.success) {
        return {
          message: `Invalid message data: ${result.error.errors.map(e => e.message).join(", ")}`,
          success: false
        };
      }
      
      // Here we would call the Telegram API to send the message
      // For now, we just return a mock response
      const messageId = `msg_${Date.now()}`;
      
      return {
        message: `Message sent successfully to ${params.chatId}`,
        success: true,
        data: { messageId }
      };
    } catch (error: any) {
      logger.error(`Error sending Telegram message: ${error.message}`);
      return {
        message: `Failed to send message: ${error.message}`,
        success: false
      };
    }
  }

  private async handleGetTemplates(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    // Mock implementation
    const templates = [
      { id: "template1", name: "Welcome Message", content: "Welcome to our channel!" },
      { id: "template2", name: "Promotion", content: "Check out our latest offer: {{offer}}" }
    ];
    
    return {
      message: `Found ${templates.length} templates`,
      success: true,
      data: { templates }
    };
  }

  // Analytics intent handlers
  private async handleAnalyticsOverview(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    // Mock implementation
    return {
      message: "Here's your analytics overview",
      success: true,
      data: {
        activeCampaigns: 5,
        totalMessages: 1234,
        engagementRate: "24.5%",
        period: "Last 30 days"
      }
    };
  }

  private async handleCampaignAnalytics(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    if (!params.campaignId) {
      return { 
        message: "Campaign ID is required", 
        success: false 
      };
    }
    
    // Mock implementation
    return {
      message: `Here are the analytics for campaign ${params.campaignId}`,
      success: true,
      data: {
        campaignId: params.campaignId,
        impressions: 5432,
        clicks: 876,
        engagement: "16.1%"
      }
    };
  }

  private async handleEngagementAnalytics(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    // Mock implementation
    return {
      message: "Here's your engagement data",
      success: true,
      data: {
        overall: "22.3%",
        segments: [
          { name: "New users", rate: "18.5%" },
          { name: "Returning users", rate: "27.8%" }
        ]
      }
    };
  }

  private async handleGenerateReport(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    // Mock implementation
    return {
      message: "Your report is being generated",
      success: true,
      data: {
        reportId: `report_${Date.now()}`,
        status: "processing",
        estimatedDelivery: "5 minutes"
      }
    };
  }

  // System intent handlers
  private async handleHelp(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    return {
      message: "I can help you with the following:\n\n" +
        "- Campaign management: create, list, edit, delete, schedule campaigns\n" +
        "- Telegram messaging: send messages, use templates\n" +
        "- Analytics: view campaign performance, engagement metrics, generate reports\n\n" +
        "Try asking something like 'create a new campaign' or 'show me campaign analytics'",
      success: true
    };
  }

  private async handleFallback(
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    return {
      message: "I'm not sure how to help with that. Try asking for 'help' to see what I can do.",
      success: false
    };
  }
}