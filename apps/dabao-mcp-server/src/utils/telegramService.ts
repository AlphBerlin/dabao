/**
 * Telegram service utility for sending messages
 * Handles communication with the Telegram Bot API
 */

import fetch from 'node-fetch';
import { TELEGRAM_CONFIG } from './config';
import { logger, logAuditEvent } from '../logging/logger';
import { TelegramMessageRequest } from '../types/api';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { withRecovery } from '../middleware/errorHandler';

/**
 * Send a message to a Telegram chat
 * @param request The message request
 * @param userId The ID of the user sending the message
 * @returns Message ID and success status
 */
export async function sendMessage(request: TelegramMessageRequest, userId: string): Promise<{
  success: boolean;
  messageId: string | null;
  error?: string;
}> {
  // Validate bot token exists
  if (!TELEGRAM_CONFIG.botToken) {
    logger.error('Telegram bot token not configured');
    throw new ValidationError('Telegram bot token not configured');
  }

  // Validate required parameters
  if (!request.chatId) {
    throw new ValidationError('Chat ID is required');
  }

  if (!request.text) {
    throw new ValidationError('Message text is required');
  }

  try {
    // Build the request URL
    const baseUrl = TELEGRAM_CONFIG.apiUrl;
    const method = 'sendMessage';
    const url = `${baseUrl}/bot${TELEGRAM_CONFIG.botToken}/${method}`;

    // Build the request body
    const body = {
      chat_id: request.chatId,
      text: request.text,
      parse_mode: request.useMarkdown ? 'MarkdownV2' : undefined,
      disable_notification: request.silent,
      reply_to_message_id: request.replyToMessageId
    };

    // Send the request with retry functionality
    const response = await withRecovery(async () => {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Telegram API error: ${errorData.description || res.statusText}`);
      }

      return await res.json();
    }, 3, 1000); // 3 retries, 1 second delay

    // Log the success
    logAuditEvent(userId, 'telegram_send', 'message', 'success', {
      chatId: request.chatId,
      messageId: response.result?.message_id,
    });

    return {
      success: true,
      messageId: response.result?.message_id?.toString() || null,
    };
  } catch (error) {
    // Log the error
    logger.error('Error sending Telegram message', {
      error: error instanceof Error ? error.message : String(error),
      chatId: request.chatId,
      userId,
    });

    // Audit the failure
    logAuditEvent(userId, 'telegram_send', 'message', 'failed', {
      chatId: request.chatId,
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      messageId: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Send a photo to a Telegram chat
 * @param chatId The chat ID
 * @param photoUrl URL of the photo to send
 * @param caption Optional caption for the photo
 * @param userId The ID of the user sending the photo
 * @returns Success status and message ID
 */
export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string,
  userId?: string
): Promise<{
  success: boolean;
  messageId: string | null;
}> {
  try {
    // Validate bot token exists
    if (!TELEGRAM_CONFIG.botToken) {
      throw new ValidationError('Telegram bot token not configured');
    }

    // Build the request URL
    const baseUrl = TELEGRAM_CONFIG.apiUrl;
    const method = 'sendPhoto';
    const url = `${baseUrl}/bot${TELEGRAM_CONFIG.botToken}/${method}`;

    // Build the request body
    const body = {
      chat_id: chatId,
      photo: photoUrl,
      caption: caption,
    };

    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }

    const data = await response.json();

    // Log if we have a user ID
    if (userId) {
      logAuditEvent(userId, 'telegram_send', 'photo', 'success', {
        chatId,
        messageId: data.result?.message_id,
      });
    }

    return {
      success: true,
      messageId: data.result?.message_id?.toString() || null,
    };
  } catch (error) {
    logger.error('Error sending Telegram photo', {
      error: error instanceof Error ? error.message : String(error),
      chatId,
      photoUrl,
      userId,
    });

    return {
      success: false,
      messageId: null,
    };
  }
}

/**
 * Get information about a Telegram chat
 * @param chatId The chat ID to get information about
 * @returns Chat information
 */
export async function getChatInfo(chatId: string): Promise<any> {
  try {
    // Validate bot token exists
    if (!TELEGRAM_CONFIG.botToken) {
      throw new ValidationError('Telegram bot token not configured');
    }

    // Build the request URL
    const baseUrl = TELEGRAM_CONFIG.apiUrl;
    const method = 'getChat';
    const url = `${baseUrl}/bot${TELEGRAM_CONFIG.botToken}/${method}`;

    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat_id: chatId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 404 || errorData.description?.includes('chat not found')) {
        throw new NotFoundError(`Chat ${chatId}`);
      }
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    logger.error('Error getting chat info', {
      error: error instanceof Error ? error.message : String(error),
      chatId,
    });
    throw error;
  }
}

/**
 * Send a media group (album) to a Telegram chat
 * @param chatId The chat ID
 * @param mediaUrls Array of media URLs
 * @param userId The ID of the user sending the media
 * @returns Success status
 */
export async function sendMediaGroup(
  chatId: string,
  mediaUrls: string[],
  userId: string
): Promise<{
  success: boolean;
}> {
  try {
    // Validate bot token exists
    if (!TELEGRAM_CONFIG.botToken) {
      throw new ValidationError('Telegram bot token not configured');
    }

    if (!mediaUrls.length) {
      throw new ValidationError('At least one media URL is required');
    }

    // Build the request URL
    const baseUrl = TELEGRAM_CONFIG.apiUrl;
    const method = 'sendMediaGroup';
    const url = `${baseUrl}/bot${TELEGRAM_CONFIG.botToken}/${method}`;

    // Build the media array
    const media = mediaUrls.map((url, index) => {
      // Determine media type based on file extension
      const fileExtension = url.split('.').pop()?.toLowerCase();
      let type = 'photo'; // Default to photo

      if (fileExtension) {
        if (['mp4', 'avi', 'mov', 'mkv'].includes(fileExtension)) {
          type = 'video';
        } else if (['mp3', 'ogg', 'wav'].includes(fileExtension)) {
          type = 'audio';
        } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension)) {
          type = 'document';
        }
      }

      return {
        type,
        media: url,
      };
    });

    // Build the request body
    const body = {
      chat_id: chatId,
      media,
    };

    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`);
    }

    logAuditEvent(userId, 'telegram_send', 'media_group', 'success', {
      chatId,
      mediaCount: mediaUrls.length,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending media group', {
      error: error instanceof Error ? error.message : String(error),
      chatId,
      userId,
    });

    logAuditEvent(userId, 'telegram_send', 'media_group', 'failed', {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });

    return { success: false };
  }
}

// Export the Telegram service functions
export default {
  sendMessage,
  sendPhoto,
  getChatInfo,
  sendMediaGroup,
};