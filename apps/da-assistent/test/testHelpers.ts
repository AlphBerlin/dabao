import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

// Define the PORT used in mockServer.js
const PORT = process.env.TEST_GRPC_PORT || '50051';

// Load proto definitions
const loadProtos = () => {
  const PROTO_DIR = path.resolve(__dirname, '../proto');
  
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  };

  // Load all proto files
  const authProto = protoLoader.loadSync(`${PROTO_DIR}/auth.proto`, options);
  const mcpProto = protoLoader.loadSync(`${PROTO_DIR}/mcp.proto`, options);
  const telegramProto = protoLoader.loadSync(`${PROTO_DIR}/telegram.proto`, options);

  // Get the gRPC objects
  const authGrpc = grpc.loadPackageDefinition(authProto).dabao.mcp;
  const mcpGrpc = grpc.loadPackageDefinition(mcpProto).dabao.mcp;
  const telegramGrpc = grpc.loadPackageDefinition(telegramProto).dabao.mcp;
  
  const mcpProto = loadMcpProtoDefinitions();
  
  // Use the PORT from mockServer.js
  const serverUrl = `localhost:${PORT}`;
  
  const authClient = new mcpProto.AuthService(serverUrl, grpc.credentials.createInsecure());
  const mcpClient = new mcpProto.MCPService(serverUrl, grpc.credentials.createInsecure());
  const campaignClient = new mcpProto.CampaignService(serverUrl, grpc.credentials.createInsecure());
  const analyticsClient = new mcpProto.AnalyticsService(serverUrl, grpc.credentials.createInsecure());
  
  
  return {
    authClient,
    mcpClient,
    campaignClient,
    analyticsClient,
  };
};

// Promisify gRPC methods 
export const promisifyMethods = (clients: any) => {
  return {
    auth: {
      authenticate: promisify(clients.authClient.authenticate).bind(clients.authClient),
      validateToken: promisify(clients.authClient.validateToken).bind(clients.authClient),
      refreshToken: promisify(clients.authClient.refreshToken).bind(clients.authClient),
    },
    mcp: {
      processRequest: promisify(clients.mcpClient.processRequest).bind(clients.mcpClient),
      // Chat and StreamEvents are streaming so they aren't promisified
    },
    campaign: {
      listCampaigns: promisify(clients.campaignClient.listCampaigns).bind(clients.campaignClient),
      getCampaign: promisify(clients.campaignClient.getCampaign).bind(clients.campaignClient),
      createCampaign: promisify(clients.campaignClient.createCampaign).bind(clients.campaignClient),
      updateCampaign: promisify(clients.campaignClient.updateCampaign).bind(clients.campaignClient),
      deleteCampaign: promisify(clients.campaignClient.deleteCampaign).bind(clients.campaignClient),
      scheduleCampaign: promisify(clients.campaignClient.scheduleCampaign).bind(clients.campaignClient),
    },
    telegram: {
      sendMessage: promisify(clients.telegramClient.sendMessage).bind(clients.telegramClient),
      getTemplates: promisify(clients.telegramClient.getTemplates).bind(clients.telegramClient),
      // ReceiveMessages is streaming so it isn't promisified
    },
    analytics: {
      getCampaignMetrics: promisify(clients.analyticsClient.getCampaignMetrics).bind(clients.analyticsClient),
      getEngagementData: promisify(clients.analyticsClient.getEngagementData).bind(clients.analyticsClient),
      generateReport: promisify(clients.analyticsClient.generateReport).bind(clients.analyticsClient),
    },
    // Add chat methods
    chat: {
      sendMessage: promisify(clients.chatClient.sendMessage).bind(clients.chatClient),
      // chatStream is a streaming method so it isn't promisified
    }
  };
};

// Helper for authentication
export const authenticateUser = async (authenticate: any, username = 'test@example.com', password = 'password123') => {
  const response = await authenticate({ username, password });
  return response;
};

// Create metadata with token
export const createAuthMetadata = (token: string) => {
  const metadata = new grpc.Metadata();
  metadata.set('authorization', `Bearer ${token}`);
  return metadata;
};

// Generate test data
export const generateTestData = () => {
  return {
    uniqueId: () => uuidv4(),
    campaign: {
      name: `Test Campaign ${Math.floor(Math.random() * 1000)}`,
      description: 'Campaign created for testing purposes',
      metadata: { source: 'jest_test', testRun: new Date().toISOString() }
    },
    telegram: {
      chatId: `chat_${Math.floor(Math.random() * 10000)}`,
      messageText: 'This is a test message sent by automated tests',
    },
    analytics: {
      startDate: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
      endDate: new Date().toISOString(),
      reportType: 'test_report'
    },
    // Add chat test data
    chat: {
      content: `Test message ${Math.floor(Math.random() * 1000)}`,
      sessionId: `session_${uuidv4()}`,
      userId: `test_user_${Math.floor(Math.random() * 1000)}`
    }
  };
};

// Helper to wait for a specific amount of time
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Export proto descriptors for mocking in tests
export const protoDescriptors = {
  mcp: loadMcpProtoDefinitions()
};