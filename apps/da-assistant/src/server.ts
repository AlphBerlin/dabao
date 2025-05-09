import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ConfigService } from './config/ConfigService';
import apiRoutes from './api/routes';
import { AssistantService } from './services/AssistantService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get configuration
const configService = ConfigService.getInstance();

// Create Express application
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(morgan(configService.isDevelopment() ? 'dev' : 'combined')); // Request logging

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
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully');
      await assistantService.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();