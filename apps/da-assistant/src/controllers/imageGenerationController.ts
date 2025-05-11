import { Request, Response } from 'express';
import { ImageGenerationService } from '../services/ImageGenerationService';
import { ImageGenerationOptions, ImageProvider, ImageSize } from '../types/imageGeneration';

export class ImageGenerationController {
  private imageService: ImageGenerationService;

  constructor() {
    this.imageService = new ImageGenerationService();
  }

  /**
   * List available image providers
   */
  listProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      const providers = await this.imageService.listProviders();
      res.json({ providers });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to list image providers',
        message: error.message
      });
    }
  }

  /**
   * Generate image based on prompt
   */
  generateImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        prompt,
        negativePrompt,
        provider,
        size,
        style,
        quality,
        numberOfImages = 1,
        userId,
        sessionId,
        modelName,
        customApiEndpoint,
        customApiKey
      } = req.body;

      // Validate required fields
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      // Build options object
      const options: ImageGenerationOptions = {
        prompt,
        negativePrompt,
        provider: provider as ImageProvider,
        size: size as ImageSize,
        style,
        quality,
        numberOfImages: Math.min(4, parseInt(numberOfImages) || 1), // Limit to 4 images max
        userId,
        sessionId,
        modelName,
        customApiEndpoint,
        customApiKey
      };

      const result = await this.imageService.generateImage(options);

      if (result.error || result.images.length === 0) {
        res.status(422).json({
          error: result.error || 'Failed to generate images',
          prompt
        });
        return;
      }

      res.json({
        images: result.images,
        prompt
      });
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate images',
        message: error.message
      });
    }
  }

  /**
   * Stream image generation updates
   * This is a placeholder - actual streaming implementation depends on
   * whether the providers support streaming or if we're just sending status updates
   */
  streamImageGeneration = async (req: Request, res: Response): Promise<void> => {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      const {
        prompt,
        negativePrompt,
        provider,
        size,
        style,
        quality,
        numberOfImages = 1,
        userId,
        sessionId,
        modelName
      } = req.body;

      // Validate required fields
      if (!prompt) {
        res.write(`data: ${JSON.stringify({ error: 'Prompt is required' })}\n\n`);
        res.end();
        return;
      }

      // Send initial status
      res.write(`data: ${JSON.stringify({ status: 'starting', message: 'Starting image generation' })}\n\n`);

      // Build options object
      const options: ImageGenerationOptions = {
        prompt,
        negativePrompt,
        provider: provider as ImageProvider,
        size: size as ImageSize,
        style,
        quality,
        numberOfImages: Math.min(4, parseInt(numberOfImages) || 1), // Limit to 4 images max
        userId,
        sessionId,
        modelName
      };

      // Send preparing message
      res.write(`data: ${JSON.stringify({ status: 'preparing', message: 'Preparing to generate images' })}\n\n`);

      // Process the image generation
      const result = await this.imageService.generateImage(options);

      if (result.error || result.images.length === 0) {
        res.write(`data: ${JSON.stringify({ 
          status: 'error', 
          error: result.error || 'Failed to generate images',
          prompt
        })}\n\n`);
        res.end();
        return;
      }

      // Send incremental updates if multiple images
      if (result.images.length > 1) {
        for (let i = 0; i < result.images.length; i++) {
          res.write(`data: ${JSON.stringify({ 
            status: 'progress', 
            image: result.images[i],
            totalImages: result.images.length,
            currentImage: i + 1
          })}\n\n`);

          // Add a slight delay between images to create a streaming effect
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Send completion message with all images
      res.write(`data: ${JSON.stringify({ 
        status: 'completed', 
        images: result.images,
        prompt
      })}\n\n`);

      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ 
        status: 'error', 
        error: 'Failed to generate images',
        message: error.message
      })}\n\n`);
      res.end();
    }
  }

  /**
   * Handler for serving static images
   */
  serveImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      
      // Security check to prevent path traversal
      if (filename && (filename.includes('/') || filename.includes('..'))) {
        res.status(400).json({ error: 'Invalid filename' });
        return;
      }
      
      // Get the image file path
      const filePath = `${process.cwd()}/storage/images/${filename || ''}`;
      
      // Send the file, let Express handle file not found
      res.sendFile(filePath);
    } catch (error: any) {
      res.status(404).json({
        error: 'Image not found',
        message: error.message
      });
    }
  }
}