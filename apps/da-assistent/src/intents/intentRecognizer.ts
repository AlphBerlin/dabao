import { logger, logPerformance } from "../logging/logger.js";
import natural from "natural";
import { z } from "zod";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// Define simplified user type (removing dependency on auth middleware)
export type User = {
  id: string;
  email?: string;
  name?: string;
  projectId?: string;
};

// Define intent types
export type Intent = {
  name: string;
  response: string;
  mcpToolName?: string;
  mcpToolParams?: Record<string, any>;
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

export class IntentRecognizer {
  private tokenizer: natural.WordTokenizer;
  private stemmer: any;
  private classifier: natural.BayesClassifier;
  private entityExtractors: Map<string, (text: string) => Record<string, any>>;
  private mcpClient: Client | null = null;

  constructor() {
    // Initialize NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.classifier = new natural.BayesClassifier();

    // Train the classifier with example phrases
    this.trainClassifier();
    
    // Initialize entity extractors
    this.entityExtractors = new Map();
    this.registerEntityExtractors();
    
    logger.info("Intent recognition system initialized");
  }

  // Set MCP client for tool execution
  public setMcpClient(client: Client) {
    this.mcpClient = client;
    logger.info("MCP client connected to intent recognizer");
  }

  private trainClassifier(): void {
    // Customer related intents
    this.classifier.addDocument("get customer", "customer.get");
    this.classifier.addDocument("find customer", "customer.get");
    this.classifier.addDocument("customer information", "customer.get");
    this.classifier.addDocument("customer details", "customer.get");
    
    this.classifier.addDocument("customer activity", "customer.activity");
    this.classifier.addDocument("recent activity", "customer.activity");
    this.classifier.addDocument("customer history", "customer.activity");
    
    // Campaign related intents
    this.classifier.addDocument("create a new campaign", "campaign.create");
    this.classifier.addDocument("make a campaign", "campaign.create");
    this.classifier.addDocument("start new campaign", "campaign.create");
    this.classifier.addDocument("setup campaign", "campaign.create");
    
    this.classifier.addDocument("list campaigns", "campaign.list");
    this.classifier.addDocument("show me all campaigns", "campaign.list");
    this.classifier.addDocument("view campaigns", "campaign.list");
    this.classifier.addDocument("get campaigns", "campaign.list");
    
    // Voucher related intents
    this.classifier.addDocument("create voucher", "voucher.create");
    this.classifier.addDocument("new voucher", "voucher.create");
    this.classifier.addDocument("make a voucher", "voucher.create");
    
    this.classifier.addDocument("list vouchers", "voucher.list");
    this.classifier.addDocument("show vouchers", "voucher.list");
    this.classifier.addDocument("get vouchers", "voucher.list");
    
    this.classifier.addDocument("validate voucher", "voucher.validate");
    this.classifier.addDocument("check voucher", "voucher.validate");
    this.classifier.addDocument("is voucher valid", "voucher.validate");
    
    // Tier related intents
    this.classifier.addDocument("create tier", "tier.create");
    this.classifier.addDocument("new tier", "tier.create");
    this.classifier.addDocument("add membership tier", "tier.create");
    
    this.classifier.addDocument("list tiers", "tier.list");
    this.classifier.addDocument("show tiers", "tier.list");
    this.classifier.addDocument("get tiers", "tier.list");
    this.classifier.addDocument("membership tiers", "tier.list");
    
    this.classifier.addDocument("assign tier", "tier.assign");
    this.classifier.addDocument("set customer tier", "tier.assign");
    this.classifier.addDocument("give tier to customer", "tier.assign");
    
    // Telegram related intents
    this.classifier.addDocument("telegram settings", "telegram.configure");
    this.classifier.addDocument("configure telegram", "telegram.configure");
    this.classifier.addDocument("setup telegram", "telegram.configure");
    
    this.classifier.addDocument("telegram analytics", "telegram.analytics");
    this.classifier.addDocument("telegram stats", "telegram.analytics");
    this.classifier.addDocument("telegram performance", "telegram.analytics");
    
    // Project related intents
    this.classifier.addDocument("project info", "project.get");
    this.classifier.addDocument("about project", "project.get");
    this.classifier.addDocument("project details", "project.get");
    this.classifier.addDocument("get project", "project.get");
    
    // Help and fallback intents
    this.classifier.addDocument("help", "system.help");
    this.classifier.addDocument("what can you do", "system.help");
    this.classifier.addDocument("show commands", "system.help");
    
    // Train the classifier
    this.classifier.train();
    logger.info("Intent classifier trained");
  }

  private registerEntityExtractors(): void {
    // Customer entity extractors
    this.entityExtractors.set("customer.get", this.extractCustomerEntities.bind(this));
    this.entityExtractors.set("customer.activity", this.extractCustomerEntities.bind(this));
    
    // Campaign entity extractors
    this.entityExtractors.set("campaign.create", this.extractCampaignEntities.bind(this));
    this.entityExtractors.set("campaign.list", this.extractProjectEntities.bind(this));
    
    // Voucher entity extractors
    this.entityExtractors.set("voucher.create", this.extractVoucherEntities.bind(this));
    this.entityExtractors.set("voucher.list", this.extractProjectEntities.bind(this));
    this.entityExtractors.set("voucher.validate", this.extractVoucherValidateEntities.bind(this));
    
    // Tier entity extractors
    this.entityExtractors.set("tier.create", this.extractTierEntities.bind(this));
    this.entityExtractors.set("tier.list", this.extractProjectEntities.bind(this));
    this.entityExtractors.set("tier.assign", this.extractTierAssignEntities.bind(this));
    
    // Telegram entity extractors
    this.entityExtractors.set("telegram.configure", this.extractProjectEntities.bind(this));
    this.entityExtractors.set("telegram.analytics", this.extractProjectEntities.bind(this));
    
    // Project entity extractors
    this.entityExtractors.set("project.get", this.extractProjectEntities.bind(this));
  }

  // Entity extraction functions
  private extractCustomerEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract customer email
    const emailRegex = /email\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      entities.email = emailMatch[1];
    }
    
    // Extract customer id (format: customer-xxx or customerId xxx)
    const idRegex = /customer(?:[-\s]|Id\s+)([a-zA-Z0-9_-]+)/i;
    const idMatch = text.match(idRegex);
    if (idMatch) {
      entities.customerId = idMatch[1];
    }
    
    // Extract project ID
    this.extractProjectId(text, entities);
    
    return entities;
  }

  private extractCampaignEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract campaign name (anything in quotes or after "called" or "named")
    const nameRegex = /"([^"]+)"|called\s+([^,\.]+)|named\s+([^,\.]+)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && (nameMatch[1] || nameMatch[2] || nameMatch[3])) {
      entities.name = (nameMatch[1] || nameMatch[2] || nameMatch[3])?.trim();
    }
    
    // Extract description
    const descRegex = /description\s+"([^"]+)"|description\s+(.+?)(?=\s+with|\s+on|\s+at|$)/i;
    const descMatch = text.match(descRegex);
    if (descMatch && (descMatch[1] || descMatch[2])) {
      entities.description = (descMatch[1] || descMatch[2])?.trim();
    }
    
    // Extract project ID
    this.extractProjectId(text, entities);
    
    return entities;
  }

  private extractVoucherEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract voucher code
    const codeRegex = /code\s+([A-Z0-9_-]+)|"([A-Z0-9_-]+)"|'([A-Z0-9_-]+)'/i;
    const codeMatch = text.match(codeRegex);
    if (codeMatch) {
      entities.code = codeMatch[1] || codeMatch[2] || codeMatch[3];
    }
    
    // Extract voucher name
    const nameRegex = /named\s+([^,\.]+)|called\s+([^,\.]+)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && (nameMatch[1] || nameMatch[2])) {
      entities.name = (nameMatch[1] || nameMatch[2])?.trim();
    }
    
    // Extract discount value
    const valueRegex = /(\d+(?:\.\d+)?)\s*(%|percent|dollars?|$)/i;
    const valueMatch = text.match(valueRegex);
    if (valueMatch && valueMatch[1]) {
      entities.discountValue = parseFloat(valueMatch[1] || "0");
      // Safe access with optional chaining and nullish coalescing
      entities.discountType = valueMatch[2]?.toLowerCase().includes('%') || 
                             valueMatch[2]?.toLowerCase().includes('percent') 
                           ? "PERCENTAGE" : "FIXED_AMOUNT";
    }
    
    // Extract project ID
    this.extractProjectId(text, entities);
    
    return entities;
  }

  private extractVoucherValidateEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract voucher code
    const codeRegex = /code\s+([A-Z0-9_-]+)|"([A-Z0-9_-]+)"|'([A-Z0-9_-]+)'/i;
    const codeMatch = text.match(codeRegex);
    if (codeMatch) {
      entities.code = codeMatch[1] || codeMatch[2] || codeMatch[3];
    }
    
    // Extract customer ID
    const customerRegex = /customer(?:[-\s]|Id\s+)([a-zA-Z0-9_-]+)/i;
    const customerMatch = text.match(customerRegex);
    if (customerMatch) {
      entities.customerId = customerMatch[1];
    }
    
    // Extract project ID
    this.extractProjectId(text, entities);
    
    return entities;
  }

  private extractTierEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract tier name
    const nameRegex = /named\s+([^,\.]+)|called\s+([^,\.]+)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && (nameMatch[1] || nameMatch[2])) {
      entities.name = (nameMatch[1] || nameMatch[2])?.trim();
    }
    
    // Extract tier level
    const levelRegex = /level\s+(\d+)/i;
    const levelMatch = text.match(levelRegex);
    if (levelMatch && levelMatch[1]) {
      entities.level = parseInt(levelMatch[1] || "1");
    }
    
    // Extract project ID
    this.extractProjectId(text, entities);
    
    return entities;
  }

  private extractTierAssignEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract customer ID
    const customerRegex = /customer(?:[-\s]|Id\s+)([a-zA-Z0-9_-]+)/i;
    const customerMatch = text.match(customerRegex);
    if (customerMatch) {
      entities.customerId = customerMatch[1];
    }
    
    // Extract tier ID
    const tierRegex = /tier(?:[-\s]|Id\s+)([a-zA-Z0-9_-]+)/i;
    const tierMatch = text.match(tierRegex);
    if (tierMatch) {
      entities.tierId = tierMatch[1];
    }
    
    return entities;
  }

  private extractProjectEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};
    this.extractProjectId(text, entities);
    return entities;
  }

  // Helper method to extract project ID from text
  private extractProjectId(text: string, entities: Record<string, any>): void {
    // Extract project ID (format: project-xxx or projectId xxx)
    const projectRegex = /project(?:[-\s]|Id\s+)([a-zA-Z0-9_-]+)/i;
    const projectMatch = text.match(projectRegex);
    if (projectMatch) {
      entities.projectId = projectMatch[1];
    }
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
    // Map intent to MCP tool
    switch (intentName) {
      case "customer.get":
        return {
          name: "customer.get",
          response: entities.email 
            ? `Fetching customer information for ${entities.email}...` 
            : entities.customerId 
              ? `Looking up customer ID ${entities.customerId}...`
              : "Which customer would you like to look up? Please provide an email or customer ID.",
          mcpToolName: entities.email || entities.customerId ? "get-customer" : undefined,
          mcpToolParams: {
            email: entities.email,
            projectId: entities.projectId || context.projectId,
            customerId: entities.customerId
          },
          requiresFollowup: !entities.email && !entities.customerId
        };
        
      case "customer.activity":
        return {
          name: "customer.activity",
          response: entities.customerId 
            ? `Getting recent activity for customer ${entities.customerId}...`
            : "Which customer's activity would you like to see? Please provide a customer ID.",
          mcpToolName: entities.customerId ? "get-customer-activity" : undefined,
          mcpToolParams: {
            customerId: entities.customerId,
            limit: 10
          },
          requiresFollowup: !entities.customerId
        };
        
      case "campaign.create":
        return {
          name: "campaign.create",
          response: entities.name && entities.projectId
            ? `Creating a new campaign named "${entities.name}" for project ${entities.projectId}...`
            : !entities.projectId
              ? "Which project would you like to create the campaign for? Please provide a project ID."
              : "What would you like to name the campaign?",
          mcpToolName: entities.name && entities.projectId ? "create-campaign" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            name: entities.name,
            description: entities.description,
            type: "STANDARD"
          },
          requiresFollowup: !entities.name || !entities.projectId
        };
        
      case "campaign.list":
        return {
          name: "campaign.list",
          response: entities.projectId 
            ? `Fetching campaigns for project ${entities.projectId}...`
            : "Which project's campaigns would you like to see? Please provide a project ID.",
          mcpToolName: entities.projectId ? "get-campaigns" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId
          },
          requiresFollowup: !entities.projectId
        };
        
      case "voucher.create":
        return {
          name: "voucher.create",
          response: entities.code && entities.projectId
            ? `Creating a new voucher with code "${entities.code}" for project ${entities.projectId}...`
            : !entities.projectId
              ? "Which project would you like to create the voucher for? Please provide a project ID."
              : "What code would you like to use for this voucher?",
          mcpToolName: entities.code && entities.projectId ? "create-voucher" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            code: entities.code,
            name: entities.name || `Voucher ${entities.code}`,
            discountType: entities.discountType || "PERCENTAGE",
            discountValue: entities.discountValue || 10,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          },
          requiresFollowup: !entities.code || !entities.projectId
        };
        
      case "voucher.list":
        return {
          name: "voucher.list",
          response: entities.projectId 
            ? `Fetching vouchers for project ${entities.projectId}...`
            : "Which project's vouchers would you like to see? Please provide a project ID.",
          mcpToolName: entities.projectId ? "get-vouchers" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            onlyActive: true
          },
          requiresFollowup: !entities.projectId
        };
        
      case "voucher.validate":
        return {
          name: "voucher.validate",
          response: entities.code && entities.customerId && entities.projectId
            ? `Validating voucher code "${entities.code}" for customer ${entities.customerId}...`
            : "Please provide the voucher code, customer ID, and project ID to validate.",
          mcpToolName: entities.code && entities.customerId && entities.projectId ? "validate-voucher" : undefined,
          mcpToolParams: {
            code: entities.code,
            customerId: entities.customerId,
            projectId: entities.projectId || context.projectId
          },
          requiresFollowup: !entities.code || !entities.customerId || !entities.projectId
        };
        
      case "tier.create":
        return {
          name: "tier.create",
          response: entities.name && entities.level && entities.projectId
            ? `Creating a new tier "${entities.name}" (level ${entities.level}) for project ${entities.projectId}...`
            : "Please provide the tier name, level, and project ID.",
          mcpToolName: entities.name && entities.level && entities.projectId ? "create-tier" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            name: entities.name,
            level: entities.level || 1
          },
          requiresFollowup: !entities.name || !entities.level || !entities.projectId
        };
        
      case "tier.list":
        return {
          name: "tier.list",
          response: entities.projectId 
            ? `Fetching membership tiers for project ${entities.projectId}...`
            : "Which project's tiers would you like to see? Please provide a project ID.",
          mcpToolName: entities.projectId ? "get-tiers" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId
          },
          requiresFollowup: !entities.projectId
        };
        
      case "tier.assign":
        return {
          name: "tier.assign",
          response: entities.customerId && entities.tierId
            ? `Assigning customer ${entities.customerId} to tier ${entities.tierId}...`
            : "Please provide both the customer ID and tier ID.",
          mcpToolName: entities.customerId && entities.tierId ? "assign-tier" : undefined,
          mcpToolParams: {
            customerId: entities.customerId,
            tierId: entities.tierId
          },
          requiresFollowup: !entities.customerId || !entities.tierId
        };
        
      case "telegram.configure":
        return {
          name: "telegram.configure",
          response: entities.projectId 
            ? `Configuring Telegram settings for project ${entities.projectId}...`
            : "Which project's Telegram settings would you like to configure? Please provide a project ID.",
          mcpToolName: entities.projectId ? "configure-telegram" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            analyticsEnabled: true
          },
          requiresFollowup: !entities.projectId
        };
        
      case "telegram.analytics":
        return {
          name: "telegram.analytics",
          response: entities.projectId 
            ? `Fetching Telegram analytics for project ${entities.projectId}...`
            : "Which project's Telegram analytics would you like to see? Please provide a project ID.",
          mcpToolName: entities.projectId ? "get-telegram-analytics" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId,
            includeDetails: false
          },
          requiresFollowup: !entities.projectId
        };
        
      case "project.get":
        return {
          name: "project.get",
          response: entities.projectId 
            ? `Fetching details for project ${entities.projectId}...`
            : "Which project would you like to see? Please provide a project ID.",
          mcpToolName: entities.projectId ? "get-project" : undefined,
          mcpToolParams: {
            projectId: entities.projectId || context.projectId
          },
          requiresFollowup: !entities.projectId
        };
        
      case "system.help":
        return {
          name: "system.help",
          response: "I can help you with the following Dabao features:\n\n" +
            "- Customer management: Find customer info, view activity\n" +
            "- Campaign management: Create and list campaigns\n" +
            "- Voucher management: Create, list, and validate vouchers\n" +
            "- Membership tiers: Create, list, and assign tiers\n" +
            "- Telegram integration: Configure settings, view analytics\n" +
            "- Project information: Get details about a project\n\n" +
            "Try asking something like:\n" +
            "- \"Get customer information for customer-123\"\n" +
            "- \"Create a new campaign called Summer Sale for project-abc\"\n" +
            "- \"List active vouchers for project-xyz\"\n" +
            "- \"Create a Gold tier at level 3 for project-123\""
        };
        
      case "system.fallback":
      default:
        return {
          name: "system.fallback",
          response: "I'm not sure I understood that request. Could you rephrase or try asking for 'help' to see what I can do?"
        };
    }
  }

  // Execute MCP tool based on recognized intent
  public async executeMcpTool(intent: Intent): Promise<string> {
    if (!this.mcpClient) {
      return "I'm not connected to the MCP server yet. Please try again in a moment.";
    }
    
    if (!intent.mcpToolName || !intent.mcpToolParams) {
      return intent.response;
    }
    
    try {
      logger.info(`Calling MCP tool: ${intent.mcpToolName}`, { params: intent.mcpToolParams });
      
      const result = await this.mcpClient.callTool({
        name: intent.mcpToolName,
        arguments: intent.mcpToolParams,
      });
      
      // Format and return the content from the MCP tool
      return typeof result.content === 'string'
        ? result.content
        : JSON.stringify(result.content, null, 2);
    } catch (error) {
      logger.error(`Error calling MCP tool ${intent.mcpToolName}:`, error);
      return `I encountered an error while trying to ${intent.name.replace('.', ' ')}: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  // Added method to support grpcServer.ts
  public async executeIntent(
    intentName: string,
    params: Record<string, any>,
    user: User
  ): Promise<IntentResult> {
    try {
      // Create a context from user info
      const context: Record<string, string> = {};
      if (user.projectId) {
        context.projectId = user.projectId;
      }
      
      // Prepare the intent
      const intent = await this.prepareIntentResponse(intentName, params, context);
      
      // Execute the intent via MCP tool if available
      if (intent.mcpToolName && this.mcpClient) {
        const response = await this.executeMcpTool(intent);
        return {
          message: response,
          success: true,
          data: params
        };
      }
      
      // Fallback response if no MCP tool is available
      return {
        message: intent.response,
        success: true,
        data: null
      };
    } catch (error) {
      return {
        message: `Error executing intent ${intentName}: ${error instanceof Error ? error.message : String(error)}`,
        success: false,
        data: null
      };
    }
  }
}