import dotenv from 'dotenv';
import path from 'path';

/**
 * Service for managing application configuration
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: Record<string, string | undefined> = {};
  
  private constructor() {
    // Load environment variables from .env file
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    
    // Add environment variables to the config
    this.config = { ...process.env };
  }
  
  /**
   * Get the singleton instance of the ConfigService
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * Get a configuration value
   * 
   * @param key - The key of the configuration value to get
   * @param defaultValue - Default value to return if the key is not found
   * @returns The configuration value or the default value
   */
  public get(key: string, defaultValue?: string): string {
    const value = this.config[key];
    return value !== undefined ? value : (defaultValue || '');
  }
  
  /**
   * Get the MCP server address
   * 
   * @returns The MCP server address
   */
  public getMCPServerAddress(): string {
    return this.get('MCP_SERVER_ADDRESS', 'localhost:50051');
  }
  
  /**
   * Get the server port
   * 
   * @returns The server port
   */
  public getServerPort(): number {
    return parseInt(this.get('PORT', '3100'), 10);
  }
  
  /**
   * Get the server environment (development, production, etc.)
   * 
   * @returns The server environment
   */
  public getNodeEnv(): string {
    return this.get('NODE_ENV', 'development');
  }
  
  /**
   * Check if the application is running in development mode
   * 
   * @returns Whether the application is running in development mode
   */
  public isDevelopment(): boolean {
    return this.getNodeEnv() === 'development';
  }
  
  /**
   * Check if the application is running in production mode
   * 
   * @returns Whether the application is running in production mode
   */
  public isProduction(): boolean {
    return this.getNodeEnv() === 'production';
  }
}