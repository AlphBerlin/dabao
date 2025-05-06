/**
 * Dabao MCP Server - Main Entry Point
 * 
 * This Model Context Protocol (MCP) server provides an intelligent interface for Dabao SaaS,
 * supporting campaign management, Telegram messaging, and analytics.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import * as grpc from '@grpc/grpc-js';
import { setupRoutes } from './src/services/mcpRoutes.js';
import { initGrpcServer } from './src/services/grpcServer.js';
import { logger } from './src/logging/logger.js';
import { initializeDatabase, checkConnection } from './src/utils/database.js';
import config, { validateConfig } from './src/utils/config.js';

// Create MCP server instance
const mcpServer = new Server({
  name: config.server.name,
  version: config.server.version,
  enableStdio: config.server.enableStdio
});

async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    
    // Set up MCP routes
    setupRoutes(mcpServer);
    logger.info('MCP routes initialized');
    
    // Initialize gRPC server
    const grpcServer = await initGrpcServer();
    
    // Check database connection
    const isDbConnected = await checkConnection();
    if (isDbConnected) {
      logger.info('Database connection successful');
      
      // Initialize database schema if needed
      await initializeDatabase();
    } else {
      logger.warn('Database connection failed - some features may not work');
    }
    
    // Start both servers
    const grpcPort = config.server.grpcPort;
    
    // Start the MCP server
    await mcpServer.listen();
    logger.info(`MCP Server started`);
    
    // Start the gRPC server
    grpcServer.bindAsync(
      `0.0.0.0:${grpcPort}`,
      grpc.ServerCredentials.createInsecure(),
      (error, port) => {
        if (error) {
          logger.error(`Failed to start gRPC server: ${error.message}`);
          throw error;
        }
        
        logger.info(`gRPC Server started on port ${port}`);
        grpcServer.start();
      }
    );
    
    // Handle shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    logger.info(`Dabao MCP Server v${config.server.version} started in ${config.server.environment} mode`);
    
  } catch (error) {
    logger.error(`Failed to start server: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    logger.info('Shutting down servers...');
    
    // Stop the MCP server
    await mcpServer.close();
    logger.info('MCP Server stopped');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error(`Unhandled error starting server: ${error.message}`);
  process.exit(1);
});
