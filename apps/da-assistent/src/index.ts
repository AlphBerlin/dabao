#!/usr/bin/env node

import { DabaoMCPClient } from './services/MCPClient.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define default values
const serverPath = process.env.MCP_SERVER_PATH || '/Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/dabao-mcp-server/dist/index.js';
const grpcPort = parseInt(process.env.GRPC_PORT || '50051');
const grpcProto = process.env.GRPC_PROTO_PATH || path.join(__dirname, '../proto/chat.proto');

// Parse simple command line arguments
const args = process.argv.slice(2);
const interactive = !args.includes('--no-interactive');

/**
 * Main function to start Da Assistant
 */
async function main() {
  console.log('🔥 Starting Da Assistant...');

  // Check for Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
    console.warn('\n⚠️  Warning: ANTHROPIC_API_KEY is missing or using the default value.');
    console.warn('   Please set a valid API key in your .env file for full functionality.');
    console.warn('   The assistant will start, but Claude-based features will not work properly.\n');
  }
  
  try {
    // Initialize Da Assistant with MCP server path
    const client = new DabaoMCPClient(serverPath);
    
    // Connect to Dabao MCP server
    await client.connect();
    
    // Connect to gRPC server if proto path exists
    try {
      console.log(`Connecting to gRPC chat service on port ${grpcPort}...`);
      await client.connectGrpc(grpcProto, `localhost:${grpcPort}`);
    } catch (error:any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Warning: gRPC connection failed: ${errorMessage}`);
      console.warn('Continuing without gRPC support.');
    }
    
    // Start interactive chat mode if requested
    if (interactive) {
      await client.chatLoop();
    }
    
    // Cleanup resources on exit
    await client.cleanup();
    console.log('Da Assistant stopped');
    
  } catch (error) {
    console.error('Error starting Da Assistant:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Shutting down...');
  process.exit(0);
});

// Start the application
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});