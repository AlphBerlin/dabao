import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

import { BaseImageProvider } from './imageGeneration/BaseImageProvider';
import { OpenAIImageProvider } from './imageGeneration/OpenAIImageProvider';
import { GoogleImageProvider } from './imageGeneration/GoogleImageProvider';
import { StableDiffusionProvider } from './imageGeneration/StableDiffusionProvider';
import { CustomApiProvider } from './imageGeneration/CustomApiProvider';

import { 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider, 
  ProviderConfig 
} from '../types/imageGeneration';

import { TokenCounter } from '../utils/tokenCounter';

// Load environment variables
dotenv.config();

export class ImageGenerationService {
  private providers: Map<ImageProvider, BaseImageProvider> = new Map();
  private tokenCounter: TokenCounter;
  private storage: string;

  constructor() {
    this.tokenCounter = new TokenCounter();
    
    // Initialize default storage location
    const envStorage = process.env.IMAGE_STORAGE_PATH;
    this.storage = envStorage ? path.resolve(envStorage) : path.join(process.cwd(), 'storage', 'images');
    
    // Ensure storage directory exists
    this.ensureStorageDirectory();

    // Initialize providers that have API keys
    this.initializeProviders();
  }
  
  /**
   * Ensure the storage directory exists, create if not
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.storage, { recursive: true });
    } catch (error) {
      console.error('Failed to create image storage directory:', error);
    }
  }

  /**
   * Initialize available providers based on environment variables
   */
  private initializeProviders(): void {
    // OpenAI (DALL-E)
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiProvider = new OpenAIImageProvider({ 
          apiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_IMAGE_MODEL || 'dall-e-3'
        });
        this.providers.set(ImageProvider.OPENAI, openaiProvider);
      } catch (error) {
        console.error('Failed to initialize OpenAI provider:', error);
      }
    }
    
    // Google (Gemini)
    if (process.env.GOOGLE_API_KEY) {
      try {
        const googleProvider = new GoogleImageProvider({
          apiKey: process.env.GOOGLE_API_KEY,
          modelName: process.env.GOOGLE_IMAGE_MODEL || 'gemini-1.5-pro' 
        });
        this.providers.set(ImageProvider.GOOGLE, googleProvider);
      } catch (error) {
        console.error('Failed to initialize Google provider:', error);
      }
    }
    
    // Stable Diffusion via Replicate
    if (process.env.REPLICATE_API_KEY) {
      try {
        const stableDiffusionProvider = new StableDiffusionProvider({
          apiKey: process.env.REPLICATE_API_KEY,
          modelName: process.env.STABLE_DIFFUSION_MODEL
        });
        this.providers.set(ImageProvider.STABLE_DIFFUSION, stableDiffusionProvider);
      } catch (error) {
        console.error('Failed to initialize Stable Diffusion provider:', error);
      }
    }
    
    // Custom API if configured
    if (process.env.CUSTOM_IMAGE_API_ENDPOINT) {
      try {
        const customProvider = new CustomApiProvider({
          endpoint: process.env.CUSTOM_IMAGE_API_ENDPOINT,
          apiKey: process.env.CUSTOM_IMAGE_API_KEY
        });
        this.providers.set(ImageProvider.CUSTOM, customProvider);
      } catch (error) {
        console.error('Failed to initialize Custom API provider:', error);
      }
    }
  }

  /**
   * Add or update a provider
   * @param provider The provider type
   * @param config Provider configuration
   */
  async addProvider(provider: ImageProvider, config: ProviderConfig): Promise<boolean> {
    try {
      let providerInstance: BaseImageProvider;

      switch (provider) {
        case ImageProvider.OPENAI:
          providerInstance = new OpenAIImageProvider({ 
            apiKey: config.apiKey!,
            modelName: config.modelName
          });
          break;
        case ImageProvider.GOOGLE:
          providerInstance = new GoogleImageProvider({
            apiKey: config.apiKey!,
            modelName: config.modelName
          });
          break;
        case ImageProvider.STABLE_DIFFUSION:
          providerInstance = new StableDiffusionProvider({
            apiKey: config.apiKey!,
            modelName: config.modelName
          });
          break;
        case ImageProvider.CUSTOM:
          if (!config.endpoint) {
            throw new Error('Endpoint is required for custom provider');
          }
          providerInstance = new CustomApiProvider({
            endpoint: config.endpoint,
            apiKey: config.apiKey
          });
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Verify that the provider is available
      const isAvailable = await providerInstance.isAvailable();
      if (!isAvailable) {
        throw new Error(`Provider ${provider} is not available with the given configuration`);
      }

      this.providers.set(provider, providerInstance);
      return true;
    } catch (error) {
      console.error(`Failed to add provider ${provider}:`, error);
      return false;
    }
  }

  /**
   * List all available providers
   */
  async listProviders(): Promise<ImageProvider[]> {
    const availableProviders: ImageProvider[] = [];
    
    for (const [provider, instance] of this.providers.entries()) {
      try {
        const isAvailable = await instance.isAvailable();
        if (isAvailable) {
          availableProviders.push(provider);
        }
      } catch (error) {
        console.error(`Error checking provider ${provider} availability:`, error);
      }
    }
    
    return availableProviders;
  }

  /**
   * Generate an image using the specified or default provider
   */
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    // Check if a specific provider was requested
    const requestedProvider = options.provider;
    
    // If a specific provider was requested, check if it's available
    if (requestedProvider) {
      const provider = this.providers.get(requestedProvider);
      if (!provider) {
        return { 
          images: [],
          error: `Provider ${requestedProvider} is not available or not configured` 
        };
      }
      
      // Use the specified provider
      return this.generateWithProvider(provider, options);
    }
    
    // No specific provider requested, try all available providers in priority order
    const preferredOrder: ImageProvider[] = [
      ImageProvider.OPENAI,     // Try OpenAI first (usually best quality)
      ImageProvider.GOOGLE,     // Try Google second
      ImageProvider.STABLE_DIFFUSION, // Then Stable Diffusion
      ImageProvider.CUSTOM      // Finally try custom provider
    ];
    
    // Try providers in order until one works
    for (const providerType of preferredOrder) {
      const provider = this.providers.get(providerType);
      if (provider) {
        try {
          const isAvailable = await provider.isAvailable();
          if (isAvailable) {
            const result = await this.generateWithProvider(provider, options);
            if (result.images && result.images.length > 0) {
              return result;
            }
          }
        } catch (error) {
          console.error(`Error using provider ${providerType}:`, error);
        }
      }
    }
    
    // If we get here, all providers failed
    return {
      images: [],
      error: 'No suitable image generation provider is available'
    };
  }
  
  /**
   * Generate image with the specified provider
   */
  private async generateWithProvider(
    provider: BaseImageProvider, 
    options: ImageGenerationOptions
  ): Promise<ImageGenerationResponse> {
    try {
      const result = await provider.generateImage(options);
      
      // If successful, save the images to local storage
      if (result.images && result.images.length > 0) {
        // Save images in parallel
        await Promise.all(result.images.map(async image => {
          try {
            // Only try to download and save if it's a remote URL
            if (image.url.startsWith('http')) {
              const localPath = await this.downloadAndSaveImage(image.url);
              if (localPath) {
                // Update the URL to the local path
                image.url = localPath;
              }
            }
          } catch (error) {
            console.error('Error saving image:', error);
            // Continue with the original URL if there's an error
          }
        }));
      }
      
      return result;
    } catch (error: any) {
      console.error('Error generating image:', error);
      return {
        images: [],
        error: `Image generation failed: ${error.message || error}`
      };
    }
  }
  
  /**
   * Download and save an image to local storage
   * @param url The URL of the image to download
   * @returns The local path to the saved image
   */
  private async downloadAndSaveImage(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Generate a unique ID and determine the image format
      const id = nanoid();
      const ext = this.getImageExtension(url, buffer);
      const filename = `${id}.${ext}`;
      const filePath = path.join(this.storage, filename);
      
      // Optimize the image with sharp
      const optimizedImage = await sharp(buffer)
        .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
      
      await fs.writeFile(filePath, optimizedImage);
      
      // Return a URL usable by web clients
      // In a real app, you might have an API endpoint that serves these files
      return `/api/images/${filename}`;
    } catch (error) {
      console.error('Error saving image:', error);
      return null;
    }
  }
  
  /**
   * Determine the image extension from URL or buffer
   */
  private getImageExtension(url: string, buffer?: Buffer): string {
    // Try to get extension from URL first
    const urlExt = url.split('.').pop()?.toLowerCase();
    if (urlExt && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(urlExt)) {
      return urlExt;
    }
    
    // Default to PNG if can't determine
    return 'png';
  }
  
  /**
   * Estimate the token count for an image generation prompt
   */
  async estimateTokenCount(options: ImageGenerationOptions): Promise<number> {
    // Use the requested provider if specified, otherwise use any available provider
    const provider = options.provider 
      ? this.providers.get(options.provider)
      : this.providers.values().next().value;
    
    if (!provider) {
      // Use the TokenCounter utility as a fallback
      const promptText = options.prompt + (options.negativePrompt ? ' ' + options.negativePrompt : '');
      return await this.tokenCounter.countTokens(promptText);
    }
    
    return provider.estimateTokenCount(options);
  }
}