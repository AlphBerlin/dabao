import express, { Request, Response, Router } from 'express';
import { AssistantService } from '../services/AssistantService';
import { ConfigService } from '../config/ConfigService';
import { ChatResponse } from '../types';
import imageRoutes from '../routes/imageRoutes';
import { requireAuth } from '../middleware/auth';
import { populateContext, requireUserContext } from '../middleware/context';

// Get configuration
const configService = ConfigService.getInstance();

// Initialize the assistant service
const assistantService = new AssistantService();

// Create router
const router: Router = express.Router();

// Middleware to connect to services if needed
router.use(async (req, res, next) => {
  try {
    // Nothing to do here yet, but could add connection checking
    next();
  } catch (error) {
    console.error('Error in middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register image generation routes - protected with authentication and context
router.use('/images', requireAuth, populateContext, requireUserContext, imageRoutes);

/**
 * POST /sessions
 * Create a new chat session
 * Protected: Requires authentication and user context
 */
router.post('/sessions', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    // Use user ID from the context instead of auth token
    const userId = req.context.user!.id;
    const { title } = req.body;
    
    const sessionId = await assistantService.createSession(userId, title);
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * GET /sessions
 * Get all sessions for the authenticated user
 * Protected: Requires authentication and user context
 */
router.get('/sessions', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const userId = req.context.user!.id;
    const sessions = await assistantService.getUserSessions(userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

/**
 * DELETE /sessions/:sessionId
 * Delete a chat session
 * Protected: Requires authentication and user context
 */
router.delete('/sessions/:sessionId', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    // Verify session belongs to authenticated user
    const userId = req.context.user!.id;
    const sessions = await assistantService.getUserSessions(userId);
    const userOwnsSession = sessions.some(session => session.id === sessionId);
    
    if (!userOwnsSession) {
      return res.status(403).json({ error: 'Not authorized to delete this session' });
    }
    
    const success = await assistantService.deleteSession(sessionId);
    
    if (success) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * GET /sessions/:sessionId/messages
 * Get all messages in a session
 * Protected: Requires authentication and user context
 */
router.get('/sessions/:sessionId/messages', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    // Verify session belongs to authenticated user
    const userId = req.context.user!.id;
    const sessions = await assistantService.getUserSessions(userId);
    const userOwnsSession = sessions.some(session => session.id === sessionId);
    
    if (!userOwnsSession) {
      return res.status(403).json({ error: 'Not authorized to access this session' });
    }
    
    const messages = await assistantService.getSessionMessages(sessionId);
    res.json({ messages });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

/**
 * POST /sessions/:sessionId/messages
 * Send a message to the assistant
 * Protected: Requires authentication and user context
 */
router.post('/sessions/:sessionId/messages', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { content, parameters } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Verify session belongs to authenticated user
    const userId = req.context.user!.id;
    const sessions = await assistantService.getUserSessions(userId);
    const userOwnsSession = sessions.some(session => session.id === sessionId);
    
    if (!userOwnsSession) {
      return res.status(403).json({ error: 'Not authorized to message in this session' });
    }
    
    // Add context information to parameters if available
    const contextParams = { ...parameters };
    if (req.context.organization) {
      contextParams.organization = {
        id: req.context.organization.id,
        name: req.context.organization.name,
        slug: req.context.organization.slug
      };
    }
    if (req.context.project) {
      contextParams.project = {
        id: req.context.project.id,
        name: req.context.project.name,
        slug: req.context.project.slug
      };
    }
    
    const response = await assistantService.sendMessage(
      sessionId,
      userId,
      content,
      contextParams
    );
    
    res.json({ response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /sessions/:sessionId/messages/stream
 * Send a message to the assistant and stream the response
 * Protected: Requires authentication and user context
 */
router.post('/sessions/:sessionId/messages/stream', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { content, parameters } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Verify session belongs to authenticated user
    const userId = req.context.user!.id;
    const sessions = await assistantService.getUserSessions(userId);
    const userOwnsSession = sessions.some(session => session.id === sessionId);
    
    if (!userOwnsSession) {
      return res.status(403).json({ error: 'Not authorized to message in this session' });
    }
    
    // Add context information to parameters if available
    const contextParams = { ...parameters };
    if (req.context.organization) {
      contextParams.organization = {
        id: req.context.organization.id,
        name: req.context.organization.name,
        slug: req.context.organization.slug
      };
    }
    if (req.context.project) {
      contextParams.project = {
        id: req.context.project.id,
        name: req.context.project.name,
        slug: req.context.project.slug
      };
    }
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response
    const stream = await assistantService.sendMessageStream(
      sessionId!,
      userId,
      content,
      contextParams
    );
    
    // Handle stream events
    stream.on('data', (chunk) => {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    });
    
    stream.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    });
    
    stream.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });
    
    // Handle client disconnection
    req.on('close', () => {
      stream.removeAllListeners();
    });
  } catch (error) {
    console.error('Error streaming message:', error);
    res.status(500).json({ error: 'Failed to stream message' });
  }
});

/**
 * POST /chat
 * Simple chat endpoint for one-off messages (no session tracking)
 * Protected: Requires authentication and user context
 */
router.post('/chat', requireAuth, populateContext, requireUserContext, async (req: Request, res: Response) => {
  try {
    const { message, parameters } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    // Use user ID from the context
    const userId = req.context.user!.id;
    const sessionId = await assistantService.createSession(userId, 'Temporary Chat');
    
    // Add context information to parameters if available
    const contextParams = { ...parameters };
    if (req.context.organization) {
      contextParams.organization = {
        id: req.context.organization.id,
        name: req.context.organization.name,
        slug: req.context.organization.slug
      };
    }
    if (req.context.project) {
      contextParams.project = {
        id: req.context.project.id,
        name: req.context.project.name,
        slug: req.context.project.slug
      };
    }
    
    // Send the message
    const response : ChatResponse = await assistantService.sendMessage(
      sessionId,
      userId,
      message,
      contextParams
    );
    
    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

export default router;