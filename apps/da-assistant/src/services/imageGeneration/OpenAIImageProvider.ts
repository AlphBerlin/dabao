import OpenAI from 'openai';
import { 
  GeneratedImage, 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider, 
  ImageSize,
  ImageQuality,
  ImageStyle
} from '../../types/imageGeneration';
import { BaseImageProvider } from './BaseImageProvider';

export class OpenAIImageProvider extends BaseImageProvider {
  private client: OpenAI;
  
  constructor(config: { apiKey: string, modelName?: string }) {
    super(ImageProvider.OPENAI, config);
    
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: config.apiKey
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple test to check if the API is available
      await this.client.models.list();
      return true;
    } catch (error) {
      console.error('OpenAI provider is not available:', error);
      return false;
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      // Map our generic options to OpenAI-specific parameters
      const openaiModel = options.modelName || 'dall-e-3';
      
      // Map our size enum to OpenAI's supported sizes
      let size: string;
      switch (options.size) {
        case ImageSize.SMALL:
          size = '256x256'; // Only for DALL-E 2
          break;
        case ImageSize.MEDIUM:
          size = '512x512'; // Only for DALL-E 2
          break;
        case ImageSize.SQUARE_HD:
          size = '1024x1024';
          break;
        case ImageSize.PORTRAIT_HD:
          size = '1024x1792';
          break;
        case ImageSize.LANDSCAPE_HD:
          size = '1792x1024';
          break;
        default:
          size = '1024x1024'; // Default to 1024x1024
      }
      
      // Map our style enum to OpenAI's style parameter
      let style: 'vivid' | 'natural' = 'natural';
      if (options.style === ImageStyle.VIVID) {
        style = 'vivid';
      }
      
      // OpenAI DALL-E 3 doesn't support generating multiple images in a single call
      // We need to make multiple API calls if numberOfImages > 1
      const numberOfImages = options.numberOfImages || 1;
      const generatedImages: GeneratedImage[] = [];
      
      // Use Promise.all to generate multiple images in parallel
      const imagePromises = Array(numberOfImages).fill(0).map(async () => {
        try {
          const response = await this.client.images.generate({
            model: openaiModel,
            prompt: options.prompt,
            n: 1,
            size: size as any,
            quality: options.quality === ImageQuality.HD ? 'hd' : 'standard',
            style,
            response_format: 'url'
          });

          if (response.data && response.data[0] && response.data[0].url) {
            return this.createGeneratedImage(response.data[0].url, options);
          }
          return null;
        } catch (error) {
          console.error('Error generating image with OpenAI:', error);
          return null;
        }
      });
      
      // Process the results and filter out any failed generations
      const results = await Promise.all(imagePromises);
      for (const result of results) {
        if (result) {
          generatedImages.push(result);
        }
      }

      if (generatedImages.length === 0) {
        return {
          images: [],
          error: 'Failed to generate images with OpenAI'
        };
      }

      return { images: generatedImages };
    } catch (error: any) {
      console.error('Error generating image with OpenAI:', error);
      return {
        images: [],
        error: `Error generating image with OpenAI: ${error.message || error}`
      };
    }
  }
}