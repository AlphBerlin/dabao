import * as tiktoken from 'tiktoken';

/**
 * Utility class for counting tokens in text
 * Used to manage context windows and summarization thresholds
 */
export class TokenCounter {
  private encoder: any;

  constructor() {
    // Initialize the encoder when needed
    try {
      // Use cl100k_base encoding which is used for many modern LLMs
      this.encoder = tiktoken.getEncoding("cl100k_base");
    } catch (error) {
      console.warn('TokenCounter: Error initializing tiktoken encoder, using fallback method', error);
      this.encoder = null;
    }
  }

  /**
   * Count the tokens in a given text
   * 
   * @param text - The text to count tokens for
   * @returns The number of tokens
   */
  async countTokens(text: string): Promise<number> {
    // If encoder is available, use it
    if (this.encoder) {
      const tokens = this.encoder.encode(text);
      return tokens.length;
    }

    // Fallback method: roughly 4 characters per token
    // This is not accurate but serves as a fallback when the encoder is unavailable
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if text exceeds a token limit
   * 
   * @param text - The text to check
   * @param limit - The token limit
   * @returns Whether the text exceeds the limit
   */
  async exceedsLimit(text: string, limit: number): Promise<boolean> {
    const tokenCount = await this.countTokens(text);
    return tokenCount > limit;
  }

  /**
   * Truncate text to fit within a token limit
   * 
   * @param text - The text to truncate
   * @param limit - The token limit
   * @returns Truncated text
   */
  async truncateToFit(text: string, limit: number): Promise<string> {
    if (this.encoder) {
      const tokens = this.encoder.encode(text);
      if (tokens.length <= limit) {
        return text;
      }
      
      const truncatedTokens = tokens.slice(0, limit);
      return this.encoder.decode(truncatedTokens);
    }
    
    // Fallback: roughly truncate based on character count
    const estimatedCharLimit = limit * 4;
    if (text.length <= estimatedCharLimit) {
      return text;
    }
    
    return text.substring(0, estimatedCharLimit);
  }
}