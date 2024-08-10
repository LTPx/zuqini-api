import { Router } from 'express';
import { WebhookController } from './webhook-controller';

export class WebhookRoutes {
	static get routes(): Router {
		const router = Router();
		router.post('/webhook', WebhookController.listener);
		router.get('/webhook', WebhookController.validator);
		return router;
	}
}
