import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
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
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  
  constructor(config: { apiKey: string, modelName?: string }) {
    super(ImageProvider.GOOGLE, config);
    
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }
    
    this.client = new GoogleGenerativeAI(config.apiKey);
    const modelName = config.modelName || 'gemini-1.5-pro';
    this.model = this.client.getGenerativeModel({ model: modelName });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple test to check if the API is available
      // Just generate a tiny image to test connectivity
      const testResult = await this.model.generateContent('Generate a small image of a test pattern');
      return testResult.response.promptFeedback?.blockReason ? false : true;
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

      const numberOfImages = options.numberOfImages || 1;
      const generatedImages: GeneratedImage[] = [];
      
      // Generate multiple images if requested
      const imagePromises = Array(numberOfImages).fill(0).map(async (_, index) => {
        try {
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptWithSize }] }],
            generationConfig: {
              responseMimeType: 'image/png',
            },
          });
          
          const response = result.response;
          
          // Check if the content contains images
          if (response.candidates && 
              response.candidates[0] && 
              response.candidates[0].content && 
              response.candidates[0].content.parts) {
                
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                // This is a base64 encoded image, we need to convert it to a URL
                // For a production app, you would likely save this to storage
                // and return a URL to that storage
                const base64Image = part.inlineData.data;
                
                // For testing purposes, we'll return a data URL
                // In a real app, you'd upload this to a storage service
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64Image}`;
                
                return this.createGeneratedImage(imageUrl, options);
              }
            }
          }
          return null;
        } catch (error) {
          console.error(`Error generating image ${index + 1} with Google:`, error);
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
          error: 'Failed to generate images with Google'
        };
      }

      return { images: generatedImages };
    } catch (error: any) {
      console.error('Error generating image with Google:', error);
      return {
        images: [],
        error: `Error generating image with Google: ${error.message || error}`
      };
    }
  }
}