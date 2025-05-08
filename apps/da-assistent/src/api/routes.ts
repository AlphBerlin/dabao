import express, { Request, Response } from 'express';
import { AssistantService } from '../services/AssistantService';
import { ConfigService } from '../config/ConfigService';
import { v4 as uuidv4 } from 'uuid';

// Get configuration
const configService = ConfigService.getInstance();

// Initialize the assistant service
const assistantService = new AssistantService(
  configService.getMCPServerAddress()
);

// Create router
const router = express.Router();

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

/**
 * GET /sessions/:userId
 * Get all chat sessions for a user
 */
router.get('/sessions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sessions = await assistantService.getUserSessions(userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

/**
 * POST /sessions
 * Create a new chat session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { userId, title } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    const sessionId = await assistantService.createSession(userId, title);
    res.status(201).json({ sessionId });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * DELETE /sessions/:sessionId
 * Delete a chat session
 */
router.delete('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
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
 */
router.get('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
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
 */
router.post('/sessions/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, content, parameters } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    
    const response = await assistantService.sendMessage(
      sessionId,
      userId,
      content,
      parameters
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
 */
router.post('/sessions/:sessionId/messages/stream', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, content, parameters } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' });
    }
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response
    const stream = await assistantService.sendMessageStream(
      sessionId,
      userId,
      content,
      parameters
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
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, parameters } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    // Generate temporary user and session IDs
    const userId = `temp-user-${uuidv4()}`;
    const sessionId = await assistantService.createSession(userId, 'Temporary Chat');
    
    // Send the message
    const response = await assistantService.sendMessage(
      sessionId,
      userId,
      message,
      parameters
    );
    
    res.json({ response });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

export default router;