import * as grpc from '@grpc/grpc-js';
import { logger } from '../logging/logger.js';

/**
 * Initialize a gRPC server with the specified service implementations
 * 
 * @param serviceImplementations Object mapping service names to their implementations
 * @param port Port number to bind the server to
 * @returns The initialized gRPC server
 */
export function initGrpcServer(
  serviceImplementations: Record<string, any>,
  port: number = 50051
): grpc.Server {
  try {
    // Create a new gRPC server
    const server = new grpc.Server();
    
    // Add all service implementations
    Object.entries(serviceImplementations).forEach(([serviceName, implementation]) => {
      server.addService(
        // @ts-ignore - grpc types are difficult to reconcile here
        serviceName as any,
        implementation
      );
      logger.info(`Added service "${serviceName}" to gRPC server`);
    });
    
    // Bind to specified port
    server.bindAsync(
      `0.0.0.0:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, actualPort) => {
        if (err) {
          logger.error(`Failed to bind gRPC server to port ${port}:`, err);
          throw err;
        }
        
        logger.info(`gRPC server bound to port ${actualPort}`);
        server.start();
      }
    );
    
    return server;
  } catch (error) {
    logger.error('Failed to initialize gRPC server:', error);
    throw error;
  }
}

/**
 * Helper to create a unary method handler for gRPC
 * 
 * @param handler The implementation function
 * @returns A gRPC handler function
 */
export function createUnaryHandler(
  handler: (request: any) => Promise<any>
): (call: any, callback: any) => void {
  return async (call: any, callback: any) => {
    try {
      const result = await handler(call.request);
      callback(null, result);
    } catch (error) {
      logger.error('Error in gRPC handler:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: `Internal error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };
}