import { createClients, promisifyMethods, authenticateUser, createAuthMetadata, generateTestData, wait } from '../testHelpers.js';
import * as grpc from '@grpc/grpc-js';

describe('TelegramService', () => {
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

  describe('SendMessage', () => {
    it('should send a message with required fields', async () => {
      try {
        const testData = generateTestData();
        const request = {
          chat_id: testData.telegram.chatId,
          text: testData.telegram.messageText
        };
        
        const response = await methods.telegram.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.message_id).toBeDefined();
      } catch (error) {
        console.error('SendMessage error:', error);
        throw error;
      }
    });

    it('should send a message with markdown formatting', async () => {
      try {
        const testData = generateTestData();
        const request = {
          chat_id: testData.telegram.chatId,
          text: '*Bold Text* _Italic Text_ `Code Text`',
          use_markdown: true
        };
        
        const response = await methods.telegram.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.message_id).toBeDefined();
      } catch (error) {
        console.error('SendMessage with markdown error:', error);
        throw error;
      }
    });

    it('should send a message with media attachments', async () => {
      try {
        const testData = generateTestData();
        const request = {
          chat_id: testData.telegram.chatId,
          text: 'Message with attachments',
          media_urls: [
            'https://example.com/sample-image.jpg',
            'https://example.com/sample-document.pdf'
          ]
        };
        
        const response = await methods.telegram.sendMessage(request, metadata);
        
        expect(response).toBeDefined();
        expect(response.success).toBe(true);
        expect(response.message_id).toBeDefined();
      } catch (error) {
        console.error('SendMessage with media error:', error);
        throw error;
      }
    });

    it('should reject messages without required fields', async () => {
      try {
        // Missing chat_id
        const request = {
          text: 'This should fail'
        };
        
        await methods.telegram.sendMessage(request, metadata);
        
        // Should not reach here
        fail('SendMessage should fail without chat_id');
      } catch (error : any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
      
      try {
        // Missing text
        const testData = generateTestData();
        const request = {
          chat_id: testData.telegram.chatId
        };
        
        await methods.telegram.sendMessage(request, metadata);
        
        // Should not reach here
        fail('SendMessage should fail without text');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.INVALID_ARGUMENT);
      }
    });

    it('should reject messages without authentication', async () => {
      try {
        const testData = generateTestData();
        const request = {
          chat_id: testData.telegram.chatId,
          text: testData.telegram.messageText
        };
        
        // Use empty metadata (no auth token)
        await methods.telegram.sendMessage(request, new grpc.Metadata());
        
        // Should not reach here
        fail('SendMessage should fail without authentication');
      } catch (error:any) {
        expect(error).toBeDefined();
        expect(error.code).toBe(grpc.status.UNAUTHENTICATED);
      }
    });
  });

  describe('GetTemplates', () => {
    it('should retrieve all available templates', async () => {
      try {
        const request = {};
        
        const response = await methods.telegram.getTemplates(request, metadata);
        
        expect(response).toBeDefined();
        expect(Array.isArray(response.templates)).toBe(true);
        
        if (response.templates.length > 0) {
          const template = response.templates[0];
          expect(template.id).toBeDefined();
          expect(template.name).toBeDefined();
          expect(template.content).toBeDefined();
          expect(typeof template.supports_variables).toBe('boolean');
        }
      } catch (error) {
        console.error('GetTemplates error:', error);
        throw error;
      }
    });

    it('should retrieve templates filtered by category', async () => {
      try {
        const request = {
          category: 'welcome'
        };
        
        const response = await methods.telegram.getTemplates(request, metadata);
        
        expect(response).toBeDefined();
        expect(Array.isArray(response.templates)).toBe(true);
        
        // All returned templates should match the category
        response.templates.forEach((template:any) => {
          expect(template.category).toBe(request.category);
        });
      } catch (error) {
        console.error('GetTemplates filtered error:', error);
        throw error;
      }
    });
  });

  describe('ReceiveMessages', () => {
    it('should establish streaming for incoming messages', (done) => {
      try {
        // Define offset for messages
        const request = {
          offset: 0
        };
        
        // Create message stream
        const messageStream = clients.telegramClient.receiveMessages(request, metadata);
        
        // Set a timeout to end the test after a short period
        const timeout = setTimeout(() => {
          messageStream.cancel();
          done();
        }, 3000); // Wait for 3 seconds
        
        // Listen for incoming messages
        messageStream.on('data', (event:any) => {
          expect(event).toBeDefined();
          expect(event.message_id).toBeDefined();
          expect(event.chat_id).toBeDefined();
          expect(event.user_id).toBeDefined();
          expect(event.text).toBeDefined();
          expect(event.timestamp).toBeDefined();
          
          // End early if we got a message
          clearTimeout(timeout);
          messageStream.cancel();
          done();
        });
        
        // Handle errors
        messageStream.on('error', (error:any) => {
          // Ignore cancellation error
          if (error.code !== grpc.status.CANCELLED) {
            console.error('ReceiveMessages error:', error);
            clearTimeout(timeout);
            fail(`ReceiveMessages error: ${error.message}`);
            done();
          }
        });
      } catch (error:any) {
        console.error('ReceiveMessages test error:', error);
        fail(`ReceiveMessages test error: ${error.message}`);
        done();
      }
    });

    it('should reject streaming without authentication', (done) => {
      try {
        const request = {
          offset: 0
        };
        
        // Create message stream with empty metadata (no auth token)
        const messageStream = clients.telegramClient.receiveMessages(request, new grpc.Metadata());
        
        // Listen for errors (we expect authentication error)
        messageStream.on('error', (error:any) => {
          expect(error).toBeDefined();
          expect(error.code).toBe(grpc.status.UNAUTHENTICATED);
          done();
        });
        
        // If we get data, that's an error
        messageStream.on('data', () => {
          fail('Should not receive messages without authentication');
          messageStream.cancel();
          done();
        });
      } catch (error:any) {
        console.error('Unauthenticated ReceiveMessages test error:', error);
        fail(`Unauthenticated ReceiveMessages test error: ${error.message}`);
        done();
      }
    });
  });
});