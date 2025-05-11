import Replicate from 'replicate';
import { 
  GeneratedImage, 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider,
  ImageSize
} from '../../types/imageGeneration';
import { BaseImageProvider } from './BaseImageProvider';

export class StableDiffusionProvider extends BaseImageProvider {
  private client: Replicate;
  
  constructor(config: { apiKey: string, modelName?: string }) {
    super(ImageProvider.STABLE_DIFFUSION, config);
    
    if (!config.apiKey) {
      throw new Error('Replicate API key is required for Stable Diffusion');
    }
    
    this.client = new Replicate({
      auth: config.apiKey
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if the API is available by listing collections
      // This avoids the issue with the get method requiring two arguments
      await this.client.collections.list();
      return true;
    } catch (error) {
      console.error('Stable Diffusion provider is not available:', error);
      return false;
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      // Default model if not specified - using full model path in correct format
      const modelPath = options.modelName || 'stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316';
      
      // Convert our dimensions to width/height
      let width = 1024;
      let height = 1024;
      
      if (options.size) {
        switch (options.size) {
          case ImageSize.SMALL:
            width = 256;
            height = 256;
            break;
          case ImageSize.MEDIUM:
            width = 512;
            height = 512;
            break;
          case ImageSize.SQUARE_HD:
            width = 1024;
            height = 1024;
            break;
          case ImageSize.PORTRAIT_HD:
            width = 1024;
            height = 1792;
            break;
          case ImageSize.LANDSCAPE_HD:
            width = 1792;
            height = 1024;
            break;
        }
      }
      
      const numberOfImages = options.numberOfImages || 1;
      
      // Use Replicate API to generate images
      // Use the Replicate run method with the properly formatted model string
      const output = await this.client.run(modelPath as any, {
        input: {
          prompt: options.prompt,
          negative_prompt: options.negativePrompt || '',
          width,
          height,
          num_outputs: numberOfImages,
          scheduler: "K_EULER",
          num_inference_steps: 50,
          guidance_scale: 7.5,
          refine: "base_image_refiner"
        }
      });
      
      // Replicate returns an array of image URLs
      if (Array.isArray(output)) {
        const generatedImages: GeneratedImage[] = output.map(url => 
          this.createGeneratedImage(url as string, options)
        );
        
        return { images: generatedImages };
      } else {
        return {
          images: [],
          error: 'Unexpected response format from Stable Diffusion'
        };
      }
    } catch (error: any) {
      console.error('Error generating image with Stable Diffusion:', error);
      return {
        images: [],
        error: `Error generating image with Stable Diffusion: ${error.message || error}`
      };
    }
  }
}