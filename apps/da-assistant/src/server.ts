import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ConfigService } from './config/ConfigService';
import apiRoutes from './api/routes';
import { AssistantService } from './services/AssistantService';
import dotenv from 'dotenv';
import { optionalAuth } from './middleware/auth';
import { populateContext } from './middleware/context';
import { PrismaService } from './services/prismaService';

// Load environment variables
dotenv.config();

// Get configuration
const configService = ConfigService.getInstance();

// Create Express application
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: configService.get('CORS_ALLOWED_ORIGINS', '*'),
  credentials: true,
})); // Enable CORS with credentials
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies
app.use(morgan(configService.isDevelopment() ? 'dev' : 'combined')); // Request logging

// Apply optional authentication to all requests
// This will attach the user to req if authenticated but not require auth
app.use(optionalAuth);

// Apply context middleware to populate user, organization, and project details
// This will use the authenticated user from optionalAuth to build the context
app.use(populateContext);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: configService.isDevelopment() ? err.message : undefined
  });
});

// Start the server
const PORT = configService.getServerPort();

/**
 * Start the server and initialize connections
 */
async function startServer() {
  try {
    // Initialize Prisma service
    const prismaService = PrismaService.getInstance();
    await prismaService.connect();
    console.log('Connected to database');
    
    // Initialize the assistant service (connections to MCP server)
    const assistantService = new AssistantService();
    await assistantService.connect();
    
    // Start listening for requests
    app.listen(PORT, () => {
      console.log(`Da Assistent server is running on port ${PORT}`);
      console.log(`Environment: ${configService.getNodeEnv()}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully');
      await assistantService.disconnect();
      await prismaService.disconnect();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await assistantService.disconnect();
      await prismaService.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();