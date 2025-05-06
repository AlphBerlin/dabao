/**
 * Dabao MCP Server - Main Entry Point
 * 
 * This Model Context Protocol (MCP) server provides an intelligent interface for Dabao SaaS,
 * supporting campaign management, Telegram messaging, and analytics.
 */

import * as grpc from '@grpc/grpc-js';
import { initGrpcServer } from './src/services/grpcServer.js';
import { logger } from './src/logging/logger.js';
import { initializeDatabase, checkConnection } from './src/utils/database.js';
import config, { validateConfig } from './src/utils/config.js';


async function startServer() {
  try {
    // Validate configuration
    validateConfig();
    
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
    
  } catch (error: unknown) {
    logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function shutdown() {
  try {
    logger.info('Shutting down servers...');
    
    // Close resources
    process.exit(0);
  } catch (error: unknown) {
    logger.error(`Error during shutdown: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error(`Unhandled error starting server: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
