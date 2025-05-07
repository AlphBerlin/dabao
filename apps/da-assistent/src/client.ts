import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline/promises';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to proto file
const PROTO_PATH = path.join(process.cwd(), "proto/mcp.proto");

/**
 * Simple client to test the Da AI Assistant gRPC server
 */
async function main() {
  try {
    console.log('Starting Da AI Assistant test client...');
    
    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // Load proto file
    const packageDefinition = await protoLoader.load(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    
    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
    const mcpProto = (protoDescriptor.dabao as any)?.mcp;
    
    if (!mcpProto) {
      throw new Error('Failed to load MCP proto definitions');
    }
    
    // Connect to the gRPC server
    const serverUrl = process.env.GRPC_SERVER_URL || 'localhost:50051';
    const client = new mcpProto.MCPService(serverUrl, grpc.credentials.createInsecure());
    
    console.log(`Connected to Da AI Assistant at ${serverUrl}`);
    console.log('Type your messages (type "exit" to quit)');
    
    // Start a bidirectional streaming call
    const chatStream = client.chat();
    
    // Handle incoming responses
    chatStream.on('data', (response: any) => {
      console.log(`\nDa: ${response.message}`);
      console.log('> '); // Prompt for next input
    });
    
    chatStream.on('end', () => {
      console.log('\nChat session ended');
      rl.close();
    });
    
    chatStream.on('error', (error: any) => {
      console.error('Error in chat stream:', error);
      rl.close();
    });
    
    // Send messages from user input
    while (true) {
      const input = await rl.question('> ');
      
      if (input.toLowerCase() === 'exit') {
        console.log('Closing chat session...');
        chatStream.end();
        break;
      }
      
      // Send message to server
      chatStream.write({
        user_id: 'test-user',
        message: input,
        session_id: `session-${Date.now()}`,
        context: {}
      });
    }
    
  } catch (error) {
    console.error('Error in client:', error);
    process.exit(1);
  }
}

// Start the client
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});