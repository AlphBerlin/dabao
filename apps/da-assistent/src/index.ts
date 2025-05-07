#!/usr/bin/env node

import { DabaoMCPClient } from './services/MCPClient.js';
import { ChatService } from './services/ChatService.js';
import { ChatGrpcService } from './grpc/chatGrpcService.js';
import { initGrpcServer } from './grpc/server.js';
import { logger } from './logging/logger.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Load environment variables
dotenv.config();

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define default values
const serverPath = process.env.MCP_SERVER_PATH || '/Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/dabao-mcp-server/dist/index.js';
const grpcPort = parseInt(process.env.GRPC_PORT || '50051');

// Parse simple command line arguments
const args = process.argv.slice(2);
const interactive = !args.includes('--no-interactive');
const enableGrpc = !args.includes('--no-grpc');

/**
 * Main function to start Da Assistant with streamlined architecture
 * - Intent recognition system directly integrated with MCP client
 * - Only chat API is exposed, with all actions performed via MCP client
 */
async function main() {
  console.log('🔥 Starting Da Assistant...');

  // Check for Anthropic API key
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
    console.warn('\n⚠️  Warning: ANTHROPIC_API_KEY is missing or using the default value.');
    console.warn('   This will only affect fallback to Claude for complex queries.');
    console.warn('   Intent recognition mode will still work without Claude.\n');
  }
  
  try {
    logger.info('Initializing services...');
    
    // Initialize core services
    const chatService = new ChatService();
    const chatGrpcService = new ChatGrpcService(chatService);
    
    // Initialize Da Assistant with MCP server path
    const mcpClient = new DabaoMCPClient(serverPath);
    
    // Connect services (MCPClient <-> ChatService)
    mcpClient.setChatService(chatService);
    
    // Connect to Dabao MCP server
    await mcpClient.connect();
    logger.info('Connected to Dabao MCP server');
    
    // Start gRPC server if enabled
    let grpcServer: any;
    if (enableGrpc) {
      try {
        // Initialize gRPC server with our chat service implementation
        grpcServer = initGrpcServer({
          'chat.ChatService': {
            sendMessage: chatGrpcService.sendMessage.bind(chatGrpcService),
            chatStream: chatGrpcService.chatStream.bind(chatGrpcService),
          }
        }, grpcPort);
        
        // Connect to the gRPC server we just started
        chatGrpcService.setMcpClient(mcpClient);
        
        logger.info(`gRPC Server started on port ${grpcPort}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Failed to start gRPC server: ${errorMessage}`);
        console.warn(`Warning: gRPC server failed to start: ${errorMessage}`);
        console.warn('Continuing without gRPC support.');
      }
    }
    
    // Start interactive chat mode if requested
    if (interactive) {
      await mcpClient.chatLoop();
    } else {
      // If not in interactive mode, keep the process alive
      console.log('Da Assistant running in non-interactive mode');
      console.log('Press Ctrl+C to stop');
    }
    
    // Handle cleanup on process exit
    process.once('SIGINT', async () => {
      console.log('\nShutting down...');
      await cleanup(mcpClient, grpcServer);
      process.exit(0);
    });
    
    process.once('SIGTERM', async () => {
      console.log('\nShutting down...');
      await cleanup(mcpClient, grpcServer);
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Error starting Da Assistant:', error);
    console.error('Error starting Da Assistant:', error);
    process.exit(1);
  }
}

/**
 * Clean up resources before shutdown
 */
async function cleanup(mcpClient: DabaoMCPClient, grpcServer?: any) {
  logger.info('Cleaning up resources...');
  
  // Clean up MCP client resources
  if (mcpClient) {
    try {
      await mcpClient.cleanup();
    } catch (error) {
      logger.error('Error cleaning up MCP client:', error);
    }
  }
  
  // Shut down gRPC server if running
  if (grpcServer) {
    try {
      await new Promise<void>((resolve) => {
        grpcServer.tryShutdown(() => {
          logger.info('gRPC server shut down');
          resolve();
        });
      });
    } catch (error) {
      logger.error('Error shutting down gRPC server:', error);
    }
  }
  
  logger.info('Da Assistant stopped');
  console.log('Da Assistant stopped');
}

// Start the application
main().catch(error => {
  logger.error('Fatal error:', error);
  console.error('Fatal error:', error);
  process.exit(1);
});