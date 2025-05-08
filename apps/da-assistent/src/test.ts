import { AssistantService } from './services/AssistantService.js';
import { ConfigService } from './config/ConfigService.js';
import { v4 as uuidv4 } from 'uuid';

// Get configuration
const configService = ConfigService.getInstance();
const mcpServerAddress = configService.getMCPServerAddress();

/**
 * Test the AssistantService implementation
 */
async function testAssistant() {
  console.log('Starting Da Assistent test...');
  console.log(`Connecting to MCP server at ${mcpServerAddress}`);
  
  // Initialize assistant service
  const assistant = new AssistantService(mcpServerAddress);
  
  try {
    // Connect to MCP server
    await assistant.connect();
    console.log('✅ Connected to MCP server');
    
    // Create a test user and session
    const userId = `test-user-${uuidv4()}`;
    const sessionId = await assistant.createSession(userId, 'Test Conversation');
    console.log(`✅ Created session: ${sessionId}`);
    
    // Send a test message
    console.log('Sending test message...');
    const response = await assistant.sendMessage(
      sessionId,
      userId,
      'Hello! Can you introduce yourself and explain what features you offer?'
    );
    
    console.log('\n--- Response from Da Assistent ---');
    console.log(response);
    console.log('-------------------------------\n');
    
    // Test with a follow-up message to verify context is maintained
    console.log('Sending follow-up message to test context maintenance...');
    const followUpResponse = await assistant.sendMessage(
      sessionId,
      userId,
      'That sounds great! Can you explain more about how your memory system works?'
    );
    
    console.log('\n--- Follow-up Response ---');
    console.log(followUpResponse);
    console.log('-------------------------------\n');
    
    // Test getting session history
    const sessions = await assistant.getUserSessions(userId);
    console.log(`✅ Retrieved ${sessions.length} sessions for user`);
    
    // Test getting message history
    const messages = await assistant.getSessionMessages(sessionId);
    console.log(`✅ Retrieved ${messages.length} messages in session`);
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Clean up
    await assistant.disconnect();
    console.log('Disconnected from MCP server');
  }
}

// Run the test
testAssistant().catch(console.error);