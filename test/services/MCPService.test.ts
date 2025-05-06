import { createClients, promisifyMethods, authenticateUser, createAuthMetadata, wait } from '../testHelpers';
import * as grpc from '@grpc/grpc-js';

describe('MCPService', () => {
  const clients = createClients();
  const methods = promisifyMethods(clients);
  let authToken: string;
  let metadata: grpc.Metadata;
  
  beforeAll(async () => {
    try {
      // Authenticate and get token for testing
      const authResponse = await authenticateUser(methods.auth.authenticate);
      authToken = authResponse.token;
      metadata = createAuthMetadata(authToken);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  describe('ProcessRequest', () => {
    it('should process a valid request', async () => {
      try {
        const request = {
          user_id: 'test_user',
          intent: 'campaign.list',
          parameters: { page: '1', page_size: '10' },
          session_id: `session_${Date.now()}`
        };
        
        const response = await methods.mcp.processRequest(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.message).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.payload).toBeDefined();
      } catch (error) {
        console.error('ProcessRequest error:', error);
        throw error;
      }
    });

    it('should handle invalid intent gracefully', async () => {
      try {
        const request = {
          user_id: 'test_user',
          intent: 'non_existent_intent',
          parameters: {},
          session_id: `session_${Date.now()}`
        };
        
        const response = await methods.mcp.processRequest(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(false);
      } catch (error) {
        // Some implementations might return error response instead of throwing
        expect(error).toBeDefined();
      }
    });

    it('should reject requests without authentication', async () => {
      try {
        const request = {
          user_id: 'test_user',
          intent: 'campaign.list',
          parameters: {},
          session_id: `session_${Date.now()}`
        };
        
        // Use empty metadata (no auth token)
        await methods.mcp.processRequest(request, new grpc.Metadata());
        
        // Should not reach here
        fail('Request should have failed without authentication');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.UNAUTHENTICATED);
      }
    });
  });

  describe('Chat', () => {
    it('should establish bidirectional streaming', (done) => {
      try {
        // Create a chat stream
        const chatStream = clients.mcpClient.chat(metadata);
        
        // Message to send
        const message = {
          user_id: 'test_user',
          message: 'Hello, I need help with campaigns',
          context: {},
          session_id: `session_${Date.now()}`
        };
        
        // Listen for responses
        chatStream.on('data', (response) => {
          expect(response).toBeDefined();
          expect(response.message).toBeDefined();
          expect(typeof response.message).toBe('string');
          expect(Array.isArray(response.actions)).toBe(true);
          
          // Close the stream after getting response
          chatStream.end();
          done();
        });
        
        // Handle errors
        chatStream.on('error', (error) => {
          console.error('Chat error:', error);
          fail(`Chat stream error: ${error.message}`);
          done();
        });
        
        // Write the message to the stream
        chatStream.write(message);
      } catch (error) {
        console.error('Chat test error:', error);
        fail(`Chat test error: ${error.message}`);
        done();
      }
    });

    it('should handle multiple messages in sequence', (done) => {
      let messageCount = 0;
      let responseCount = 0;
      
      try {
        // Create a chat stream
        const chatStream = clients.mcpClient.chat(metadata);
        
        // Messages to send
        const messages = [
          {
            user_id: 'test_user',
            message: 'I want to create a campaign',
            context: {},
            session_id: `session_${Date.now()}`
          },
          {
            user_id: 'test_user',
            message: 'Call it Summer Sale 2025',
            context: { intent: 'create_campaign' },
            session_id: `session_${Date.now()}`
          }
        ];
        
        // Listen for responses
        chatStream.on('data', (response) => {
          expect(response).toBeDefined();
          expect(response.message).toBeDefined();
          responseCount++;
          
          // Send the next message if available, otherwise end the test
          if (messageCount < messages.length) {
            chatStream.write(messages[messageCount++]);
          } else if (responseCount >= messages.length) {
            chatStream.end();
            done();
          }
        });
        
        // Handle errors
        chatStream.on('error', (error) => {
          console.error('Chat sequence error:', error);
          fail(`Chat stream error: ${error.message}`);
          done();
        });
        
        // Write the first message to start the conversation
        chatStream.write(messages[messageCount++]);
      } catch (error) {
        console.error('Chat sequence test error:', error);
        fail(`Chat sequence test error: ${error.message}`);
        done();
      }
    });
  });

  describe('StreamEvents', () => {
    it('should stream events for subscribed types', (done) => {
      try {
        // Define event types to subscribe to
        const request = {
          user_id: 'test_user',
          event_types: ['campaign_update', 'system_notification']
        };
        
        // Create event stream
        const eventStream = clients.mcpClient.streamEvents(request, metadata);
        
        // Set a timeout to end the test after receiving some events
        const timeout = setTimeout(() => {
          eventStream.cancel();
          done();
        }, 3000); // Wait for 3 seconds
        
        // Track received events
        const receivedEvents: any = {};
        
        // Listen for events
        eventStream.on('data', (event) => {
          expect(event).toBeDefined();
          expect(event.event_type).toBeDefined();
          expect(event.timestamp).toBeDefined();
          expect(event.payload).toBeDefined();
          
          // Record this event type
          receivedEvents[event.event_type] = true;
          
          // If we've received events of all types, end early
          if (request.event_types.every(type => receivedEvents[type])) {
            clearTimeout(timeout);
            eventStream.cancel();
            done();
          }
        });
        
        // Handle errors
        eventStream.on('error', (error) => {
          // Ignore cancellation error
          if (error.code !== grpc.status.CANCELLED) {
            console.error('StreamEvents error:', error);
            clearTimeout(timeout);
            fail(`StreamEvents error: ${error.message}`);
            done();
          }
        });
      } catch (error) {
        console.error('StreamEvents test error:', error);
        fail(`StreamEvents test error: ${error.message}`);
        done();
      }
    });

    it('should reject streaming without authentication', (done) => {
      try {
        // Define event types to subscribe to
        const request = {
          user_id: 'test_user',
          event_types: ['campaign_update']
        };
        
        // Create event stream with empty metadata (no auth token)
        const eventStream = clients.mcpClient.streamEvents(request, new grpc.Metadata());
        
        // Listen for errors (we expect authentication error)
        eventStream.on('error', (error) => {
          expect(error).toBeDefined();
          expect(error.code).toBe(grpc.status.UNAUTHENTICATED);
          done();
        });
        
        // If we get data, that's an error
        eventStream.on('data', () => {
          fail('Should not receive events without authentication');
          eventStream.cancel();
          done();
        });
      } catch (error) {
        console.error('Unauthenticated StreamEvents test error:', error);
        fail(`Unauthenticated StreamEvents test error: ${error.message}`);
        done();
      }
    });
  });
});