import { GoogleGenAI } from "@google/genai";
import { 
  GeneratedImage, 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider,
  ImageSize,
  ImageStyle
} from '../../types/imageGeneration';
import { BaseImageProvider } from './BaseImageProvider';

export class GoogleImageProvider extends BaseImageProvider {
  private client: GoogleGenAI;
  
  constructor(config: { apiKey: string, modelName?: string }) {
    super(ImageProvider.GOOGLE, config);
    
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }
    
    this.client = new GoogleGenAI({ apiKey: config.apiKey });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple test to check if the API is available
      const testResult = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: 'Generate a test pattern',
        config: {
          numberOfImages: 1,
        },
      });
      return !!testResult.generatedImages && testResult.generatedImages.length > 0;
    } catch (error) {
      console.error('Google Imagen provider is not available:', error);
      return false;
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      // For Google's Imagen, we need to adjust the prompt to specify image dimensions
      let promptWithSize = options.prompt;

      // Add size information to the prompt if provided
      if (options.size) {
        // Map our size enum to dimensions for Google's model
        let dimensions: string;
        switch (options.size) {
          case ImageSize.SMALL:
            dimensions = '256x256';
            break;
          case ImageSize.MEDIUM:
            dimensions = '512x512';
            break;
          case ImageSize.SQUARE_HD:
            dimensions = '1024x1024';
            break;
          case ImageSize.PORTRAIT_HD:
            dimensions = '1024x1792';
            break;
          case ImageSize.LANDSCAPE_HD:
            dimensions = '1792x1024';
            break;
          default:
            dimensions = '1024x1024';
        }
        promptWithSize += ` Size: ${dimensions}.`;
      }

      // Add style information to the prompt if provided
      if (options.style) {
        promptWithSize += ` Style: ${options.style}.`;
      }

      // Add negative prompt if provided
      if (options.negativePrompt) {
        promptWithSize += ` Do not include: ${options.negativePrompt}.`;
      }

      const numberOfImages = Math.min(Math.max(1, options.numberOfImages || 1), 4);
      
      // Call the Imagen 3.0 API
      const response = await this.client.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: promptWithSize,
        config: {
          numberOfImages,
        },
      });
      
      // Process the generated images
      if (!response.generatedImages || response.generatedImages.length === 0) {
        return {
          images: [],
          error: 'No images were generated'
        };
      }
      
      const generatedImages: GeneratedImage[] = [];
      
      for (const genImage of response.generatedImages) {
        if (genImage.image?.imageBytes) {
          // Convert base64 to data URL
          const imageUrl = `data:image/png;base64,${genImage.image.imageBytes}`;
          const generatedImage = this.createGeneratedImage(imageUrl, options);
          generatedImages.push(generatedImage);
        }
      }

      if (generatedImages.length === 0) {
        return {
          images: [],
          error: 'Failed to extract image data from Google Imagen response'
        };
      }

      return { images: generatedImages };
    } catch (error: any) {
      console.error('Error generating image with Google Imagen:', error);
      return {
        images: [],
        error: `Error generating image with Google Imagen: ${error.message || error}`
      };
    }
  }
}