/**
 * Telegram Bot API service
 * Handles communication with the Telegram Bot API
 */

interface TelegramSendMessageParams {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: any;
  disable_web_page_preview?: boolean;
}

interface TelegramSendPhotoParams {
  chat_id: string | number;
  photo: string; // URL or file_id
  caption?: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
  reply_markup?: any;
}

interface TelegramGetChatMemberParams {
  chat_id: string | number;
  user_id?: number;
}

interface TelegramInlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export class TelegramService {
  private botToken: string;
  private apiBaseUrl: string = 'https://api.telegram.org/bot';
  
  constructor(botToken: string) {
    if (!botToken) {
      throw new Error('Telegram bot token is required');
    }
    this.botToken = botToken;
  }
  
  /**
   * Sends a text message to a Telegram chat
   */
  async sendMessage(params: TelegramSendMessageParams): Promise<any> {
    return this.makeRequest('sendMessage', params);
  }
  
  /**
   * Sends an image with optional caption to a Telegram chat
   */
  async sendPhoto(params: TelegramSendPhotoParams): Promise<any> {
    return this.makeRequest('sendPhoto', params);
  }
  
  /**
   * Gets information about the bot
   */
  async getMe(): Promise<any> {
    return this.makeRequest('getMe', {});
  }
  
  /**
   * Gets information about a chat member
   * Can be used to resolve username to chat_id
   * @param chat - Can be username (with @) or chat_id
   * @param userId - Optional user_id
   */
  async getChatMember(chat: string | number, userId?: number): Promise<any> {
    try {
      // For username lookup, we can't directly use getChat with @username
      // Need to use getUpdates to find users who have messaged the bot
      if (typeof chat === 'string' && chat.startsWith('@')) {
        const username = chat.slice(1); // Remove @ symbol
        
        // Get recent updates to find the user by username
        const updates = await this.makeRequest('getUpdates', { 
          offset: -100, // Get last 100 updates
          limit: 100 
        });
        
        if (!updates?.result) {
          throw new Error('Could not fetch bot updates');
        }
        
        // Find the user in updates by their username
        for (const update of updates.result) {
          const from = update.message?.from || update.callback_query?.from;
          
          if (from && from.username && from.username.toLowerCase() === username.toLowerCase()) {
            // We found the user, return their info
            return {
              ok: true,
              result: {
                user: from,
                id: from.id
              }
            };
          }
        }
        
        // User not found in updates
        throw new Error(`Username @${username} not found in recent interactions with bot`);
      }
      
      // For direct chat_id with user_id
      if (userId) {
        return this.makeRequest('getChatMember', {
          chat_id: chat,
          user_id: userId
        });
      }
      
      // Just get chat info for direct chat_id
      return this.makeRequest('getChat', { chat_id: chat });
    } catch (error) {
      console.error('Error getting chat member info:', error);
      throw error;
    }
  }
  
  /**
   * Creates inline keyboard markup for interactive buttons
   */
  createInlineKeyboard(buttons: TelegramInlineKeyboardButton[][]): any {
    return {
      inline_keyboard: buttons
    };
  }
  
  /**
   * Replaces placeholders in a message template with actual values
   */
  replacePlaceholders(template: string, data: Record<string, any>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }
  
  /**
   * Makes a request to the Telegram Bot API
   */
  private async makeRequest(method: string, params: any): Promise<any> {
    const url = `${this.apiBaseUrl}${this.botToken}/${method}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in Telegram API request to ${method}:`, error);
      throw error;
    }
  }
}