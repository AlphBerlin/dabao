#!/usr/bin/env node

import { startServer, stopServer } from './server.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define default values
const serverPath = process.env.MCP_SERVER_PATH || path.join(__dirname, '../../dabao-mcp-server/dist/index.js');
const grpcPort = parseInt(process.env.GRPC_PORT || '50051');

/**
 * Main function to start Da AI Assistant
 */
async function main() {
  console.log('🔥 Starting Da AI Assistant...');

  try {
    // Start gRPC server
    const server = await startServer(grpcPort, serverPath);
    
    console.log(`Da AI Assistant running on port ${grpcPort}`);
    console.log('Press Ctrl+C to stop');
    
    // Handle cleanup on process exit
    process.once('SIGINT', async () => {
      console.log('\nShutting down...');
      await stopServer(server);
      process.exit(0);
    });
    
    process.once('SIGTERM', async () => {
      console.log('\nShutting down...');
      await stopServer(server);
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error starting Da AI Assistant:', error);
    process.exit(1);
  }
}

// Start the application
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});