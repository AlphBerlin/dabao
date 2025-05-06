#!/usr/bin/env node

import * as grpc from "@grpc/grpc-js";
import * as dotenv from "dotenv";
import { initGrpcServer } from "./services/grpcServer.js";
import { logger } from "./logging/logger.js";

// Load environment variables
dotenv.config();

// Start the gRPC server
async function startGrpcServer() {
  try {
    const grpcServer = await initGrpcServer();
    const port = process.env.GRPC_PORT || "50051";
    grpcServer.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, port) => {
        if (err) {
          logger.error(`Failed to bind gRPC server: ${err.message}`);
          return;
        }
        logger.info(`gRPC server listening on port ${port}`);
        grpcServer.start();
      }
    );
  } catch (error: unknown) {
    logger.error(`Failed to start gRPC server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Main function to start all services
async function main() {
  try {
    
    // Start the gRPC server
    await startGrpcServer();
    
    logger.info("All services started successfully");
  } catch (error: unknown) {
    logger.error(`Error starting services: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});