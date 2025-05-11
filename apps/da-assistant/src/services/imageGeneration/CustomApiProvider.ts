import axios, { AxiosInstance } from 'axios';
import { 
  GeneratedImage, 
  ImageGenerationOptions, 
  ImageGenerationResponse, 
  ImageProvider 
} from '../../types/imageGeneration';
import { BaseImageProvider } from './BaseImageProvider';

export class CustomApiProvider extends BaseImageProvider {
  private client: AxiosInstance;
  
  constructor(config: { apiKey?: string, endpoint: string }) {
    super(ImageProvider.CUSTOM, config);
    
    if (!config.endpoint) {
      throw new Error('API endpoint is required for Custom API provider');
    }
    
    this.client = axios.create({
      baseURL: config.endpoint,
      headers: config.apiKey ? {
        'Authorization': `Bearer ${config.apiKey}`
      } : {}
    });
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple ping to the API endpoint
      // Most APIs will have some sort of health check or models endpoint
      await this.client.get('/');
      return true;
    } catch (error) {
      // Try alternate paths that are common for API health checks
      try {
        await this.client.get('/health');
        return true;
      } catch {
        try {
          await this.client.get('/status');
          return true;
        } catch {
          console.error('Custom API provider is not available:', error);
          return false;
        }
      }
    }
  }

  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResponse> {
    try {
      // Use the custom API endpoint with the standard options format
      // If the API has different requirements, the user needs to provide
      // a custom mapping in the options.customApiOptions field
      const requestBody: any = {
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        // Map our generic size to width/height if needed
        size: options.size,
        style: options.style,
        n: options.numberOfImages || 1,
      };
      
      // Use custom endpoint from options if provided
      const endpoint = options.customApiEndpoint || '/generate';
      
      // If a custom API key is provided in the options, use it
      let headers = {};
      if (options.customApiKey) {
        headers = {
          'Authorization': `Bearer ${options.customApiKey}`
        };
      }
      
      const response = await this.client.post(endpoint, requestBody, { headers });
      
      // The response format will vary by API
      // We'll try to handle common formats and provide guidance for custom adapters
      if (response.data) {
        const data = response.data;
        
        // Common response formats:
        // 1. { images: [...] }
        // 2. { data: [...] }
        // 3. { urls: [...] }
        // 4. { results: [...] }
        // 5. [...] (direct array)
        
        let imageUrls: string[] = [];
        
        if (Array.isArray(data)) {
          // Direct array of URLs or objects
          imageUrls = data.map(item => typeof item === 'string' ? item : item.url || item.image || item.path || '');
        } else if (data.images && Array.isArray(data.images)) {
          imageUrls = data.images.map(item => typeof item === 'string' ? item : item.url || '');
        } else if (data.data && Array.isArray(data.data)) {
          imageUrls = data.data.map(item => typeof item === 'string' ? item : item.url || '');
        } else if (data.urls && Array.isArray(data.urls)) {
          imageUrls = data.urls;
        } else if (data.results && Array.isArray(data.results)) {
          imageUrls = data.results.map(item => typeof item === 'string' ? item : item.url || '');
        } else if (data.output && Array.isArray(data.output)) {
          imageUrls = data.output;
        } else if (data.url) {
          // Single image response
          imageUrls = [data.url];
        } else if (data.image) {
          imageUrls = [data.image];
        }
        
        // Filter out empty URLs
        imageUrls = imageUrls.filter(url => !!url);
        
        if (imageUrls.length > 0) {
          const generatedImages: GeneratedImage[] = imageUrls.map(url => 
            this.createGeneratedImage(url, options)
          );
          
          return { images: generatedImages };
        }
      }
      
      return {
        images: [],
        error: 'Could not extract image URLs from the API response'
      };
    } catch (error: any) {
      console.error('Error generating image with Custom API:', error);
      return {
        images: [],
        error: `Error generating image with Custom API: ${error.message || error}`
      };
    }
  }
}