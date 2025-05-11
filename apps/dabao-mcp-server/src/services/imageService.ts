import * as fs from 'node:fs';
import * as path from 'path';
import * as os from 'os';
import { prisma } from '../lib/prisma.js';
import { GoogleGenAI } from "@google/genai";

/**
 * Functions for generating and managing images using AI
 */
export const imageService = {
  /**
   * Generate images using Google's Imagen 3 API
   */
  async generateImages(
    projectId: string,
    prompt: string,
    options?: {
      numberOfImages?: number;
      category?: string;
      customerId?: string;
      metadata?: any;
    }
  ) {
    const {
      numberOfImages = 1,
      category = 'general',
      customerId,
      metadata,
    } = options || {};

    // Validate API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable not set');
    }

    try {
      // Get or create image generation settings
      const settings = await this.getImageSettings(projectId);

      // Initialize Google GenAI client
      const ai = new GoogleGenAI({ apiKey });

      // Generate images using Imagen 3
      console.log(`Generating ${numberOfImages} images with prompt: "${prompt}"`);
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: {
          numberOfImages: Math.min(Math.max(1, numberOfImages), 4), // Limit between 1-4
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No images were generated');
      }

      // Get storage directory for saving images
      const baseDir = this.getImageStorageDir();
      const categoryDir = path.join(baseDir, category);

      // Ensure directory exists
      await this.ensureDirectoryExists(categoryDir);
      console.log(`Saving images to ${categoryDir}`);

      // Get timestamp for unique filenames
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedPrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);

      // Process and save each generated image
      const savedImages = [];
      let idx = 1;

      for (const generatedImage of response.generatedImages) {
        if (!generatedImage.image?.imageBytes) {
          console.warn(`Image ${idx} has no image data, skipping`);
          continue;
        }

        // Decode base64 image data
        const imgBytes = generatedImage.image.imageBytes;
        const buffer = Buffer.from(imgBytes, "base64");
        
        // Create filename with timestamp and sanitized prompt
        const filename = `${sanitizedPrompt}-${timestamp}-${idx}.png`;
        const filePath = path.join(categoryDir, filename);
        
        // Save image to disk
        await fs.promises.writeFile(filePath, buffer);
        console.log(`Generated image saved at: ${filePath}`);
        
        // Create image record in database
        const image = await prisma.generatedImage.create({
          data: {
            projectId,
            prompt,
            filePath: filePath,
            category,
            customerId,
            metadata: metadata || {},
            createdAt: new Date(),
          },
        });

        // Track usage
        await this.trackImageGeneration(projectId, {
          prompt,
          imageId: image.id,
          customerId,
        });

        savedImages.push(image);
        idx++;
      }

      // Return information about the saved images
      return {
        images: savedImages,
        storageDir: categoryDir,
      };
    } catch (error) {
      console.error('Error generating images:', error);
      throw error;
    }
  },

  /**
   * Get image generation settings for a project
   */
  async getImageSettings(projectId: string) {
    // Find existing settings or create default
    let settings = await prisma.imageGenerationSettings.findUnique({
      where: { projectId },
    });

    if (!settings) {
      // Create default settings
      settings = await prisma.imageGenerationSettings.create({
        data: {
          projectId,
          defaultModel: 'imagen-3.0-generate-002',
          maxImagesPerRequest: 4,
          storageLocation: this.getImageStorageDir(),
          limitPerDay: 50,
          limitPerUser: 20,
        },
      });
    }

    return settings;
  },

  /**
   * Update image generation settings for a project
   */
  async updateImageSettings(
    projectId: string,
    data: {
      defaultModel?: string;
      maxImagesPerRequest?: number;
      storageLocation?: string;
      limitPerDay?: number;
      limitPerUser?: number;
    }
  ) {
    return prisma.imageGenerationSettings.upsert({
      where: { projectId },
      update: data,
      create: {
        projectId,
        defaultModel: data.defaultModel || 'imagen-3.0-generate-002',
        maxImagesPerRequest: data.maxImagesPerRequest || 4,
        storageLocation: data.storageLocation || this.getImageStorageDir(),
        limitPerDay: data.limitPerDay || 50,
        limitPerUser: data.limitPerUser || 20,
      },
    });
  },

  /**
   * Get images generated for a project
   */
  async getProjectImages(
    projectId: string,
    options?: {
      category?: string;
      customerId?: string;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const {
      category,
      customerId,
      limit = 20,
      offset = 0,
      startDate,
      endDate,
    } = options || {};

    // Build query filters
    const where: any = { projectId };

    if (category) {
      where.category = category;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get images with pagination
    const images = await prisma.generatedImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.generatedImage.count({ where });

    return {
      images,
      totalCount,
      limit,
      offset,
      hasMore: offset + images.length < totalCount,
    };
  },

  /**
   * Get a single generated image by ID
   */
  async getImageById(imageId: string) {
    return prisma.generatedImage.findUnique({
      where: { id: imageId },
      include: {
        project: true,
        customer: true,
      },
    });
  },

  /**
   * Delete a generated image
   */
  async deleteImage(imageId: string) {
    const image = await prisma.generatedImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Delete the physical file if it exists
    if (image.filePath && fs.existsSync(image.filePath)) {
      await fs.promises.unlink(image.filePath);
    }

    // Delete database record
    return prisma.generatedImage.delete({
      where: { id: imageId },
    });
  },

  /**
   * Track image generation usage
   */
  async trackImageGeneration(
    projectId: string,
    data: {
      prompt: string;
      imageId: string;
      customerId?: string;
      metadata?: any;
    }
  ) {
    return prisma.imageGeneration.create({
      data: {
        projectId,
        generatedImageId: data.imageId,
        prompt: data.prompt,
        customerId: data.customerId,
        metadata: data.metadata || {},
        timestamp: new Date(),
      },
    });
  },

  /**
   * Get image generation analytics for a project
   */
  async getImageAnalytics(
    projectId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      includeHistogram?: boolean;
    }
  ) {
    const now = new Date();
    const startDate = options?.startDate || new Date(now.setMonth(now.getMonth() - 1));
    const endDate = options?.endDate || new Date();

    // Count total images
    const totalImages = await prisma.generatedImage.count({
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Count unique users
    const uniqueUsers = await prisma.generatedImage.groupBy({
      by: ['customerId'],
      where: {
        projectId,
        customerId: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: true,
    });

    // Get most active users
    const activeUsers = await prisma.generatedImage.groupBy({
      by: ['customerId'],
      where: {
        projectId,
        customerId: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Get popular categories
    const categories = await prisma.generatedImage.groupBy({
      by: ['category'],
      where: {
        projectId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Generate histogram if requested
    let histogram = [];
    if (options?.includeHistogram) {
      // Example: Get daily counts
      const dailyData = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM generated_image
        WHERE project_id = ${projectId}
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      histogram = dailyData as { date: string; count: number }[];
    }

    // Return analytics
    return {
      period: { startDate, endDate },
      totalImages,
      uniqueUsers: uniqueUsers.length,
      topUsers: activeUsers.map(user => ({
        customerId: user.customerId,
        count: user._count.id,
      })),
      categories: categories.map(cat => ({
        name: cat.category,
        count: cat._count.id,
      })),
      ...(options?.includeHistogram ? { histogram } : {}),
    };
  },

  /**
   * Helper function to get image storage directory
   */
  getImageStorageDir(): string {
    const desktopPath = this.getUserDesktopPath();
    const storageDir = path.join(desktopPath, 'AI-Generated-Images');
    return storageDir;
  },

  /**
   * Helper function to get user desktop path
   */
  getUserDesktopPath(): string {
    const userHomeDir = os.homedir();
    
    if (process.platform === 'win32') {
      return path.join(process.env.USERPROFILE || userHomeDir, 'Desktop');
    } else if (process.platform === 'darwin') {
      return path.join(userHomeDir, 'Desktop');
    } else {
      // Linux and others
      const xdgConfig = path.join(userHomeDir, '.config', 'user-dirs.dirs');
      if (fs.existsSync(xdgConfig)) {
        try {
          const config = fs.readFileSync(xdgConfig, 'utf-8');
          const match = config.match(/XDG_DESKTOP_DIR="(.+)"/);
          if (match) {
            return match[1].replace('$HOME', userHomeDir);
          }
        } catch (error) {
          console.warn('Could not read XDG config:', error);
        }
      }
      return path.join(userHomeDir, 'Desktop');
    }
  },

  /**
   * Helper function to ensure directory exists
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
  },
};