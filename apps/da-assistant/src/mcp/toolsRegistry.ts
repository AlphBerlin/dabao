import { imageGenerationTool } from './tools/imageGenerationTool';

/**
 * Registry of all MCP tools available in the system
 */
export const toolsRegistry = {
  // Image generation tool
  generate_image: imageGenerationTool,
  
  // Add more tools here as needed...
};

/**
 * Get all registered MCP tools
 * @returns Array of registered tools
 */
export const getAllTools = () => {
  return Object.values(toolsRegistry);
};