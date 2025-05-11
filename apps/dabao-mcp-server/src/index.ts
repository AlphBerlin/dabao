import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import { customerService } from "./services/customerService.js";
import { projectService } from "./services/projectService.js";
import { voucherService } from "./services/voucherService.js";
import { tierService } from "./services/tierService.js";
import { campaignService } from "./services/campaignService.js";
import { telegramService } from "./services/telegramService.js";
import { imageService } from "./services/imageService.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import * as path from "path";
import * as os from "os";
// Load environment variables
dotenv.config();


// Create server instance
const server = new McpServer({
  name: "dabao",
  version: "1.0.0",
});


// New database-powered tools for the loyalty program

// Get customer info by email
server.tool(
  "get-customer",
  "Get customer information by email",
  {
    email: z.string().email().describe("Customer email address"),
    projectId: z.string().describe("Project ID"),
  },
  async ({ email, projectId }) => {
    try {
      const customer = await customerService.findCustomerByEmail(email, projectId);
      
      if (!customer) {
        return {
          content: [
            {
              type: "text",
              text: "Customer not found with the provided email.",
            },
          ],
        };
      }

      // Get points balance
      const pointsBalance = await customerService.getCustomerPoints(customer.id);
      
      // Get customer's tier
      const membershipInfo = customer.customerMemberships.length > 0 
        ? customer.customerMemberships[0] 
        : null;

      const formattedResponse = `
Customer Information:
--------------------
Name: ${customer.name || "Not provided"}
Email: ${customer.email}
ID: ${customer.id}
Phone: ${customer.phone || "Not provided"}
Points Balance: ${pointsBalance}
Current Tier: ${membershipInfo?.membershipTier?.name || "No tier"}
Account Created: ${customer.createdAt.toLocaleDateString()}
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching customer:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching customer information: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  },
);

// Get customer activity
server.tool(
  "get-customer-activity",
  "Get customer recent activity",
  {
    customerId: z.string().describe("Customer ID"),
    limit: z.number().optional().describe("Number of activities to return (default: 5)"),
  },
  async ({ customerId, limit = 5 }) => {
    try {
      const activities = await customerService.getCustomerActivity(customerId, limit);
      
      if (activities.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No activity found for this customer.",
            },
          ],
        };
      }

      const formattedActivities = activities.map(activity => {
        return `
Date: ${activity.createdAt.toLocaleDateString()}
Type: ${activity.type}
${activity.pointsEarned ? `Points: ${activity.pointsEarned}` : ""}
${activity.description ? `Description: ${activity.description}` : ""}
--------------------`.trim();
      });

      return {
        content: [
          {
            type: "text",
            text: `Recent Activity for ${customerId}:\n\n${formattedActivities.join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching customer activity:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching customer activity: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Get project information
server.tool(
  "get-project",
  "Get project information",
  {
    projectId: z.string().describe("Project ID"),
  },
  async ({ projectId }) => {
    try {
      const project = await projectService.getProjectById(projectId);
      
      if (!project) {
        return {
          content: [
            {
              type: "text",
              text: "Project not found.",
            },
          ],
        };
      }

      const preferences = project.preferences;
      const formattedResponse = `
Project Information:
-------------------
Name: ${project.name}
ID: ${project.id}
Slug: ${project.slug}
Status: ${project.status || "Active"}
${preferences ? `
Loyalty Program Settings:
-----------------------
Points Name: ${preferences.pointsName}
Points Abbreviation: ${preferences.pointsAbbreviation}
Reward System: ${preferences.rewardSystemType}
Referrals Enabled: ${preferences.enableReferrals ? "Yes" : "No"}
Tiers Enabled: ${preferences.enableTiers ? "Yes" : "No"}
Gameification Enabled: ${preferences.enableGameification ? "Yes" : "No"}
${preferences.pointsExpiryDays ? `Points Expiry: ${preferences.pointsExpiryDays} days` : "Points do not expire"}
Stamps Per Card: ${preferences.stampsPerCard}
` : "No loyalty program preferences configured."}
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching project:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching project information: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Get membership tiers for a project
server.tool(
  "get-membership-tiers",
  "Get project membership tiers",
  {
    projectId: z.string().describe("Project ID"),
  },
  async ({ projectId }) => {
    try {
      const tiers = await projectService.getProjectMembershipTiers(projectId);
      
      if (tiers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No membership tiers found for this project.",
            },
          ],
        };
      }

      const formattedTiers = tiers.map(tier => {
        return `
Tier: ${tier.name} (Level ${tier.level})
${tier.description ? `Description: ${tier.description}` : ""}
Points Threshold: ${tier.pointsThreshold !== null ? tier.pointsThreshold : "N/A"}
Stamps Threshold: ${tier.stampsThreshold !== null ? tier.stampsThreshold : "N/A"}
Spend Threshold: ${tier.spendThreshold !== null ? `$${tier.spendThreshold}` : "N/A"}
Points Multiplier: ${tier.pointsMultiplier}x
${tier.subscriptionFee ? `Subscription Fee: $${tier.subscriptionFee}` : "No subscription fee"}
--------------------`.trim();
      });

      return {
        content: [
          {
            type: "text",
            text: `Membership Tiers for ${projectId}:\n\n${formattedTiers.join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching membership tiers:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching membership tiers: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Get active campaigns for a project
server.tool(
  "get-active-campaigns",
  "Get active campaigns for a project",
  {
    projectId: z.string().describe("Project ID"),
  },
  async ({ projectId }) => {
    try {
      const campaigns = await projectService.getActiveProjectCampaigns(projectId);
      
      if (campaigns.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No active campaigns found for this project.",
            },
          ],
        };
      }

      const formattedCampaigns = campaigns.map(campaign => {
        const rewards = campaign.rewards.map(cr => cr.reward.name).join(", ");
        
        return `
Campaign: ${campaign.name}
Type: ${campaign.type}
Status: ${campaign.status}
${campaign.description ? `Description: ${campaign.description}` : ""}
${campaign.pointsMultiplier ? `Points Multiplier: ${campaign.pointsMultiplier}x` : ""}
Start Date: ${campaign.startDate ? campaign.startDate.toLocaleDateString() : "N/A"}
End Date: ${campaign.endDate ? campaign.endDate.toLocaleDateString() : "No end date"}
Rewards: ${rewards || "None"}
--------------------`.trim();
      });

      return {
        content: [
          {
            type: "text",
            text: `Active Campaigns for ${projectId}:\n\n${formattedCampaigns.join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching active campaigns: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// Get available vouchers for a project
server.tool(
  "get-available-vouchers",
  "Get available vouchers for a project",
  {
    projectId: z.string().describe("Project ID"),
  },
  async ({ projectId }) => {
    try {
      const vouchers = await projectService.getProjectAvailableVouchers(projectId);
      
      if (vouchers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No available vouchers found for this project.",
            },
          ],
        };
      }

      const formattedVouchers = vouchers.map(voucher => {
        return `
Voucher: ${voucher.name} (${voucher.code})
${voucher.description ? `Description: ${voucher.description}` : ""}
Type: ${voucher.discountType}
Value: ${voucher.discountValue} ${voucher.discountType === "PERCENTAGE" ? "%" : ""}
${voucher.minimumSpend ? `Minimum Spend: $${voucher.minimumSpend}` : "No minimum spend"}
${voucher.usageLimit ? `Usage Limit: ${voucher.usageLimit}` : "No usage limit"}
${voucher.requiredPoints ? `Required Points: ${voucher.requiredPoints}` : ""}
${voucher.requiredStamps ? `Required Stamps: ${voucher.requiredStamps}` : ""}
Valid Until: ${voucher.endDate.toLocaleDateString()}
--------------------`.trim();
      });

      return {
        content: [
          {
            type: "text",
            text: `Available Vouchers for ${projectId}:\n\n${formattedVouchers.join("\n\n")}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error fetching available vouchers: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
      };
    }
  }
);

// ---------- VOUCHER TOOLS ----------

// Create voucher
server.tool(
  "create-voucher",
  "Create a new voucher",
  {
    projectId: z.string().describe("Project ID"),
    code: z.string().describe("Unique voucher code"),
    name: z.string().describe("Voucher name"),
    description: z.string().optional().describe("Voucher description"),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]).describe("Type of discount"),
    discountValue: z.number().describe("Discount value (percentage or fixed amount)"),
    minimumSpend: z.number().optional().describe("Minimum spend required to use voucher"),
    usageLimit: z.number().optional().describe("Total number of times voucher can be used"),
    perCustomerLimit: z.number().optional().describe("Number of times a single customer can use voucher"),
    startDate: z.string().describe("Voucher start date (ISO string)"),
    endDate: z.string().describe("Voucher end date (ISO string)"),
    requiredPoints: z.number().optional().describe("Points required to redeem voucher"),
    requiredStamps: z.number().optional().describe("Stamps required to redeem voucher"),
  },
  async ({ 
    projectId, 
    code, 
    name, 
    description, 
    discountType, 
    discountValue,
    minimumSpend,
    usageLimit,
    perCustomerLimit,
    startDate,
    endDate,
    requiredPoints,
    requiredStamps
  }) => {
    try {
      // Check for duplicate code
      const existingVoucher = await voucherService.getVoucherByCode(code, projectId);
      
      if (existingVoucher) {
        return {
          content: [
            {
              type: "text",
              text: `Error: A voucher with code "${code}" already exists for this project.`
            }
          ]
        };
      }
      
      const voucher = await voucherService.createVoucher({
        projectId,
        code,
        name,
        description,
        discountType,
        discountValue,
        minimumSpend,
        usageLimit,
        perCustomerLimit,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        requiredPoints,
        requiredStamps,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Voucher "${name}" (${code}) created successfully! Valid until ${voucher.endDate.toLocaleDateString()}.`
          }
        ]
      };
    } catch (error) {
      console.error("Error creating voucher:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating voucher: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get available vouchers
server.tool(
  "get-vouchers",
  "Get available vouchers for a project",
  {
    projectId: z.string().describe("Project ID"),
    onlyActive: z.boolean().optional().describe("Filter only active vouchers"),
    onlyFuture: z.boolean().optional().describe("Filter only vouchers available in the future"),
  },
  async ({ projectId, onlyActive = true, onlyFuture = false }) => {
    try {
      const vouchers = await voucherService.getAllProjectVouchers(projectId, { onlyActive, onlyFuture });
      
      if (vouchers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No vouchers found for this project."
            }
          ]
        };
      }
      
      const formattedVouchers = vouchers.map(voucher => {
        return `
Voucher: ${voucher.name} (${voucher.code})
${voucher.description ? `Description: ${voucher.description}` : ""}
Value: ${voucher.discountValue} ${voucher.discountType === "PERCENTAGE" ? "%" : ""}
Valid: ${voucher.startDate.toLocaleDateString()} - ${voucher.endDate.toLocaleDateString()}
${voucher.minimumSpend ? `Minimum Spend: $${voucher.minimumSpend}` : ""}
${voucher.usageLimit ? `Usage Limit: ${voucher.usageLimit}` : ""}
${voucher.requiredPoints ? `Points Required: ${voucher.requiredPoints}` : ""}
${voucher.requiredStamps ? `Stamps Required: ${voucher.requiredStamps}` : ""}
`.trim();
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Vouchers for project ${projectId}:\n\n${formattedVouchers.join("\n\n")}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting vouchers:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting vouchers: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Validate voucher
server.tool(
  "validate-voucher",
  "Validate a voucher for a customer",
  {
    code: z.string().describe("Voucher code"),
    customerId: z.string().describe("Customer ID"),
    projectId: z.string().describe("Project ID"),
  },
  async ({ code, customerId, projectId }) => {
    try {
      const validation = await voucherService.validateVoucher(code, customerId, projectId);
      
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text",
              text: `Voucher validation failed: ${validation.message}`
            }
          ]
        };
      }
      
      const voucher = validation.voucher!;
      
      return {
        content: [
          {
            type: "text",
            text: `Voucher "${voucher.name}" (${voucher.code}) is valid!\n
Discount: ${voucher.discountValue} ${voucher.discountType === "PERCENTAGE" ? "%" : ""}
${voucher.minimumSpend ? `Minimum spend required: $${voucher.minimumSpend}` : "No minimum spend required"}
Valid until: ${voucher.endDate.toLocaleDateString()}`
          }
        ]
      };
    } catch (error) {
      console.error("Error validating voucher:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error validating voucher: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Redeem voucher
server.tool(
  "redeem-voucher",
  "Redeem a voucher for a customer",
  {
    voucherId: z.string().describe("Voucher ID"),
    customerId: z.string().describe("Customer ID"),
    orderId: z.string().optional().describe("Order ID (optional)"),
  },
  async ({ voucherId, customerId, orderId }) => {
    try {
      const redemption = await voucherService.redeemVoucher(voucherId, customerId, orderId);
      
      return {
        content: [
          {
            type: "text",
            text: `Voucher "${redemption.voucher.name}" (${redemption.voucher.code}) redeemed successfully for customer ${customerId}!`
          }
        ]
      };
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error redeeming voucher: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// ---------- MEMBERSHIP TIER TOOLS ----------

// Create tier
server.tool(
  "create-tier",
  "Create a new membership tier",
  {
    projectId: z.string().describe("Project ID"),
    name: z.string().describe("Tier name"),
    description: z.string().optional().describe("Tier description"),
    level: z.number().describe("Tier level (1 being lowest)"),
    pointsThreshold: z.number().optional().describe("Points required to reach tier"),
    stampsThreshold: z.number().optional().describe("Stamps required to reach tier"),
    spendThreshold: z.number().optional().describe("Spend amount required to reach tier"),
    subscriptionFee: z.number().optional().describe("Subscription fee for tier (if applicable)"),
    benefits: z.any().optional().describe("Benefits for this tier"),
    pointsMultiplier: z.number().optional().describe("Points multiplier for this tier"),
    autoUpgrade: z.boolean().optional().describe("Auto upgrade customers to this tier when eligible"),
  },
  async ({ 
    projectId, 
    name, 
    description, 
    level,
    pointsThreshold,
    stampsThreshold,
    spendThreshold,
    subscriptionFee,
    benefits,
    pointsMultiplier,
    autoUpgrade
  }) => {
    try {
      const tier = await tierService.createTier({
        projectId,
        name,
        description,
        level,
        pointsThreshold,
        stampsThreshold,
        spendThreshold,
        subscriptionFee,
        benefits,
        pointsMultiplier: pointsMultiplier || 1.0,
        autoUpgrade: autoUpgrade || false
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Membership tier "${name}" (level ${level}) created successfully!`
          }
        ]
      };
    } catch (error) {
      console.error("Error creating membership tier:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating membership tier: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get tiers
server.tool(
  "get-tiers",
  "Get membership tiers for a project",
  {
    projectId: z.string().describe("Project ID"),
  },
  async ({ projectId }) => {
    try {
      const tiers = await tierService.getAllProjectTiers(projectId);
      
      if (tiers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No membership tiers found for this project."
            }
          ]
        };
      }
      
      const formattedTiers = tiers.map(tier => {
        const requirements = [];
        if (tier.pointsThreshold) requirements.push(`${tier.pointsThreshold} points`);
        if (tier.stampsThreshold) requirements.push(`${tier.stampsThreshold} stamps`);
        if (tier.spendThreshold) requirements.push(`$${tier.spendThreshold} spend`);
        
        return `
Tier: ${tier.name} (Level ${tier.level})
${tier.description ? `Description: ${tier.description}` : ""}
Requirements: ${requirements.length > 0 ? requirements.join(" or ") : "None"}
Points Multiplier: ${tier.pointsMultiplier}x
${tier.subscriptionFee ? `Subscription Fee: $${tier.subscriptionFee}` : "No subscription fee"}
Auto Upgrade: ${tier.autoUpgrade ? "Yes" : "No"}
`.trim();
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Membership tiers for project ${projectId}:\n\n${formattedTiers.join("\n\n")}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting membership tiers:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting membership tiers: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Assign customer to tier
server.tool(
  "assign-tier",
  "Assign a customer to a membership tier",
  {
    customerId: z.string().describe("Customer ID"),
    tierId: z.string().describe("Tier ID"),
    pointsBalance: z.number().optional().describe("Initial points balance"),
    stampsBalance: z.number().optional().describe("Initial stamps balance"),
  },
  async ({ customerId, tierId, pointsBalance, stampsBalance }) => {
    try {
      const membership = await tierService.assignCustomerToTier(customerId, tierId, {
        pointsBalance,
        stampsBalance,
        startDate: new Date()
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Customer ${membership.customer.name || membership.customer.email} assigned to tier "${membership.membershipTier.name}" successfully!`
          }
        ]
      };
    } catch (error) {
      console.error("Error assigning tier:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error assigning tier: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Check tier eligibility
server.tool(
  "check-tier-eligibility",
  "Check if a customer is eligible for tier upgrade",
  {
    customerId: z.string().describe("Customer ID"),
    projectId: z.string().describe("Project ID"),
  },
  async ({ customerId, projectId }) => {
    try {
      const eligibility = await tierService.checkTierEligibility(customerId, projectId);
      
      const currentTierName = eligibility.currentTier ? eligibility.currentTier.name : "No tier";
      
      if (eligibility.eligibleTiers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Customer is currently in tier "${currentTierName}" and is not eligible for any upgrades.
              
Points Balance: ${eligibility.pointsBalance}
Total Spent: $${eligibility.totalSpent}
Total Stamps: ${eligibility.totalStamps}`
            }
          ]
        };
      }
      
      const eligibleTierNames = eligibility.eligibleTiers.map(tier => tier.name).join(", ");
      
      return {
        content: [
          {
            type: "text",
            text: `Customer is currently in tier "${currentTierName}".
            
Points Balance: ${eligibility.pointsBalance}
Total Spent: $${eligibility.totalSpent}
Total Stamps: ${eligibility.totalStamps}

Customer is eligible for upgrade to: ${eligibleTierNames}`
            }
          ]
        };
      
    } catch (error) {
      console.error("Error checking tier eligibility:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error checking tier eligibility: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// ---------- CAMPAIGN TOOLS ----------

// Create campaign
server.tool(
  "create-campaign",
  "Create a new marketing campaign",
  {
    projectId: z.string().describe("Project ID"),
    name: z.string().describe("Campaign name"),
    description: z.string().optional().describe("Campaign description"),
    type: z.string().describe("Campaign type"),
    startDate: z.string().optional().describe("Campaign start date (ISO string)"),
    endDate: z.string().optional().describe("Campaign end date (ISO string)"),
    pointsMultiplier: z.number().optional().describe("Points multiplier for this campaign"),
    telegramSettings: z.object({
      messageTemplate: z.string().describe("Message template for Telegram messages"),
      targetAudience: z.string().optional().describe("Target audience for the campaign"),
      scheduledSendDate: z.string().optional().describe("Scheduled date to send messages (ISO string)"),
      channelId: z.string().optional().describe("Telegram channel ID for the campaign"),
    }).optional().describe("Telegram campaign settings"),
    rewardIds: z.array(z.string()).optional().describe("IDs of rewards to include in the campaign"),
  },
  async ({ 
    projectId, 
    name, 
    description, 
    type,
    startDate,
    endDate,
    pointsMultiplier,
    telegramSettings,
    rewardIds
  }) => {
    try {
      // Prepare rewards data if provided
      const rewards = rewardIds ? rewardIds.map(id => ({ rewardId: id })) : undefined;
      
      // Prepare telegram campaign data if settings provided
      const telegramCampaign = telegramSettings ? {
        messageTemplate: telegramSettings.messageTemplate,
        targetAudience: telegramSettings.targetAudience,
        scheduledSendDate: telegramSettings.scheduledSendDate ? new Date(telegramSettings.scheduledSendDate) : undefined,
        channelId: telegramSettings.channelId,
      } : undefined;
      
      const campaign = await campaignService.createCampaign({
        projectId,
        name,
        description,
        type,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : undefined,
        pointsMultiplier,
        active: true,
        status: 'ACTIVE',
        telegramCampaign,
        rewards,
      });
      if(!campaign) {
        return {
          content: [
            {
              type: "text",
              text: "Error creating campaign: Campaign creation failed."
            }
          ]
        };
      }
      
      const hasTelegram = campaign.telegramCampaign ? "Yes" : "No";
      const rewardsCount = campaign.rewards?.length || 0;
      
      return {
        content: [
          {
            type: "text",
            text: `Campaign "${name}" created successfully!
            
Start Date: ${campaign.startDate?.toLocaleDateString()}
End Date: ${campaign.endDate ? campaign.endDate?.toLocaleDateString() : "Ongoing"}
Points Multiplier: ${campaign.pointsMultiplier || 1}x
Telegram Integration: ${hasTelegram}
Rewards: ${rewardsCount}
Campaign ID: ${campaign.id}`
          }
        ]
      };
    } catch (error) {
      console.error("Error creating campaign:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error creating campaign: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get campaigns
server.tool(
  "get-campaigns",
  "Get campaigns for a project",
  {
    projectId: z.string().describe("Project ID"),
    onlyActive: z.boolean().optional().describe("Filter only active campaigns"),
    type: z.string().optional().describe("Filter by campaign type"),
  },
  async ({ projectId, onlyActive = true, type }) => {
    try {
      const campaigns = await campaignService.getAllProjectCampaigns(projectId, { onlyActive, type });
      
      if (campaigns.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No campaigns found for this project."
            }
          ]
        };
      }
      
      const formattedCampaigns = campaigns.map((campaign:any) => {
        if(!campaign) {
          return "Campaign not found.";
        }
        const telegramInfo = campaign.telegramCampaign 
          ? `\nTelegram: Yes (${campaign.telegramCampaign.status || 'PENDING'})`
          : "\nTelegram: No";
          
        const rewards = campaign.rewards.length > 0
          ? `\nRewards: ${campaign.rewards.map((r:any) => r.reward.name).join(", ")}`
          : "\nRewards: None";
          
        return `
Campaign: ${campaign.name}
${campaign.description ? `Description: ${campaign.description}` : ""}
Type: ${campaign.type}
Status: ${campaign.status}
Dates: ${campaign.startDate.toLocaleDateString()} - ${campaign.endDate ? campaign.endDate.toLocaleDateString() : "Ongoing"}
Points: ${campaign.pointsMultiplier || 1}x${telegramInfo}${rewards}
`.trim();
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Campaigns for project ${projectId}:\n\n${formattedCampaigns.join("\n\n")}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting campaigns:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting campaigns: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Schedule telegram campaign
server.tool(
  "schedule-telegram-campaign",
  "Schedule a Telegram campaign for sending",
  {
    telegramCampaignId: z.string().describe("Telegram Campaign ID"),
    scheduledSendDate: z.string().describe("Scheduled date to send messages (ISO string)"),
    targetAudience: z.string().optional().describe("Target audience for the campaign"),
  },
  async ({ telegramCampaignId, scheduledSendDate, targetAudience }) => {
    try {
      const campaign = await campaignService.scheduleTelegramCampaign(telegramCampaignId, {
        scheduledSendDate: new Date(scheduledSendDate),
        targetAudience,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Telegram campaign scheduled successfully for ${new Date(scheduledSendDate).toLocaleString()}!
            
Status: ${campaign.status}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}`
          }
        ]
      };
    } catch (error) {
      console.error("Error scheduling Telegram campaign:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error scheduling Telegram campaign: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Track campaign engagement
server.tool(
  "track-campaign-engagement",
  "Track customer engagement with a campaign",
  {
    campaignId: z.string().describe("Campaign ID"),
    customerId: z.string().describe("Customer ID"),
    type: z.string().optional().describe("Engagement type"),
    pointsEarned: z.number().optional().describe("Points earned from engagement"),
    telegramMessageId: z.string().optional().describe("Telegram message ID (if from Telegram)"),
    metadata: z.any().optional().describe("Additional metadata for the engagement"),
  },
  async ({ campaignId, customerId, type, pointsEarned, telegramMessageId, metadata }) => {
    try {
      const engagement = await campaignService.trackCampaignEngagement(campaignId, customerId, {
        type: type || "VIEWED",
        pointsEarned,
        telegramMessageId,
        metadata,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Campaign engagement tracked successfully!
            
Customer: ${engagement.customer.name || engagement.customer.email}
Campaign: ${engagement.campaign.name}
Type: ${engagement.type}
${pointsEarned ? `Points Earned: ${pointsEarned}` : ""}`
          }
        ]
      };
    } catch (error) {
      console.error("Error tracking campaign engagement:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error tracking campaign engagement: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get campaign metrics
server.tool(
  "get-campaign-metrics",
  "Get engagement metrics for a campaign",
  {
    campaignId: z.string().describe("Campaign ID"),
  },
  async ({ campaignId }) => {
    try {
      const metrics = await campaignService.getCampaignMetrics(campaignId);
      const campaign = await campaignService.getCampaignById(campaignId);
      
      if (!campaign) {
        return {
          content: [
            {
              type: "text",
              text: "Campaign not found."
            }
          ]
        };
      }
      
      let engagementTypes = "";
      if (Object.keys(metrics.engagementsByType).length > 0) {
        engagementTypes = "\nEngagement Breakdown:\n" + 
          Object.entries(metrics.engagementsByType)
            .map(([type, count]) => `  - ${type}: ${count}`)
            .join("\n");
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Metrics for campaign "${campaign.name}":
            
Total Engagements: ${metrics.totalEngagements}
Unique Customers: ${metrics.uniqueCustomers}
Total Points Awarded: ${metrics.totalPointsAwarded}${engagementTypes}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting campaign metrics:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting campaign metrics: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// ---------- TELEGRAM ANALYTICS TOOLS ----------

// Configure Telegram
server.tool(
  "configure-telegram",
  "Configure Telegram settings for a project",
  {
    projectId: z.string().describe("Project ID"),
    botToken: z.string().optional().describe("Telegram bot token"),
    webhookUrl: z.string().optional().describe("Webhook URL for Telegram bot"),
    channelIds: z.array(z.string()).optional().describe("Channel IDs to use with the bot"),
    analyticsEnabled: z.boolean().optional().describe("Enable analytics for Telegram"),
  },
  async ({ projectId, botToken, webhookUrl, channelIds, analyticsEnabled = true }) => {
    try {
      const settings = await telegramService.upsertProjectTelegramSettings(projectId, {
        botToken,
        webhookUrl,
        channelIds,
        isActive: true,
        analyticsEnabled,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Telegram settings updated successfully for project ${projectId}!
            
Bot Connected: ${settings.botToken ? "Yes" : "No"}
Webhook URL: ${settings.webhookUrl || "Not set"}`
          }
        ]
      };
    } catch (error) {
      console.error("Error configuring Telegram settings:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error configuring Telegram settings: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get Telegram analytics
server.tool(
  "get-telegram-analytics",
  "Get Telegram analytics for a project",
  {
    projectId: z.string().describe("Project ID"),
    startDate: z.string().optional().describe("Start date for analytics (ISO string)"),
    endDate: z.string().optional().describe("End date for analytics (ISO string)"),
    includeDetails: z.boolean().optional().describe("Include detailed data"),
  },
  async ({ projectId, startDate, endDate, includeDetails = false }) => {
    try {
      const analytics = await telegramService.getTelegramAnalytics(projectId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeUsers: includeDetails,
        includeMessages: includeDetails,
        includeInteractions: includeDetails,
      });
      
      const interactionTypesText = Object.entries(analytics.interactions.byType)
        .map(([type, count]) => `  - ${type}: ${count}`)
        .join("\n");
      
      return {
        content: [
          {
            type: "text",
            text: `Telegram Analytics for project ${projectId}:
            
Period: ${analytics.period.startDate.toLocaleDateString()} - ${analytics.period.endDate.toLocaleDateString()}

Users:
  - Total: ${analytics.users.total}
  - New: ${analytics.users.new}
  - Active: ${analytics.users.active}

Messages:
  - Total: ${analytics.messages.total}
  - Incoming: ${analytics.messages.incoming}
  - Outgoing: ${analytics.messages.outgoing}

Interactions:
  - Total: ${analytics.interactions.total}
${interactionTypesText ? interactionTypesText : "  - No interaction data available"}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting Telegram analytics:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting Telegram analytics: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get Telegram campaign performance
server.tool(
  "get-telegram-campaign-performance",
  "Get performance metrics for a Telegram campaign",
  {
    telegramCampaignId: z.string().describe("Telegram Campaign ID"),
  },
  async ({ telegramCampaignId }) => {
    try {
      const performance = await telegramService.getTelegramCampaignPerformance(telegramCampaignId);
      
      return {
        content: [
          {
            type: "text",
            text: `Performance metrics for Telegram campaign "${performance.campaignName}":
            
Messages:
  - Sent: ${performance.performance.messagesSent}
  - Viewed: ${performance.performance.messagesViewed}
  - Clicked: ${performance.performance.messagesClicked}
  - Unique Users Interacted: ${performance.performance.uniqueUsersInteracted}
  - Engagements: ${performance.performance.engagements}
  
Rates:
  - Open Rate: ${performance.metrics.openRate.toFixed(2)}%
  - Click Rate: ${performance.metrics.clickRate.toFixed(2)}%
  - Conversion Rate: ${performance.metrics.conversionRate.toFixed(2)}%`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting Telegram campaign performance:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting Telegram campaign performance: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get most active Telegram users
server.tool(
  "get-active-telegram-users",
  "Get most active Telegram users for a project",
  {
    projectId: z.string().describe("Project ID"),
    limit: z.number().optional().describe("Number of users to return"),
    startDate: z.string().optional().describe("Start date for analysis (ISO string)"),
    endDate: z.string().optional().describe("End date for analysis (ISO string)"),
  },
  async ({ projectId, limit = 10, startDate, endDate }) => {
    try {
      const activeUsers = await telegramService.getMostActiveTelegramUsers(projectId, {
        limit,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      if (activeUsers.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No active Telegram users found for this project."
            }
          ]
        };
      }
      
      const formattedUsers = activeUsers.map((user, index) => {
        const userData = user.user ? 
          `Username: ${user.user.username || "N/A"}
Name: ${[user.user.firstName, user.user.lastName].filter(Boolean).join(" ") || "N/A"}
${user.user.customerId ? `Linked Customer: Yes` : `Linked Customer: No`}` :
          "User details not available";
        
        return `
${index + 1}. Telegram User ID: ${user.telegramUserId}
${userData}
Messages: ${user.messageCount}
Interactions: ${user.interactionCount}
Total Activity: ${user.totalActivity}
`.trim();
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Most active Telegram users for project ${projectId}:\n\n${formattedUsers.join("\n\n")}`
          }
        ]
      };
    } catch (error) {
      console.error("Error getting active Telegram users:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting active Telegram users: ${error instanceof Error ? error.message : "Unknown error"}`
          }
        ]
      };
    }
  }
);

// Get the user's desktop path based on their OS
function getUserDesktopPath(): string {
  try {
    // Try to get the desktop path in a cross-platform way
    const userHomeDir = os.homedir();
    
    if (process.platform === 'win32') {
      // Windows: Use USERPROFILE environment variable or fallback to homedir
      return path.join(process.env.USERPROFILE || userHomeDir, 'Desktop');
    } else if (process.platform === 'darwin') {
      // macOS
      return path.join(userHomeDir, 'Desktop');
    } else {
      // Linux and others: Check XDG_DESKTOP_DIR first
      const xdgConfig = path.join(userHomeDir, '.config', 'user-dirs.dirs');
      if (fs.existsSync(xdgConfig)) {
        try {
          const config = fs.readFileSync(xdgConfig, 'utf-8');
          const match = config.match(/XDG_DESKTOP_DIR="(.+)"/);
          if (match) {
            return match[1]!.replace('$HOME', userHomeDir);
          }
        } catch (error) {
          console.warn('Could not read XDG config:', error);
        }
      }
      // Fallback to standard Desktop directory
      return path.join(userHomeDir, 'Desktop');
    }
  } catch (error) {
    console.warn('Error getting desktop path:', error);
    // Fallback to current directory if we can't determine desktop
    return process.cwd();
  }
}

// Get the storage location for generated images
function getImageStorageDir(): string {
  const desktopPath = getUserDesktopPath();
  const storageDir = path.join(desktopPath, 'AI-Generated-Images');
  
  // Log the directory being used
  console.log(`Storage directory for current OS (${process.platform}):`, storageDir);
  
  return storageDir;
}

// Function to normalize file paths for the current OS
function normalizeFilePath(filePath: string): string {
  // Remove common prefixes that might come from different environments
  filePath = filePath.replace(/^(\/app\/|\/root\/|\\root\\)/, '');
  
  // Convert to absolute path if relative
  if (!path.isAbsolute(filePath)) {
    filePath = path.join(getImageStorageDir(), filePath);
  }
  
  // Normalize path for current OS
  return path.normalize(filePath);
}

// Function to generate web-friendly path
function getWebPath(filePath: string): string {
  // Normalize for current OS first
  const normalizedPath = normalizeFilePath(filePath);
  // Convert to web URL format (always use forward slashes)
  return `file://${normalizedPath.replace(/\\/g, '/')}`;
}

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
  } catch (error) {
    console.error(`Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: []
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Dabao MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
