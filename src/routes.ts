import { Router } from 'express';
import { FlowRoutes } from './features/flow';
import { WebhookRoutes } from './features/webhook';

export class AppRoutes {
	static get routes(): Router {
		const router = Router();
		router.use('/', FlowRoutes.routes);
		router.use('/', WebhookRoutes.routes);
		return router;
	}
}
