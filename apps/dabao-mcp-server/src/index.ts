#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as grpc from "@grpc/grpc-js";
import * as dotenv from "dotenv";
import { initGrpcServer } from "./services/grpcServer.js";
import { logger } from "./logging/logger.js";
import { setupRoutes } from "./services/mcpRoutes.js";
import { setupAuthMiddleware } from "./middleware/auth.js";

// Load environment variables
dotenv.config();

// Configure the MCP server
const server = new Server(
  {
    name: "dabao-mcp-server",
    version: "0.6.2",
  },
  {
    capabilities: {
      resources: {
        list: true,
        read: true,
      },
      tools: {
        list: true,
        call: true,
      },
    },
  },
);

// Setup MCP routes and handlers
setupRoutes(server);

// Set up middleware
setupAuthMiddleware(server);

// Start the MCP server with stdio transport for local development
async function runMcpServer() {
  const transport = new StdioServerTransport();
  logger.info("Starting MCP server with stdio transport");
  await server.connect(transport);
}

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
  } catch (error) {
    logger.error(`Failed to start gRPC server: ${error.message}`);
  }
}

// Main function to start all services
async function main() {
  try {
    logger.info("Starting Dabao MCP Server");
    
    // Start the gRPC server
    await startGrpcServer();
    
    // Start the MCP server with stdio transport if needed
    if (process.env.ENABLE_STDIO === "true") {
      await runMcpServer();
    }
    
    logger.info("All services started successfully");
  } catch (error) {
    logger.error(`Error starting services: ${error.message}`);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});