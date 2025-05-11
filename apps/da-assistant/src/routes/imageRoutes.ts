import { Router } from 'express';
import { ImageGenerationController } from '../controllers/imageGenerationController';

// Create router with explicit type annotation
const router: Router = Router();
const controller = new ImageGenerationController();

// GET /api/images/providers - List available image providers
router.get('/providers', controller.listProviders);

// POST /api/images/generate - Generate image(s) synchronously
router.post('/generate', controller.generateImage);

// POST /api/images/stream - Stream image generation updates
router.post('/stream', controller.streamImageGeneration);

// GET /api/images/:filename - Serve generated images
router.get('/:filename', controller.serveImage);

export default router;