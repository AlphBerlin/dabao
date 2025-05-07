const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto definitions
const MCP_PROTO_PATH = path.resolve(__dirname, '../proto/mcp.proto');

// Load all the required protos
const chatPackageDefinition = protoLoader.loadSync(CHAT_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const telegramPackageDefinition = protoLoader.loadSync(TELEGRAM_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const authPackageDefinition = protoLoader.loadSync(AUTH_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const mcpPackageDefinition = protoLoader.loadSync(MCP_PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load the descriptors
const chatProtoDescriptor = grpc.loadPackageDefinition(chatPackageDefinition);
const telegramProtoDescriptor = grpc.loadPackageDefinition(telegramPackageDefinition);
const authProtoDescriptor = grpc.loadPackageDefinition(authPackageDefinition);
const mcpProtoDescriptor = grpc.loadPackageDefinition(mcpPackageDefinition);

// Extract service definitions
const chatService = chatProtoDescriptor.chat;
const telegramService = telegramProtoDescriptor.telegram;
const authService = authProtoDescriptor.auth;
const mcpService = mcpProtoDescriptor.dabao.mcp;

// Mock server implementation
class ChatServiceMock {
  // Implement SendMessage method
  sendMessage(call, callback) {
    const request = call.request;
    
    // Generate a session ID if one wasn't provided
    const sessionId = request.session_id || `session_${Date.now()}`;
    
    // Create a response with some mock data
    const response = {
      content: request.content ? `Response to: ${request.content}` : "I'm not sure what you're asking",
      session_id: sessionId,
      status_code: 200,
    };
    
    callback(null, response);
  }
  
  // Implement ChatStream method for bidirectional streaming
  chatStream(call) {
    call.on('data', (request) => {
      // Generate a session ID if one wasn't provided
      const sessionId = request.session_id || `session_${Date.now()}`;
      
      // Create a response with some mock data
      const response = {
        content: request.content ? `Stream response to: ${request.content}` : "I'm not sure what you're asking",
        session_id: sessionId,
        status_code: 200,
      };
      
      call.write(response);
    });
    
    call.on('end', () => {
      call.end();
    });
    
    call.on('error', (error) => {
      console.error('Stream error:', error);
      call.end();
    });
  }
}

// Mock implementation for TelegramService
class TelegramServiceMock {
  // Implement SendMessage method
  sendMessage(call, callback) {
    const request = call.request;
    callback(null, {
      message_id: Date.now(),
      chat_id: request.chat_id,
      status: 'sent'
    });
  }
  
  // Implement GetTemplates method
  getTemplates(call, callback) {
    const request = call.request;
    const category = request.category || '';
    
    // Create mock templates
    const templates = [
      { id: '1', name: 'Template 1', category: 'general', content: 'This is template 1' },
      { id: '2', name: 'Template 2', category: 'marketing', content: 'This is template 2' },
      { id: '3', name: 'Template 3', category: 'support', content: 'This is template 3' },
    ];
    
    // Filter templates by category if provided
    const filteredTemplates = category 
      ? templates.filter(t => t.category === category) 
      : templates;
    
    callback(null, { templates: filteredTemplates });
  }
  
  // Implement ReceiveMessages method for server streaming
  receiveMessages(call) {
    const request = call.request;
    const offset = request.offset || 0;
    const token = call.metadata?.get('authorization')?.[0];
    
    // Check if authorization token is present
    if (!token) {
      const error = {
        code: grpc.status.UNAUTHENTICATED,
        message: 'Missing authorization token'
      };
      call.emit('error', error);
      call.end();
      return;
    }
    
    // Send a few mock messages
    setTimeout(() => {
      call.write({
        message_id: offset + 1,
        chat_id: 12345,
        from: { id: 67890, username: 'user1' },
        text: 'Hello from the mock server!',
        date: Math.floor(Date.now() / 1000)
      });
    }, 100);
    
    setTimeout(() => {
      call.write({
        message_id: offset + 2,
        chat_id: 12345,
        from: { id: 67890, username: 'user1' },
        text: 'This is a test message',
        date: Math.floor(Date.now() / 1000)
      });
      
      // End the stream after sending messages
      call.end();
    }, 200);
  }
}

// Mock implementation for AuthService
class AuthServiceMock {
  // Implement Authenticate method
  authenticate(call, callback) {
    const { username, password } = call.request;
    
    // Simple validation
    if (!username || !password) {
      const error = {
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing username or password'
      };
      callback(error);
      return;
    }
    
    // Return a mock token
    callback(null, {
      token: `mock_token_${Date.now()}`,
      user_id: `user_${Math.floor(Math.random() * 1000)}`,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  }
  
  // Implement ValidateToken method
  validateToken(call, callback) {
    const { token } = call.request;
    
    // Check if token is provided
    if (!token) {
      const error = {
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing token'
      };
      callback(error);
      return;
    }
    
    // Return validation result (always valid for testing)
    callback(null, {
      valid: true,
      user_id: 'test_user',
    });
  }
  
  // Implement RefreshToken method
  refreshToken(call, callback) {
    const { token } = call.request;
    
    // Check if token is provided
    if (!token) {
      const error = {
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Missing token'
      };
      callback(error);
      return;
    }
    
    // Return a new token
    callback(null, {
      token: `refreshed_token_${Date.now()}`,
      expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  }
}

// Mock implementation for MCPService
class MCPServiceMock {
  // Implement ProcessRequest method
  processRequest(call, callback) {
    const request = call.request;
    
    callback(null, {
      response: `Processed request: ${request.query || 'No query provided'}`,
      status: 'success',
    });
  }
}

// Mock implementation for CampaignService
class CampaignServiceMock {
  // Implement ListCampaigns method
  listCampaigns(call, callback) {
    callback(null, {
      campaigns: [
        { id: '1', name: 'Campaign 1', status: 'active' },
        { id: '2', name: 'Campaign 2', status: 'inactive' },
      ]
    });
  }
  
  // Implement GetCampaign method
  getCampaign(call, callback) {
    const { id } = call.request;
    callback(null, {
      id,
      name: `Campaign ${id}`,
      status: 'active',
      description: 'Mock campaign description',
      metadata: { created_at: new Date().toISOString() }
    });
  }
  
  // Implement CreateCampaign method
  createCampaign(call, callback) {
    const request = call.request;
    callback(null, {
      id: `${Date.now()}`,
      name: request.name,
      status: 'created',
    });
  }
  
  // Implement UpdateCampaign method
  updateCampaign(call, callback) {
    const { id, ...updates } = call.request;
    callback(null, {
      id,
      ...updates,
      status: 'updated',
    });
  }
  
  // Implement DeleteCampaign method
  deleteCampaign(call, callback) {
    const { id } = call.request;
    callback(null, { success: true, id });
  }
  
  // Implement ScheduleCampaign method
  scheduleCampaign(call, callback) {
    const { id, schedule } = call.request;
    callback(null, {
      id,
      scheduled_at: schedule?.start_time || new Date().toISOString(),
      status: 'scheduled',
    });
  }
}

// Mock implementation for AnalyticsService
class AnalyticsServiceMock {
  // Implement GetCampaignMetrics method
  getCampaignMetrics(call, callback) {
    const { campaign_id } = call.request;
    callback(null, {
      campaign_id,
      impressions: 1000,
      clicks: 120,
      conversions: 30,
    });
  }
  
  // Implement GetEngagementData method
  getEngagementData(call, callback) {
    callback(null, {
      daily_active_users: 500,
      monthly_active_users: 2000,
      engagement_rate: 0.25,
    });
  }
  
  // Implement GenerateReport method
  generateReport(call, callback) {
    const { start_date, end_date, report_type } = call.request;
    callback(null, {
      report_id: `report_${Date.now()}`,
      report_url: `https://example.com/reports/${Date.now()}.pdf`,
      generated_at: new Date().toISOString(),
    });
  }
}

// Create and start the mock server
const server = new grpc.Server();
server.addService(chatService.ChatService.service, new ChatServiceMock());
server.addService(telegramService.TelegramService.service, new TelegramServiceMock());
server.addService(authService.AuthService.service, new AuthServiceMock());
server.addService(mcpService.MCPService.service, new MCPServiceMock());
server.addService(mcpService.CampaignService.service, new CampaignServiceMock());
server.addService(mcpService.AnalyticsService.service, new AnalyticsServiceMock());

// Use a different port that's likely to be free
const PORT = 50100;

function startServer() {
  return new Promise((resolve, reject) => {
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), 
    (error, port) => {
      if (error) {
        console.error('Failed to start mock server:', error);
        reject(error);
        return;
      }
      console.log(`Mock server running at 0.0.0.0:${port}`);
      server.start();
      resolve(port);
    });
  });
}

function stopServer() {
  return new Promise((resolve, reject) => {
    if (server) {
      console.log('Shutting down mock server...');
      server.tryShutdown(() => {
        console.log('Mock server shut down');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = { 
  startServer, 
  stopServer,
  PORT  // Export port so tests can use it
};