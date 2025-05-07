import { createClients, promisifyMethods, authenticateUser, createAuthMetadata, generateTestData } from '../testHelpers.js';
import * as grpc from '@grpc/grpc-js';
import { IntentRecognizer } from '../../src/intents/intentRecognizer.js';

// Mock the IntentRecognizer directly
jest.mock('../../src/intents/intentRecognizer.js');

// Import PORT from mock server
const { PORT } = require('../mockServer');

// Override createClients to use our specific mock server port
jest.mock('../testHelpers.js', () => {
  const originalModule = jest.requireActual('../testHelpers.js');
  
  return {
    ...originalModule,
    createClients: () => {
      // Create gRPC clients using the mock server PORT
      const chatClient = new originalModule.protoDescriptors.chat.ChatService(
        `localhost:${PORT}`,
        grpc.credentials.createInsecure()
      );
      
      const telegramClient = new originalModule.protoDescriptors.telegram.TelegramService(
        `localhost:${PORT}`,
        grpc.credentials.createInsecure()
      );
      
      const authClient = new originalModule.protoDescriptors.auth.AuthService(
        `localhost:${PORT}`,
        grpc.credentials.createInsecure()
      );
      
      return { chatClient, telegramClient, authClient };
    }
  };
});

describe('Intent Recognition via gRPC', () => {
  const clients = createClients();
  const methods = promisifyMethods(clients);
  const testData = generateTestData();
  let authToken: string;
  let metadata: grpc.Metadata;
  
  beforeAll(async () => {
    try {
      // Configure mock behavior
      const mockIntentRecognizer = IntentRecognizer as jest.MockedClass<typeof IntentRecognizer>;
      mockIntentRecognizer.prototype.recognizeIntent.mockImplementation(async (text) => {
        // Mock different intents based on text input
        if (text.includes('campaign')) {
          return {
            name: 'campaign.list',
            response: 'Here are your campaigns',
            mcpToolName: 'list-campaigns',
            mcpToolParams: { projectId: 'test-project' },
            requiresFollowup: false
          };
        } else if (text.includes('customer')) {
          return {
            name: 'customer.get',
            response: 'Looking up customer information',
            mcpToolName: 'get-customer',
            mcpToolParams: { email: 'test@example.com' },
            requiresFollowup: false
          };
        } else {
          return {
            name: 'system.fallback',
            response: 'I did not understand that request',
            requiresFollowup: false
          };
        }
      });

      mockIntentRecognizer.prototype.executeMcpTool.mockImplementation(async (intent) => {
        return `Executed ${intent.name} with ${intent.mcpToolName || 'no tool'}`;
      });
      
      // Authenticate and get token for testing
      const authResponse = await authenticateUser(methods.auth.authenticate);
      authToken = authResponse.token;
      metadata = createAuthMetadata(authToken);
    } catch (error:any) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  describe('Intent Recognition via Chat', () => {
    it('should recognize campaign intent from message', async () => {
      try {
        const request = {
          content: 'Show me all my campaigns',
          user_id: 'test_user_id',
          project_id: 'test_project_id',
          session_id: `session_${Date.now()}`
        };
        
        const response = await methods.chat.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content).toContain('campaigns');
        expect(response.status_code).toBe(200);
        
        // The mock should have recognized the campaign.list intent
        expect(IntentRecognizer.prototype.recognizeIntent).toHaveBeenCalledWith(
          expect.stringContaining('campaign'),
          expect.any(Object)
        );
      } catch (error:any) {
        console.error('Campaign intent recognition error:', error);
        throw error;
      }
    });

    it('should recognize customer intent from message', async () => {
      try {
        const request = {
          content: 'Find customer information for john@example.com',
          user_id: 'test_user_id',
          project_id: 'test_project_id',
          session_id: `session_${Date.now()}`
        };
        
        const response = await methods.chat.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.content).toContain('customer');
        expect(response.status_code).toBe(200);
        
        // The mock should have recognized the customer.get intent
        expect(IntentRecognizer.prototype.recognizeIntent).toHaveBeenCalledWith(
          expect.stringContaining('customer'),
          expect.any(Object)
        );
      } catch (error:any) {
        console.error('Customer intent recognition error:', error);
        throw error;
      }
    });

    it('should handle unknown intents gracefully', async () => {
      try {
        const request = {
          content: 'This is a completely random message with no clear intent',
          user_id: 'test_user_id',
          project_id: 'test_project_id',
          session_id: `session_${Date.now()}`
        };
        
        const response = await methods.chat.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
        expect(response.status_code).toBe(200);
        
        // Should still attempt to recognize the intent, even though it will fall back
        expect(IntentRecognizer.prototype.recognizeIntent).toHaveBeenCalled();
      } catch (error:any) {
        console.error('Unknown intent error:', error);
        throw error;
      }
    });
  });

  describe('Intent Recognition via Stream', () => {
    it('should recognize intents in streaming mode', (done) => {
      try {
        // Create a chat stream
        const chatStream = clients.chatClient.chatStream(metadata);
        
        // Message with a clear intent
        const message = {
          content: 'List all my campaigns for project ABC',
          user_id: 'test_stream_user',
          project_id: 'ABC',
          session_id: `session_${Date.now()}`
        };
        
        // Listen for responses
        chatStream.on('data', (response:any) => {
          expect(response).toBeDefined();
          expect(response.content).toBeDefined();
          expect(response.content).toContain('campaigns');
          
          // Check that the intent recognizer was called
          expect(IntentRecognizer.prototype.recognizeIntent).toHaveBeenCalledWith(
            expect.stringContaining('campaign'),
            expect.any(Object)
          );
          
          // Close the stream after getting response
          chatStream.end();
          done();
        });
        
        // Handle errors
        chatStream.on('error', (error:any) => {
          console.error('Streaming intent test error:', error);
          fail(`Streaming intent test error: ${error.message}`);
          done();
        });
        
        // Write the message to the stream
        chatStream.write(message);
      } catch (error:any) {
        console.error('Streaming intent test error:', error);
        fail(`Streaming intent test error: ${error.message}`);
        done();
      }
    });

    it('should maintain intent context across multiple messages', (done) => {
      let messageCount = 0;
      let responseCount = 0;
      let sessionId = `session_${Date.now()}`;
      
      try {
        // Create a chat stream
        const chatStream = clients.chatClient.chatStream(metadata);
        
        // Messages in a conversation flow
        const messages = [
          {
            content: 'I want to look up some customer information',
            user_id: 'test_conversation_user',
            session_id: sessionId
          },
          {
            content: 'The email is john@example.com',
            user_id: 'test_conversation_user',
            session_id: sessionId
          }
        ];
        
        // Listen for responses
        chatStream.on('data', (response:any) => {
          expect(response).toBeDefined();
          expect(response.content).toBeDefined();
          expect(response.session_id).toBe(sessionId);
          responseCount++;
          
          // For the second message, we should still be in the customer context
          if (responseCount === 2) {
            expect(response.content).toContain('customer');
          }
          
          // Send the next message if available, otherwise end the test
          if (messageCount < messages.length) {
            chatStream.write(messages[messageCount++]);
          } else if (responseCount >= messages.length) {
            chatStream.end();
            done();
          }
        });
        
        // Handle errors
        chatStream.on('error', (error:any) => {
          console.error('Context test error:', error);
          fail(`Context test error: ${error.message}`);
          done();
        });
        
        // Write the first message to start the conversation
        chatStream.write(messages[messageCount++]);
      } catch (error:any) {
        console.error('Context test error:', error);
        fail(`Context test error: ${error.message}`);
        done();
      }
    });
  });
});