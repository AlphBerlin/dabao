/**
 * Type definitions for the Image Generation Service
 */

export enum ImageProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  STABLE_DIFFUSION = 'stable-diffusion',
  CUSTOM = 'custom'
}

export enum ImageSize {
  SMALL = '256x256',
  MEDIUM = '512x512',
  LARGE = '1024x1024',
  SQUARE_HD = '1024x1024',
  PORTRAIT_HD = '1024x1792', 
  LANDSCAPE_HD = '1792x1024'
}

export enum ImageStyle {
  NATURAL = 'natural',
  VIVID = 'vivid',
  ANIME = 'anime', 
  PHOTOGRAPHIC = 'photographic',
  DIGITAL_ART = 'digital-art',
  CINEMATIC = 'cinematic',
}

export enum ImageQuality {
  STANDARD = 'standard',
  HD = 'hd'
}

export interface ImageGenerationOptions {
  provider?: ImageProvider;
  prompt: string;
  negativePrompt?: string;
  size?: ImageSize;
  style?: ImageStyle;
  quality?: ImageQuality;
  numberOfImages?: number;
  userId?: string;
  sessionId?: string;
  modelName?: string;
  customApiEndpoint?: string;
  customApiKey?: string;
  organizationId?: string;   // Organization context
  projectId?: string;        // Project context
}

export interface GeneratedImage {
  url: string;
  provider: ImageProvider;
  prompt: string;
  size: string;
  style?: string;
  createdAt: Date;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  error?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  endpoint?: string;
  modelName?: string;
  options?: Record<string, any>;
}