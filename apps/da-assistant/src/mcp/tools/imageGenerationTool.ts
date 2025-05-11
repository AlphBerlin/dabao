import { ImageGenerationService } from '../../services/ImageGenerationService';
import { 
  ImageGenerationOptions, 
  ImageProvider, 
  ImageSize, 
  ImageStyle,
  ImageQuality 
} from '../../types/imageGeneration';

/**
 * Image Generation Tool for MCP
 * Allows AI assistants to generate images via multiple providers
 */
export const imageGenerationTool = {
  name: 'generate_image',
  description: 'Generate images based on text prompts using various AI image generation models (DALL-E, Google Imagen, Stable Diffusion)',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The text prompt describing the image to generate'
      },
      negativePrompt: {
        type: 'string',
        description: 'Optional negative prompt describing what should not be in the image'
      },
      provider: {
        type: 'string',
        enum: Object.values(ImageProvider),
        description: 'The image provider to use. If not specified, the system will use the first available provider'
      },
      size: {
        type: 'string',
        enum: Object.values(ImageSize),
        description: 'Size of the generated image. Default: SQUARE_HD (1024x1024)'
      },
      style: {
        type: 'string',
        enum: Object.values(ImageStyle),
        description: 'Style of the generated image. Default: NATURAL'
      },
      quality: {
        type: 'string',
        enum: Object.values(ImageQuality),
        description: 'Quality of the generated image. Default: STANDARD'
      },
      numberOfImages: {
        type: 'integer',
        minimum: 1,
        maximum: 4,
        description: 'Number of images to generate. Default: 1, Maximum: 4'
      },
      userId: {
        type: 'string',
        description: 'Optional ID of the user making the request'
      },
      sessionId: {
        type: 'string',
        description: 'Optional ID of the session'
      }
    },
    required: ['prompt']
  },
  execute: async (params: any): Promise<string> => {
    try {
      const imageService = new ImageGenerationService();

      // Cast params to ImageGenerationOptions
      const options: ImageGenerationOptions = {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        provider: params.provider as ImageProvider,
        size: params.size as ImageSize,
        style: params.style as ImageStyle,
        quality: params.quality as ImageQuality,
        numberOfImages: Math.min(4, params.numberOfImages || 1),
        userId: params.userId,
        sessionId: params.sessionId
      };

      // Generate the image(s)
      const result = await imageService.generateImage(options);

      if (result.error) {
        return `Failed to generate image: ${result.error}`;
      }

      if (result.images.length === 0) {
        return 'No images were generated. Please try again with a different prompt or provider.';
      }

      // Format the response for the AI to display
      const imageUrls = result.images.map(img => img.url);
      
      if (imageUrls.length === 1) {
        return `![Generated Image](${imageUrls[0]})`;
      } else {
        return imageUrls.map((url, i) => `![Generated Image ${i + 1}](${url})`).join('\n\n');
      }
    } catch (error: any) {
      console.error('Error in generate_image tool:', error);
      return `An error occurred while generating the image: ${error.message || error}`;
    }
  }
};