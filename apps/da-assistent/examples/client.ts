/**
 * Example client for interacting with the Dabao MCP server
 * This demonstrates how to connect to and use the gRPC services
 */

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { promisify } from 'util';
import path from 'path';
import readline from 'readline';

// Path to proto file
const PROTO_PATH = path.resolve(__dirname, '../proto/mcp.proto');

// Load the protobuf definitions
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Cast to any to avoid TypeScript errors with dabao.mcp access
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const mcpProto = protoDescriptor.dabao?.mcp || {};

// Create clients for each service
const authClient = new (mcpProto as any).AuthService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const mcpClient = new (mcpProto as any).MCPService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const campaignClient = new (mcpProto as any).CampaignService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Promisify gRPC methods for easier usage
const authenticate = promisify(authClient.authenticate).bind(authClient);
const validateToken = promisify(authClient.validateToken).bind(authClient);
const processRequest = promisify(mcpClient.processRequest).bind(mcpClient);
const listCampaigns = promisify(campaignClient.listCampaigns).bind(campaignClient);
const createCampaign = promisify(campaignClient.createCampaign).bind(campaignClient);

// Create readline interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Store authentication token
let authToken = '';

/**
 * Main function to demonstrate client usage
 */
async function main() {
  try {
    console.log('Dabao MCP Client Example');
    console.log('========================');
    
    // Step 1: Authenticate
    await performAuthentication();
    
    // Step 2: Choose a demo
    await chooseDemo();
    
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
}

/**
 * Perform user authentication
 */
async function performAuthentication() {
  console.log('\nAuthentication');
  console.log('---------------');
  
  const username = await question('Username: ');
  const password = await question('Password: ');
  
  try {
    const response = await authenticate({ username, password });
    
    if (response.token) {
      authToken = response.token;
      console.log('\nAuthenticated successfully!');
      console.log(`User ID: ${response.user_id}`);
      console.log(`Roles: ${response.roles.join(', ')}`);
      console.log(`Token expires at: ${new Date(response.expires_at * 1000).toLocaleString()}`);
    } else {
      throw new Error('Authentication failed: No token received');
    }
  } catch (error: unknown) {
    console.error('Authentication failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Choose a demo to run
 */
async function chooseDemo() {
  console.log('\nAvailable Demos');
  console.log('---------------');
  console.log('1. Chat interaction');
  console.log('2. List campaigns');
  console.log('3. Create campaign');
  console.log('4. Validate token');
  console.log('5. Exit');
  
  const choice = await question('\nSelect a demo (1-5): ');
  
  switch (choice) {
    case '1':
      await chatDemo();
      break;
    case '2':
      await listCampaignsDemo();
      break;
    case '3':
      await createCampaignDemo();
      break;
    case '4':
      await validateTokenDemo();
      break;
    case '5':
      console.log('Exiting...');
      return;
    default:
      console.log('Invalid choice. Please try again.');
      await chooseDemo();
  }
  
  // Return to menu after demo completes
  await chooseDemo();
}

/**
 * Demonstrate chat interaction
 */
async function chatDemo() {
  console.log('\nChat Interaction Demo');
  console.log('--------------------');
  console.log('Type messages to chat with the MCP server (type "exit" to end)');
  
  // Create metadata with auth token
  const metadata = new grpc.Metadata();
  metadata.set('authorization', `Bearer ${authToken}`);
  
  // Create bidirectional stream
  const chatStream = mcpClient.chat(metadata);
  
  // Set up session ID
  const sessionId = `session_${Date.now()}`;
  let context = {};
  
  // Handle incoming messages
  chatStream.on('data', (response: any) => {
    console.log(`\n🤖 Bot: ${response.message}`);
    
    // Update context
    if (response.context) {
      context = { ...context, ...response.context };
    }
    
    // Log actions if present
    if (response.actions && response.actions.length > 0) {
      console.log('\nSuggested actions:');
      response.actions.forEach((action: any, index: number) => {
        console.log(`${index + 1}. ${action.type}: ${action.resource_id}`);
      });
    }
  });
  
  chatStream.on('error', (error: Error) => {
    console.error('Stream error:', error.message);
  });
  
  chatStream.on('end', () => {
    console.log('\nChat session ended');
  });
  
  // Create a special read line interface just for chat
  const chatRl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  // Start the message loop
  const messageLoop = async () => {
    const message = await new Promise<string>((resolve) => {
      chatRl.question('\n💬 You: ', resolve);
    });
    
    // Exit condition
    if (message.toLowerCase() === 'exit') {
      chatStream.end();
      chatRl.close();
      console.log('\nExiting chat...');
      return;
    }
    
    // Send message
    chatStream.write({
      user_id: 'demo_user',
      message: message,
      context: context,
      session_id: sessionId,
    });
    
    // Continue loop
    messageLoop();
  };
  
  // Start the loop
  await messageLoop();
}

/**
 * Demonstrate listing campaigns
 */
async function listCampaignsDemo() {
  console.log('\nList Campaigns Demo');
  console.log('------------------');
  
  try {
    // Create metadata with auth token
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${authToken}`);
    
    // Request parameters
    const params = {
      page: 1,
      page_size: 10,
    };
    
    // Make the request
    const response = await listCampaigns(params, metadata);
    
    // Display results
    console.log(`\nFound ${response.total_count} campaigns:`);
    response.campaigns.forEach((campaign: any, index: number) => {
      console.log(`\n${index + 1}. ${campaign.name}`);
      console.log(`   ID: ${campaign.id}`);
      console.log(`   Status: ${getStatusName(campaign.status)}`);
      console.log(`   Created: ${new Date(campaign.created_at).toLocaleString()}`);
      if (campaign.scheduled_at) {
        console.log(`   Scheduled: ${new Date(campaign.scheduled_at).toLocaleString()}`);
      }
    });
    
    await question('\nPress Enter to continue...');
    
  } catch (error: unknown) {
    console.error('Error listing campaigns:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Demonstrate creating a campaign
 */
async function createCampaignDemo() {
  console.log('\nCreate Campaign Demo');
  console.log('-------------------');
  
  try {
    // Get campaign details from user
    const name = await question('Campaign name: ');
    const description = await question('Campaign description (optional): ');
    
    // Create metadata with auth token
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Bearer ${authToken}`);
    
    // Request parameters
    const params = {
      name,
      description: description || undefined,
    };
    
    // Make the request
    const response = await createCampaign(params, metadata);
    
    // Display results
    console.log('\nCampaign created successfully:');
    console.log(`ID: ${response.id}`);
    console.log(`Name: ${response.name}`);
    console.log(`Status: ${getStatusName(response.status)}`);
    console.log(`Created: ${new Date(response.created_at).toLocaleString()}`);
    
    await question('\nPress Enter to continue...');
    
  } catch (error: unknown) {
    console.error('Error creating campaign:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Demonstrate token validation
 */
async function validateTokenDemo() {
  console.log('\nToken Validation Demo');
  console.log('--------------------');
  
  try {
    // Make the request
    const response = await validateToken({ token: authToken });
    
    // Display results
    if (response.valid) {
      console.log('\nToken is valid!');
      console.log(`User ID: ${response.user_id}`);
      console.log(`Roles: ${response.roles.join(', ')}`);
    } else {
      console.log('\nToken is invalid or expired.');
    }
    
    await question('\nPress Enter to continue...');
    
  } catch (error: unknown) {
    console.error('Error validating token:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Helper function to get status name
 */
function getStatusName(statusCode: number): string {
  const statuses = [
    'DRAFT',
    'SCHEDULED',
    'ACTIVE',
    'COMPLETED',
    'PAUSED',
    'CANCELLED',
  ];
  return statuses[statusCode] || `Unknown (${statusCode})`;
}

/**
 * Helper function to prompt for input
 */
function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// Run the main function
main().catch(console.error);