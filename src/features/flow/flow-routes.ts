import { Router } from 'express';
import { FlowController } from './flow-controller';

export class FlowRoutes {
	static get routes(): Router {
		const router = Router();
		router.post('/flow', FlowController.whatsAppFlow);
		router.get('/flow', FlowController.info);
		return router;
	}
}
