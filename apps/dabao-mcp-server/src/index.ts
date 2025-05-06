import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import { customerService } from "./services/customerService.js";
import { projectService } from "./services/projectService.js";

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
