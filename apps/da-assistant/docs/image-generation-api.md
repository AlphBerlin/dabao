# Image Generation API Documentation

The Da Assistant Image Generation API provides access to multiple AI image generation models through a unified interface. This API supports OpenAI's DALL-E, Google Imagen, Stable Diffusion, and custom third-party providers.

## Features

- **Multiple Provider Support**: Generate images using different AI models
- **Streaming Updates**: Get real-time updates on image generation progress
- **Image Storage**: Generated images are stored locally and served via API
- **API Keys**: Configure different providers with your own API keys
- **MCP Integration**: Built-in Model Context Protocol (MCP) support for AI assistants

## Configuration

Set up your API keys in the `.env` file based on the provided `sample.env`:

```env
# Image Generation Providers

# OpenAI (DALL-E)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_IMAGE_MODEL=dall-e-3

# Google Imagen
GOOGLE_API_KEY=your-google-api-key
GOOGLE_IMAGE_MODEL=gemini-1.5-pro

# Stable Diffusion via Replicate
REPLICATE_API_KEY=your-replicate-api-key
STABLE_DIFFUSION_MODEL=stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316

# Custom API Provider
CUSTOM_IMAGE_API_ENDPOINT=https://your-custom-image-api.com/api
CUSTOM_IMAGE_API_KEY=your-custom-api-key

# Storage Path for Generated Images
IMAGE_STORAGE_PATH=./storage/images
```

## API Endpoints

### List Available Providers

Returns a list of configured and available image generation providers.

**Endpoint**: `GET /api/images/providers`

**Sample curl command**:
```bash
curl -X GET http://localhost:3000/api/images/providers
```

**Sample response**:
```json
{
  "providers": ["openai", "google", "stable-diffusion"]
}
```

### Generate Image

Creates one or more images based on the provided prompt.

**Endpoint**: `POST /api/images/generate`

**Request Body**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| prompt | string | Yes | The text prompt describing what to generate |
| negativePrompt | string | No | Things to avoid in the generated image |
| provider | string | No | The specific provider to use (openai, google, stable-diffusion, custom) |
| size | string | No | Size of the image (256x256, 512x512, 1024x1024, 1024x1792, 1792x1024) |
| style | string | No | Style of the image (natural, vivid, anime, photographic, digital-art, cinematic) |
| quality | string | No | Quality level (standard, hd) |
| numberOfImages | number | No | Number of images to generate (1-4) |
| userId | string | No | User ID for tracking/billing |
| sessionId | string | No | Session ID for tracking |
| modelName | string | No | Specific model to use (provider-dependent) |
| customApiEndpoint | string | No | Only for custom provider: API endpoint |
| customApiKey | string | No | Only for custom provider: API key |

**Sample curl command**:
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A serene Japanese garden with cherry blossoms and a small pond",
    "provider": "openai",
    "size": "1024x1024",
    "style": "vivid",
    "quality": "hd",
    "numberOfImages": 1
  }'
```

**Sample response**:
```json
{
  "images": [
    {
      "url": "/api/images/a1b2c3d4.png",
      "provider": "openai",
      "prompt": "A serene Japanese garden with cherry blossoms and a small pond",
      "size": "1024x1024",
      "style": "vivid",
      "createdAt": "2025-05-11T09:30:45.123Z"
    }
  ],
  "prompt": "A serene Japanese garden with cherry blossoms and a small pond"
}
```

### Stream Image Generation

Provides real-time updates during the image generation process using Server-Sent Events (SSE).

**Endpoint**: `POST /api/images/stream`

**Request Body**: Same parameters as the `/generate` endpoint.

**Sample curl command**:
```bash
curl -X POST http://localhost:3000/api/images/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "prompt": "A futuristic cityscape with flying vehicles and neon lights",
    "provider": "stable-diffusion",
    "size": "1024x1024",
    "numberOfImages": 2
  }'
```

**Sample SSE events**:
```
data: {"status":"starting","message":"Starting image generation"}

data: {"status":"preparing","message":"Preparing to generate images"}

data: {"status":"progress","image":{"url":"/api/images/d4e5f6g7.png","provider":"stable-diffusion","prompt":"A futuristic cityscape with flying vehicles and neon lights","size":"1024x1024","createdAt":"2025-05-11T09:32:10.456Z"},"totalImages":2,"currentImage":1}

data: {"status":"progress","image":{"url":"/api/images/h8i9j0k1.png","provider":"stable-diffusion","prompt":"A futuristic cityscape with flying vehicles and neon lights","size":"1024x1024","createdAt":"2025-05-11T09:32:15.789Z"},"totalImages":2,"currentImage":2}

data: {"status":"completed","images":[{"url":"/api/images/d4e5f6g7.png","provider":"stable-diffusion","prompt":"A futuristic cityscape with flying vehicles and neon lights","size":"1024x1024","createdAt":"2025-05-11T09:32:10.456Z"},{"url":"/api/images/h8i9j0k1.png","provider":"stable-diffusion","prompt":"A futuristic cityscape with flying vehicles and neon lights","size":"1024x1024","createdAt":"2025-05-11T09:32:15.789Z"}],"prompt":"A futuristic cityscape with flying vehicles and neon lights"}
```

### Serve Generated Images

Retrieves a generated image file by its filename.

**Endpoint**: `GET /api/images/:filename`

**Sample curl command**:
```bash
curl -X GET http://localhost:3000/api/images/a1b2c3d4.png --output downloaded-image.png
```

## Using with AI Assistant

The image generation capability is integrated with Da Assistant through the MCP (Model Context Protocol). Users can simply ask the assistant to generate images:

```
User: "Generate an image of a cat wearing a space suit"