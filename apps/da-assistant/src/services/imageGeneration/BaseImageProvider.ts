import { 
  GeneratedImage, 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider,
  ProviderConfig
} from '../../types/imageGeneration';

/**
 * Abstract base class for all image generation providers
 */
export abstract class BaseImageProvider {
  protected config: ProviderConfig;
  protected name: ImageProvider;

  constructor(providerName: ImageProvider, config: ProviderConfig) {
    this.name = providerName;
    this.config = config;
  }

  /**
   * Generate image(s) based on provided options
   * @param options Parameters for image generation
   */
  abstract generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse>;

  /**
   * Check if the provider is properly configured and available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Get the estimated token count for an image generation request
   * @param options Parameters for image generation
   */
  estimateTokenCount(options: ImageGenerationOptions): number {
    // Base token count for the prompt (rough estimate)
    const promptTokens = options.prompt.length / 4;
    
    // Additional tokens for negative prompt if provided
    const negativePromptTokens = options.negativePrompt ? options.negativePrompt.length / 4 : 0;
    
    // Default to 50 tokens for the API call overhead
    return Math.ceil(promptTokens + negativePromptTokens + 50);
  }

  /**
   * Create a GeneratedImage object from provider-specific response
   * @param url The URL of the generated image
   * @param options The options used to generate the image
   */
  protected createGeneratedImage(url: string, options: ImageGenerationOptions): GeneratedImage {
    return {
      url,
      provider: this.name,
      prompt: options.prompt,
      size: options.size || 'default',
      style: options.style,
      createdAt: new Date()
    };
  }
}